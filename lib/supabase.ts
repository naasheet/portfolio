/*
 * Supabase on the server (4.7): the contact form now, the leaderboard (9.x) and chat rate limits
 * (7.x) later. It uses the secret (service-role) key, so import it only from route handlers and
 * other server code, never from a client component: the key would end up in the browser bundle
 * (Next only inlines NEXT_PUBLIC_ variables, so it would be undefined there anyway).
 * Tables have RLS on with no public policies; this client is the only writer.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null | undefined;

/** The service-role client, or null when the environment isn't configured. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (admin !== undefined) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  admin =
    url && key
      ? createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;
  return admin;
}

/**
 * A salted SHA-256 of the visitor's IP (hex): rate limits never store the address itself.
 * Null without CHAT_SALT, so a misconfigured deploy fails closed instead of hashing unsalted.
 */
export async function hashIp(ip: string): Promise<string | null> {
  const salt = process.env.CHAT_SALT;
  if (!salt) return null;
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/** The client's IP as the platform reports it (Vercel and most proxies set x-forwarded-for). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
