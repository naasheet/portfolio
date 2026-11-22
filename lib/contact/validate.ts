/*
 * The contact form's rules (4.7), shared by the sheet (inline errors) and /api/contact (the
 * same check again on the server). Errors are codes; the sheet turns them into words from
 * content/copy.ts. Keep the limits in step with supabase/migrations/001_contact.sql.
 */

export const CONTACT_TOPICS = ["project", "collab", "hi"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const CONTACT_LIMITS = { name: 100, email: 254, message: 2000 } as const;

export type ContactInput = {
  topic: ContactTopic;
  name: string;
  email: string;
  message: string;
};

export type ContactField = keyof ContactInput;
export type ContactErrorCode =
  | "required"
  | "tooLong"
  | "emailFormat"
  /** Has an @ and a domain but no dot after it ("riya@studio"). */
  | "emailUnfinished"
  | "topic";
export type ContactErrors = Partial<Record<ContactField, ContactErrorCode>>;

const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;
const UNFINISHED = /^[^\s@]+@[^\s@.]+$/;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function checkField(
  field: ContactField,
  raw: unknown,
): ContactErrorCode | undefined {
  if (field === "topic") {
    return CONTACT_TOPICS.includes(raw as ContactTopic) ? undefined : "topic";
  }
  const value = str(raw);
  if (!value) return "required";
  if (value.length > CONTACT_LIMITS[field]) return "tooLong";
  if (field === "email") {
    if (UNFINISHED.test(value)) return "emailUnfinished";
    if (!EMAIL.test(value)) return "emailFormat";
  }
  return undefined;
}

/** Checks an untrusted body. On success, returns the trimmed values. */
export function validateContact(
  body: unknown,
): { ok: true; value: ContactInput } | { ok: false; errors: ContactErrors } {
  const b = (typeof body === "object" && body !== null ? body : {}) as Record<
    string,
    unknown
  >;
  const errors: ContactErrors = {};
  for (const field of ["topic", "name", "email", "message"] as const) {
    const code = checkField(field, b[field]);
    if (code) errors[field] = code;
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      topic: b.topic as ContactTopic,
      name: str(b.name),
      email: str(b.email),
      message: str(b.message),
    },
  };
}
