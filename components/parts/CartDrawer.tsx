"use client";

/**
 * Floating cart button + slide-over drawer with the checkout form. Posts to
 * /api/parts/checkout, which re-prices server-side and returns a Stripe
 * Checkout URL we redirect to. The cart only ever sends {partId, qty} plus the
 * customer/fulfillment fields — never prices.
 */

import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";

type Fulfillment = "ship" | "install";

export default function CartDrawer({ shippingFee, taxRate }: { shippingFee: number; taxRate: number }) {
  const { items, count, subtotal, remove, setQty, ready } = useCart();
  const [open, setOpen] = useState(false);

  // Open when something (e.g. the concierge add-to-cart link) asks us to.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("tsgc:open-cart", onOpen);
    return () => window.removeEventListener("tsgc:open-cart", onOpen);
  }, []);
  const [fulfillment, setFulfillment] = useState<Fulfillment>("ship");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [shipAddress, setShipAddress] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping = fulfillment === "ship" ? shippingFee : 0;
  const tax = Math.round((subtotal + shipping) * taxRate * 100) / 100;
  const total = subtotal + shipping + tax;

  async function checkout() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/parts/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ partId: i.partId, qty: i.qty })),
          firstName,
          lastName,
          phone,
          email,
          fulfillment,
          shipAddress,
          serviceAddress,
          preferredDate,
          preferredTime,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || "Checkout failed — please try again.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error — please try again.");
      setSubmitting(false);
    }
  }

  // Don't render the launcher until hydrated, so the count is correct.
  if (!ready) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-navy text-bone px-5 py-3 shadow-lg hover:bg-navy-700 transition"
        aria-label={`Open cart (${count} item${count === 1 ? "" : "s"})`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <span className="text-sm font-semibold">Cart</span>
        {count > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-burgundy px-1.5 text-xs font-bold">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Cart">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-bone shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-xl text-navy">Your Cart</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close cart" className="p-2 text-ink/60 hover:text-ink">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M6 18l12-12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <p className="text-ink/60 py-10 text-center">Your cart is empty.</p>
              ) : (
                <ul className="space-y-4">
                  {items.map((i) => (
                    <li key={i.partId} className="flex gap-3 border-b border-border pb-4">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-navy">
                          {i.brand} {i.name}
                        </p>
                        <p className="text-xs text-muted">#{i.partNumber}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <label className="sr-only" htmlFor={`qty-${i.partId}`}>
                            Quantity
                          </label>
                          <input
                            id={`qty-${i.partId}`}
                            type="number"
                            min={1}
                            max={10}
                            value={i.qty}
                            onChange={(e) => setQty(i.partId, Number(e.target.value))}
                            className="w-16 rounded-md border border-border bg-white px-2 py-1 text-sm"
                          />
                          <button type="button" onClick={() => remove(i.partId)} className="text-xs text-burgundy hover:underline">
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="text-right text-sm font-semibold text-navy whitespace-nowrap">
                        ${i.unitPrice * i.qty}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {items.length > 0 && (
                <div className="mt-6 space-y-4">
                  <fieldset>
                    <legend className="text-xs uppercase tracking-widest text-burgundy font-semibold">How would you like it?</legend>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {(["ship", "install"] as Fulfillment[]).map((f) => (
                        <label
                          key={f}
                          className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${
                            fulfillment === f ? "border-burgundy bg-burgundy/5 text-navy" : "border-border bg-white text-ink/70"
                          }`}
                        >
                          <input type="radio" name="fulfillment" value={f} checked={fulfillment === f} onChange={() => setFulfillment(f)} className="sr-only" />
                          {f === "ship" ? "Ship it to me" : "Install on a visit"}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="grid grid-cols-2 gap-2">
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="rounded-md border border-border bg-white px-3 py-2 text-sm" />
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="rounded-md border border-border bg-white px-3 py-2 text-sm" />
                  </div>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" inputMode="tel" className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (for your receipt)" inputMode="email" className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm" />

                  {fulfillment === "ship" ? (
                    <input value={shipAddress} onChange={(e) => setShipAddress(e.target.value)} placeholder="Shipping address" className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm" />
                  ) : (
                    <>
                      <input value={serviceAddress} onChange={(e) => setServiceAddress(e.target.value)} placeholder="Service address" className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} type="date" className="rounded-md border border-border bg-white px-3 py-2 text-sm" />
                        <input value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} placeholder="Preferred time" className="rounded-md border border-border bg-white px-3 py-2 text-sm" />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-border px-5 py-4 space-y-2">
                <div className="flex justify-between text-sm text-ink/75">
                  <span>Subtotal</span>
                  <span>${subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-ink/75">
                  <span>{fulfillment === "ship" ? "Shipping" : "Install (on your visit)"}</span>
                  <span>{shipping > 0 ? `$${shipping}` : "Free"}</span>
                </div>
                <div className="flex justify-between text-sm text-ink/75">
                  <span>Sales tax ({(taxRate * 100).toFixed(1)}%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-navy">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                {error && <p className="text-sm text-burgundy">{error}</p>}
                <button
                  type="button"
                  onClick={checkout}
                  disabled={submitting}
                  className="mt-2 w-full rounded-md bg-burgundy hover:bg-burgundy-700 disabled:opacity-60 text-bone px-4 py-3 font-semibold uppercase tracking-widest text-sm transition"
                >
                  {submitting ? "Starting checkout…" : "Continue to payment"}
                </button>
                <p className="text-[11px] text-muted text-center">Secure checkout by Stripe. Final price is confirmed at payment.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
