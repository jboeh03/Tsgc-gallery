import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE.name}`,
  description: `How ${SITE.name} collects, uses, and protects your information, including our SMS/text messaging privacy practices.`,
  alternates: { canonical: `${SITE.canonicalUrl}/privacy` },
};

const LAST_UPDATED = "June 17, 2026";

export default function PrivacyPage() {
  return (
    <div className="bg-bone">
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-14 md:py-16">
          <p className="uppercase tracking-widest text-bone/55 text-xs font-semibold">
            Legal
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl">Privacy Policy</h1>
          <p className="mt-4 text-bone/70 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-5 py-12 md:py-16">
          <div className="space-y-8 text-sm text-ink leading-relaxed">
            <p>
              {SITE.name} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), operated by {SITE.owner} in{" "}
              {SITE.cityState}, respects your privacy. This policy explains what information we collect when
              you use our website or services, how we use it, and the choices you have. By using our site
              or contacting us, you agree to the practices described here.
            </p>

            <Section title="Information We Collect">
              <p>We collect information you provide directly to us, including:</p>
              <ul className="mt-3 ml-5 list-disc space-y-1">
                <li>Your name, phone number, email address, and service address</li>
                <li>Details about your grill (brand, model, condition) and photos you upload</li>
                <li>Your scheduling preferences, promo codes, and how you heard about us</li>
                <li>Messages you send us by form, text, email, or phone</li>
              </ul>
              <p className="mt-3">
                We also collect limited technical information automatically (such as device and usage data)
                to operate and improve the site.
              </p>
            </Section>

            <Section title="How We Use Your Information">
              <ul className="ml-5 list-disc space-y-1">
                <li>To respond to quote requests and provide grill cleaning, inspection, and repair services</li>
                <li>To schedule appointments and send you appointment, quote, and service updates</li>
                <li>To send payment links and receipts for services you request</li>
                <li>To contact you about your account, requests, or our services</li>
                <li>To improve our services and comply with legal obligations</li>
              </ul>
            </Section>

            <Section title="SMS / Text Messaging">
              <p>
                If you provide your phone number and opt in, we may send you text messages related to your
                quote, scheduling, appointment confirmations, payment links, and service updates. Message
                frequency varies. Message and data rates may apply. You can opt out at any time by replying{" "}
                <strong>STOP</strong>, and you can reply <strong>HELP</strong> for assistance. See our{" "}
                <Link href="/sms-terms" className="text-navy underline">SMS Terms</Link> for full details.
              </p>
              <p className="mt-4 rounded-lg border border-border bg-bone px-5 py-4">
                <strong className="text-navy">No mobile information</strong> will be shared with third
                parties or affiliates for marketing or promotional purposes. The phone numbers and SMS
                consent (opt-in) we collect for text messaging are <strong>not shared with any third
                parties</strong>. We only use mobile/SMS data to deliver the messages you request, and we
                use trusted service providers (such as our SMS carrier) solely to send those messages on
                our behalf.
              </p>
            </Section>

            <Section title="How We Share Information">
              <p>
                We do not sell your personal information. We share information only with service providers
                who help us operate our business (for example, scheduling, payment processing, and SMS
                delivery), and only as needed to perform those services for us. We may also disclose
                information if required by law or to protect our rights, safety, or property.
              </p>
            </Section>

            <Section title="Data Retention &amp; Security">
              <p>
                We keep your information for as long as needed to provide our services and meet legal,
                accounting, or reporting requirements. We use reasonable administrative and technical
                safeguards to protect your information, though no method of transmission or storage is
                completely secure.
              </p>
            </Section>

            <Section title="Your Choices">
              <ul className="ml-5 list-disc space-y-1">
                <li>Opt out of texts at any time by replying STOP</li>
                <li>Unsubscribe from emails using the link in any marketing email</li>
                <li>Request access to, correction of, or deletion of your information by contacting us</li>
              </ul>
            </Section>

            <Section title="Children&apos;s Privacy">
              <p>
                Our services are not directed to children under 13, and we do not knowingly collect
                personal information from children under 13.
              </p>
            </Section>

            <Section title="Changes to This Policy">
              <p>
                We may update this policy from time to time. When we do, we will revise the &quot;Last
                updated&quot; date above. Your continued use of our site or services after changes take
                effect constitutes acceptance of the updated policy.
              </p>
            </Section>

            <Section title="Contact Us">
              <p>
                Questions about this policy or your information? Contact us at{" "}
                <a href={SITE.emailHref} className="text-navy underline">{SITE.email}</a> or{" "}
                <a href={SITE.phoneHref} className="text-navy underline">{SITE.phone}</a>.
              </p>
              <p className="mt-2">{SITE.name} · {SITE.cityState}</p>
            </Section>
          </div>

          <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/sms-terms" className="text-navy underline underline-offset-4">SMS Terms</Link>
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
