"use client";

import { ArrowRight } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Sheet } from "@/components/overlay/Sheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextField } from "@/components/ui/TextField";
import { copy } from "@/content/copy";
import { profile } from "@/content/profile";
import {
  CONTACT_LIMITS,
  CONTACT_TOPICS,
  checkField,
  type ContactErrorCode,
  type ContactErrors,
  type ContactField,
  type ContactTopic,
} from "@/lib/contact/validate";
import { island } from "@/lib/island";

const t = copy.contact.sheet;

type Values = {
  topic: ContactTopic;
  name: string;
  email: string;
  message: string;
};
const EMPTY: Values = { topic: "project", name: "", email: "", message: "" };
const FIELDS: readonly ContactField[] = ["topic", "name", "email", "message"];

function errorText(
  field: ContactField,
  code: ContactErrorCode | undefined,
): string | undefined {
  if (!code) return undefined;
  switch (code) {
    case "required":
      return field === "topic" ? t.errors.topic : t.errors.required[field];
    case "tooLong":
      return field === "topic"
        ? t.errors.topic
        : t.errors.tooLong(CONTACT_LIMITS[field]);
    case "emailFormat":
      return t.errors.emailFormat;
    case "emailUnfinished":
      return t.errors.emailUnfinished;
    case "topic":
      return t.errors.topic;
  }
}

/**
 * The message form (4.7; "Contact — message sheet open" frame) in 1.5's Sheet: topic chips, name,
 * email, message (with a counter) and a hidden honeypot. Errors appear on blur and on submit,
 * from the same rules the server uses (lib/contact/validate.ts); server errors come back as JSON
 * and land on their field or above Send. On success the sheet closes, the form resets and the
 * island confirms ("Message sent · I'll reply within a day.").
 */
export function ContactSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const formId = useId();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<ContactField, boolean>>
  >({});
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const set = (field: Exclude<ContactField, "topic">) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    // Once a field has shown an error, re-check it as the visitor types.
    if (touched[field])
      setErrors((e) => ({ ...e, [field]: checkField(field, value) }));
  };

  const blur = (field: ContactField) => () => {
    setTouched((tch) => ({ ...tch, [field]: true }));
    setErrors((e) => ({ ...e, [field]: checkField(field, values[field]) }));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    const found: ContactErrors = {};
    for (const f of FIELDS) {
      const code = checkField(f, values[f]);
      if (code) found[f] = code;
    }
    setErrors(found);
    setTouched({ topic: true, name: true, email: true, message: true });
    setFormError(null);
    const first = FIELDS.find((f) => found[f]);
    if (first) {
      document.getElementById(`${formId}-${first}`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: honeypot }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        errors?: ContactErrors;
      };
      if (res.ok && data.ok) {
        setValues(EMPTY);
        setErrors({});
        setTouched({});
        onClose();
        island.alert({
          icon: "check",
          tone: "teal",
          text: copy.contact.sent,
          detail: copy.contact.success,
        });
        return;
      }
      if (data.error === "invalid" && data.errors) {
        setErrors(data.errors);
        return;
      }
      setFormError(res.status === 429 ? t.errors.rateLimited : t.errors.failed);
    } catch {
      setFormError(
        navigator.onLine === false ? t.errors.offline : t.errors.failed,
      );
    } finally {
      setStatus("idle");
    }
  };

  const err = (f: ContactField) =>
    touched[f] ? errorText(f, errors[f]) : undefined;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t.title}
      closeLabel={t.close}
      footer={
        <div className="flex w-full flex-col gap-4">
          {formError ? (
            <p role="alert" className="text-footnote text-status-danger">
              {formError}
            </p>
          ) : null}
          <Button
            type="submit"
            form={formId}
            size="lg"
            loading={status === "sending"}
            trailingIcon={<ArrowRight />}
            className="w-full"
          >
            {t.send}
          </Button>
          <p className="text-center text-footnote text-text-secondary">
            {t.direct}{" "}
            <a
              href={`mailto:${profile.email}`}
              className="rounded-[2px] font-mono text-text-primary underline decoration-border-default underline-offset-4 hover:decoration-text-primary"
            >
              {profile.email}
            </a>
          </p>
        </div>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={submit}
        className="flex flex-col gap-6"
      >
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-subhead text-text-secondary">
            {t.topic}
          </legend>
          <div className="flex flex-wrap gap-2">
            {CONTACT_TOPICS.map((topic) => (
              <Chip
                key={topic}
                id={topic === values.topic ? `${formId}-topic` : undefined}
                tone="solid"
                selected={values.topic === topic}
                onClick={() => setValues((v) => ({ ...v, topic }))}
              >
                {copy.contact.topics[topic]}
              </Chip>
            ))}
          </div>
          {err("topic") ? (
            <p className="text-footnote text-status-danger">{err("topic")}</p>
          ) : null}
        </fieldset>

        <TextField
          id={`${formId}-name`}
          label={t.name}
          name="name"
          autoComplete="name"
          maxLength={CONTACT_LIMITS.name}
          value={values.name}
          onChange={(e) => set("name")(e.target.value)}
          onBlur={blur("name")}
          error={err("name")}
        />
        <TextField
          id={`${formId}-email`}
          label={t.email}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={CONTACT_LIMITS.email}
          value={values.email}
          onChange={(e) => set("email")(e.target.value)}
          onBlur={blur("email")}
          error={err("email")}
        />
        <TextField
          multiline
          id={`${formId}-message`}
          label={t.message}
          name="message"
          maxLength={CONTACT_LIMITS.message}
          value={values.message}
          onChange={(e) => set("message")(e.target.value)}
          onBlur={blur("message")}
          error={err("message")}
          hint={`${values.message.length} / ${CONTACT_LIMITS.message}`}
          hintEnd={<span className="hidden md:inline">{t.escHint}</span>}
        />

        {/* Honeypot: off screen and out of the tab order; people never fill it, bots do. */}
        <div
          aria-hidden
          className="absolute -left-[10000px] h-px w-px overflow-hidden"
        >
          <label>
            {t.honeypot}
            <input
              tabIndex={-1}
              autoComplete="off"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>
        </div>
      </form>
    </Sheet>
  );
}
