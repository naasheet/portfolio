/*
 * contact (6.5): write me a message from the terminal. Asks for name, email and message (each
 * checked with the sheet's own rules, re-asked until it passes), shows a summary, asks y/n, then
 * posts to /api/contact like the sheet does. Ctrl+C cancels at any prompt or while sending
 * (ctx.prompt rejects, ctx.signal aborts the fetch).
 */
import { copy } from "@/content/copy";
import { terminalCopy } from "@/content/terminal";
import {
  CONTACT_LIMITS,
  CONTACT_TOPICS,
  checkField,
  type ContactErrorCode,
  type ContactTopic,
} from "@/lib/contact/validate";
import type { Command, CommandContext } from "./types";

const t = terminalCopy.commands.contact;
const errors = copy.contact.sheet.errors;

type TextField = "name" | "email" | "message";

/** The sheet's words for an error code (content/copy.ts). */
function errorText(field: TextField | "topic", code: ContactErrorCode): string {
  switch (code) {
    case "required":
      return field === "topic" ? errors.topic : errors.required[field];
    case "tooLong":
      return errors.tooLong(field === "topic" ? 0 : CONTACT_LIMITS[field]);
    case "emailFormat":
      return errors.emailFormat;
    case "emailUnfinished":
      return errors.emailUnfinished;
    case "topic":
      return errors.topic;
  }
}

/** Ask until the answer passes the field's rule. */
async function askField(
  ctx: CommandContext,
  field: TextField,
  question: string,
): Promise<string> {
  for (;;) {
    const value = (await ctx.prompt(question)).trim();
    const code = checkField(field, value);
    if (!code) return value;
    ctx.print({ kind: "error", text: errorText(field, code) });
  }
}

type Response = {
  ok: boolean;
  error?: string;
  errors?: Record<string, string>;
};

export const contact: Command = {
  name: "contact",
  category: "site",
  description: t.description,
  usage: t.usage,
  examples: ["contact", "contact --topic=project"],
  complete: () => CONTACT_TOPICS.map((topic) => `--topic=${topic}`),
  async run(args, ctx) {
    const flag = args.flags.topic;
    const topic = (typeof flag === "string" ? flag : "hi") as ContactTopic;
    if (!CONTACT_TOPICS.includes(topic)) {
      ctx.printError(
        terminalCopy.commands.oneOf("contact", String(flag), CONTACT_TOPICS),
      );
      return;
    }
    ctx.print({ kind: "text", text: t.intro, tone: "muted" });
    const name = await askField(ctx, "name", t.name);
    const email = await askField(ctx, "email", t.email);
    const message = await askField(ctx, "message", t.message);

    ctx.print([
      { kind: "text", text: t.summary },
      {
        kind: "table",
        rows: [
          [t.labels.topic, copy.contact.topics[topic]],
          [t.labels.name, name],
          [t.labels.email, email],
          [t.labels.message, message],
        ],
      },
    ]);
    for (;;) {
      const answer = (await ctx.prompt(t.confirm)).trim().toLowerCase();
      if (answer === "n" || answer === "no") {
        ctx.print({ kind: "text", text: t.cancelled, tone: "muted" });
        return;
      }
      if (answer === "y" || answer === "yes") break;
      ctx.print({ kind: "text", text: t.yesNo, tone: "muted" });
    }

    ctx.status({ kind: "text", text: t.sending, tone: "muted" });
    let res: globalThis.Response;
    try {
      res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // `website` is the honeypot: always empty from a person.
        body: JSON.stringify({ topic, name, email, message, website: "" }),
        signal: ctx.signal,
      });
    } catch (error) {
      if (ctx.signal.aborted) throw error;
      ctx.printError(errors.offline);
      return;
    }
    const body = (await res.json().catch(() => ({ ok: false }))) as Response;
    if (res.ok && body.ok) {
      ctx.print({ kind: "text", text: t.sent, tone: "accent" });
      return;
    }
    if (body.error === "invalid" && body.errors) {
      for (const [field, code] of Object.entries(body.errors))
        ctx.printError(
          errorText(field as TextField | "topic", code as ContactErrorCode),
        );
      return;
    }
    ctx.printError(
      body.error === "rateLimited" ? errors.rateLimited : errors.failed,
    );
  },
};
