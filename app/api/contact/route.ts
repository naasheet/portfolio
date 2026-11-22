/*
 * POST /api/contact (4.7). Body: { topic, name, email, message, website }.
 * 1. Invalid JSON → 400. A filled honeypot (`website`) → 200 { ok: true }, nothing stored or sent.
 * 2. The same rules as the sheet (lib/contact/validate.ts) → 422 { error: "invalid", errors }.
 * 3. A salted hash of the IP; submit_contact_message() counts and inserts atomically → 429
 *    { error: "rateLimited" } from the 6th message in an hour.
 * 4. If EMAIL_API_KEY is set, Resend emails profile.email (reply-to: the sender). A failed email
 *    doesn't fail the request: the message is already stored.
 * Missing configuration → 503 { error: "unavailable" }; a database error → 500 { error: "failed" }.
 */
import { copy } from "@/content/copy";
import { profile } from "@/content/profile";
import { validateContact, type ContactInput } from "@/lib/contact/validate";
import { clientIp, getSupabaseAdmin, hashIp } from "@/lib/supabase";

export type ContactResponse =
  | { ok: true }
  | {
      ok: false;
      error:
        "badRequest" | "invalid" | "rateLimited" | "unavailable" | "failed";
      errors?: Record<string, string>;
    };

const json = (body: ContactResponse, status: number, headers?: HeadersInit) =>
  Response.json(body, { status, headers });

async function sendEmail(value: ContactInput): Promise<void> {
  const key = process.env.EMAIL_API_KEY;
  if (!key) return;
  const mail = copy.contact.email;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Resend's shared sender works without a verified domain (it delivers to the account's
        // own address, which is profile.email). Switch to your domain once it's verified (11.1).
        from: mail.from,
        to: [profile.email],
        reply_to: value.email,
        subject: mail.subject(copy.contact.topics[value.topic], value.name),
        text: mail.body(
          value.name,
          value.email,
          copy.contact.topics[value.topic],
          value.message,
        ),
      }),
    });
    if (!res.ok)
      console.error("[contact] email failed", res.status, await res.text());
  } catch (error) {
    console.error("[contact] email failed", error);
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "badRequest" }, 400);
  }
  if (typeof body !== "object" || body === null) {
    return json({ ok: false, error: "badRequest" }, 400);
  }

  // Bots fill every field; people never see this one. Pretend it worked.
  const honeypot = (body as Record<string, unknown>).website;
  if (typeof honeypot === "string" && honeypot.trim() !== "")
    return json({ ok: true }, 200);

  const checked = validateContact(body);
  if (!checked.ok)
    return json({ ok: false, error: "invalid", errors: checked.errors }, 422);

  const supabase = getSupabaseAdmin();
  const ipHash = await hashIp(clientIp(request));
  if (!supabase || !ipHash) {
    console.error("[contact] Supabase or CHAT_SALT is not configured");
    return json({ ok: false, error: "unavailable" }, 503);
  }

  const { topic, name, email, message } = checked.value;
  const { data: stored, error } = await supabase.rpc("submit_contact_message", {
    p_topic: topic,
    p_name: name,
    p_email: email,
    p_message: message,
    p_ip_hash: ipHash,
  });
  if (error) {
    console.error("[contact] insert failed", error.message);
    return json({ ok: false, error: "failed" }, 500);
  }
  if (stored !== true) {
    return json({ ok: false, error: "rateLimited" }, 429, {
      "Retry-After": "3600",
    });
  }

  await sendEmail(checked.value);
  return json({ ok: true }, 200);
}
