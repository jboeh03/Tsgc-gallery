import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `SMS Terms & Conditions | ${SITE.name}`,
  description: `Terms and conditions for the ${SITE.name} text messaging program: message types, frequency, rates, and how to opt out (STOP) or get help (HELP).`,
  alternates: { canonical: `${SITE.canonicalUrl}/sms-terms` },
};

const LAST_UPDATED = "June 17, 2026";

export default function SmsTermsPage() {
  return (
    <div className="bg-bone">
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-14 md:py-16">
          <p className="uppercase tracking-widest text-bone/55 text-xs font-semibold">
            Legal
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl">SMS Terms &amp; Conditions</h1>
          <p className="mt-4 text-bone/70 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-5 py-12 md:py-16">
          <div className="space-y-8 text-sm text-ink leading-relaxed">
            <p>
              These SMS Terms &amp; Conditions govern the text messaging program offered by {SITE.name}{" "}
              (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By providing your mobile number and
              opting in on one of our forms or by texting us, you agree to these terms.
            </p>

            <Section title="Program Description">
              <p>
                When you opt in, we send text messages related to your interaction with us — including quote
                responses, appointment scheduling and confirmations, payment links, service updates, and
                replies to your questions. Messages are sent by {SITE.name}.
              </p>
            </Section>

            <Section title="How to Opt In">
              <p>
                You opt in by checking the SMS consent box on one of our forms (such as the quote or booking
                form) and submitting your mobile number, or by texting us first. Consent to receive texts is
                not a condition of purchasing any goods or services.
              </p>
            </Section>

            <Section title="Message Frequency">
              <p>
                Message frequency varies based on your interactions with us — for example, messages tied to a
                quote request, scheduling a service, or confirming an appointment.
              </p>
            </Section>

            <Section title="Message &amp; Data Rates">
              <p>
                Message and data rates may apply. These charges are billed by and payable to your mobile
                service provider. Please contact your carrier for details about your plan.
              </p>
            </Section>

            <Section title="Opt Out — Reply STOP">
              <p>
                You can cancel the SMS program at any time by texting <strong>STOP</strong> to the number you
                are messaging with. After you send STOP, we will send a one-time confirmation that you have
                been unsubscribed, and you will no longer receive texts from that program. To rejoin, opt in
                again as described above.
              </p>
            </Section>

            <Section title="Help — Reply HELP">
              <p>
                For help, reply <strong>HELP</strong> to any of our messages, or contact us at{" "}
                <a href={SITE.phoneHref} className="text-navy underline">{SITE.phone}</a> or{" "}
                <a href={SITE.emailHref} className="text-navy underline">{SITE.email}</a>.
              </p>
            </Section>

            <Section title="Carriers Not Liable">
              <p>
                Carriers are not liable for delayed or undelivered messages. Delivery of messages is subject
                to effective transmission by your wireless carrier and is not guaranteed.
              </p>
            </Section>

            <Section title="Privacy">
              <p>
                Your mobile information is handled in accordance with our{" "}
                <Link href="/privacy" className="text-navy underline">Privacy Policy</Link>. No mobile
                information will be shared with third parties or affiliates for marketing or promotional
                purposes, and SMS opt-in consent is not shared with any third parties.
              </p>
            </Section>

            <Section title="Changes to These Terms">
              <p>
                We may update these terms from time to time. Changes take effect when posted, and we will
                update the &quot;Last updated&quot; date above.
              </p>
            </Section>

            <Section title="Contact Us">
              <p>
                {SITE.name} · {SITE.cityState} ·{" "}
                <a href={SITE.phoneHref} className="text-navy underline">{SITE.phone}</a> ·{" "}
                <a href={SITE.emailHref} className="text-navy underline">{SITE.email}</a>
              </p>
            </Section>
          </div>

          <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/privacy" className="text-navy underline underline-offset-4">Privacy Policy</Link>
            <Link href="/" className="text-navy underline underline-offset-4">← Back home</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-lg md:text-xl text-navy uppercase tracking-wide border-b border-border pb-2 mb-4">
        {title}
      </h2>
      <div className="text-sm text-ink leading-relaxed">{children}</div>
    </div>
  );
}
