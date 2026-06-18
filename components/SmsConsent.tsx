"use client";

import Link from "next/link";
import { SITE } from "@/lib/site";

/**
 * A2P 10DLC-compliant SMS opt-in checkbox. Carrier campaign vetting requires a
 * clear, express opt-in wherever we collect a textable number, with message
 * purpose, "msg & data rates", frequency, STOP/HELP keywords, and links to the
 * SMS Terms + Privacy Policy. Used on every customer form that captures a phone.
 *
 * Controlled via React state (no form `name`) so each form passes an explicit
 * `smsConsent: true` boolean in its payload for the audit trail. Forms must also
 * validate `checked` in JS — `required` alone won't fire on `noValidate` forms.
 */
export default function SmsConsent({
  checked,
  onChange,
  id = "smsConsent",
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  id?: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-2.5 text-xs text-muted leading-relaxed cursor-pointer">
      <input
        id={id}
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-[18px] w-[18px] accent-burgundy mt-px shrink-0"
      />
      <span>
        I agree to receive text messages from {SITE.name} about my quote, scheduling, and service at the
        number provided. Msg &amp; data rates may apply. Message frequency varies. Reply STOP to opt out,
        HELP for help. See our{" "}
        <Link href="/sms-terms" className="underline text-navy">SMS Terms</Link> and{" "}
        <Link href="/privacy" className="underline text-navy">Privacy Policy</Link>.
      </span>
    </label>
  );
}
