"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import styles from "./contact.module.css";

const TOPICS = [
  "General inquiry",
  "Partnership",
  "Deploying SurgeShield",
  "Technical / API support",
  "Other",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Partial<Record<"firstName" | "lastName" | "email" | "message", string>>;

export default function ContactForm() {
  const submit = useMutation(api.contact.submitContactMessage);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [formError, setFormError] = useState<string | null>(null);

  function validate(): Errors {
    const e: Errors = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!lastName.trim()) e.lastName = "Required";
    if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email";
    if (!message.trim()) e.message = "Required";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setStatus("sending");
    try {
      await submit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        organization: organization.trim() || undefined,
        topic,
        message: message.trim(),
      });
      setStatus("sent");
    } catch (err) {
      setStatus("idle");
      setFormError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    }
  }

  if (status === "sent") {
    return (
      <div className={styles["form-card"]}>
        <div className={styles.success}>
          <span className={styles["success-ic"]}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <h2>Message sent</h2>
          <p>
            Thanks, {firstName.trim() || "there"} — we&apos;ve received your message
            and will get back to you within one business day.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["form-card"]}>
      <h2>Send us a message</h2>
      <p className={styles["fc-sub"]}>
        Fill out the form and our team will get back to you within one business day.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles["field-row"]}>
          <div className={styles.field}>
            <label htmlFor="fn">
              First name <span className={styles.req}>*</span>
            </label>
            <input
              type="text"
              id="fn"
              placeholder="Ghislain"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && <p className={styles["field-error"]}>{errors.firstName}</p>}
          </div>
          <div className={styles.field}>
            <label htmlFor="ln">
              Last name <span className={styles.req}>*</span>
            </label>
            <input
              type="text"
              id="ln"
              placeholder="Nkeneng"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName && <p className={styles["field-error"]}>{errors.lastName}</p>}
          </div>
        </div>

        <div className={styles["field-row"]}>
          <div className={styles.field}>
            <label htmlFor="em">
              Email <span className={styles.req}>*</span>
            </label>
            <input
              type="email"
              id="em"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className={styles["field-error"]}>{errors.email}</p>}
          </div>
          <div className={styles.field}>
            <label htmlFor="org">Organization</label>
            <input
              type="text"
              id="org"
              placeholder="City council, NGO, university..."
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="topic">What is this about?</label>
          <select
            id="topic"
            className={styles.sel}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="msg">
            Message <span className={styles.req}>*</span>
          </label>
          <textarea
            id="msg"
            placeholder="Tell us how we can help..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={!!errors.message}
          />
          {errors.message && <p className={styles["field-error"]}>{errors.message}</p>}
        </div>

        <button type="submit" className={styles["btn-send"]} disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send Message"}
          {status !== "sending" && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          )}
        </button>
        {formError && <p className={styles["form-error"]}>{formError}</p>}
        <p className={styles["form-note"]}>
          By submitting, you agree to our Privacy Policy. We never share your details.
        </p>
      </form>
    </div>
  );
}
