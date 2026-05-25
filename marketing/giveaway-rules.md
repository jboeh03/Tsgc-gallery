# Official Rules — Weber Spirit II Giveaway
## Tri-State Grill Cleaning

> **Note for sponsor (Jeff Boeh):** These rules represent a good-faith sweepstakes
> structure drafted to match your stated mechanics. Have an attorney review before
> the campaign goes live — particularly regarding state-specific sweepstakes
> registration thresholds (several states require registration/bonding for prizes
> above certain ARVs).

---

## NO PURCHASE NECESSARY TO ENTER OR WIN.
**A purchase will not increase your chances of winning.**

---

### 1. Sponsor

Tri-State Grill Cleaning ("Sponsor"), operated by Jeff Boeh, Cincinnati, OH 45233.
Website: https://tristategrillcleaning.com
Email: jeff@cincygrillcleaning.com
Phone: (657) 831-4276

---

### 2. No Purchase Necessary

No purchase or payment of any kind is necessary to enter or win this Giveaway.
A purchase will not increase your chances of winning. Booking a cleaning service
with Sponsor may earn bonus entries (see Section 6), but the free on-site entry
method described in Section 5 is always available and constitutes the "no purchase
necessary" alternative method of entry.

---

### 3. Eligibility

Open to legal residents of the greater Cincinnati, Ohio; Northern Kentucky; and
Dayton, Ohio service area as defined by the Sponsor's eligible ZIP codes (see
https://tristategrillcleaning.com/giveaway for the eligible ZIP code list), who
are 18 years of age or older at the time of entry.

Void outside the eligible service area and where prohibited or restricted by law.
Employees of Sponsor, their immediate family members (spouse, parent, child,
sibling, and their spouses), and household members are not eligible.

Entrants must provide a valid U.S. mailing address within the eligible service
area for prize delivery if selected as a winner.

---

### 4. Entry Period

The Giveaway begins at **Friday, June 26, 2026 at 12:00 AM EDT** and ends at
**Saturday, July 4, 2026 at 11:59 PM EDT** ("Entry Period"). Entries submitted
before the start or after the end of the Entry Period are void. Sponsor's computer
is the official clock for this Giveaway.

---

### 5. How to Enter — Free Method

To enter without any purchase, visit https://tristategrillcleaning.com/giveaway
during the Entry Period and complete the entry form by providing:

- First and last name
- Valid email address
- Valid phone number
- ZIP code within the eligible service area
- Confirmation that you are 18+ and a service-area resident

Submitting the completed form awards **1 base entry**. Limit one base entry per
person per email address. Duplicate email submissions will be flagged and only
the first valid entry will be counted.

---

### 6. Bonus Entry Methods

Entrants may earn additional entries (up to a maximum of **5 total entries per person**)
through the following bonus actions. All bonus entries are self-attested on the entry
form. Sponsor reserves the right to verify any claimed bonus entry and to disqualify
entries where verification fails.

| Bonus Action | Additional Entries |
|---|---|
| Book a grill cleaning with Sponsor during or prior to the Entry Period | +3 entries |
| Share the official Giveaway post on Facebook or Instagram | +1 entry |
| Follow Tri-State Grill Cleaning on Facebook or Instagram | +1 entry |

**Booking bonus details:** Check the "Book a cleaning" box on the entry form and
provide a booking reference (name, phone number, or appointment date used to book).
Sponsor will cross-reference booking records before the draw. No purchase is
necessary to enter — this is a bonus only.

**Social bonus details:** Tagging another user in the post is encouraged but is
**not** required to earn the social share bonus or to enter the Giveaway. Requiring
tags as a condition of entry would violate Facebook's and Instagram's promotion
policies, and Sponsor does not make tagging a condition of any kind.

**Entry cap:** Maximum 5 entries per person regardless of actions completed.

---

### 7. Prizes

Three (3) winners will be selected:

| Place | Prize | Approximate Retail Value |
|---|---|---|
| Grand Prize (1 winner) | Fully cleaned and restored Weber Spirit II gas grill, personally serviced by Jeff Boeh | $350–$500 |
| 2nd Prize (1 winner) | One professional grill cleaning — any model, any size — in the service area | $150–$250 |
| 3rd Prize (1 winner) | One annual cleaning membership | $200+ |

Prizes are non-transferable and have no cash value. No substitution of prizes except
at Sponsor's sole discretion. All taxes on prizes are the sole responsibility of the
winner. Sponsor will provide a 1099 form to any winner whose prize value exceeds $600.

Grand Prize grill will be delivered to winner within the eligible service area or
available for local pickup — winner and Sponsor will coordinate logistics. Service
prizes are redeemable within one (1) year of winner notification and within the
eligible service area.

---

### 8. Winner Selection

Winners will be selected by random draw from all valid entries received during the
Entry Period. The draw is performed using the `runGiveawayDraw()` function in
Sponsor's Google Apps Script environment (source code in `/integrations/apps-script-endpoint.js`),
which:

- Reads all valid entries from the "🎁 Giveaway Entries" tracking sheet (duplicates
  are flagged and excluded prior to the draw)
- Builds a weighted entry pool in which each entrant appears once per earned entry
  (maximum 5 times)
- Applies a Fisher-Yates shuffle to produce a random permutation of the pool
- Selects three unique winners from the shuffled pool (unique by email address)
- Logs the total pool size, each winner's name, email, and Entry ID for
  documentation and odds calculation

Booking bonus entries claimed on the form are subject to verification against
Sponsor's booking records prior to the draw. Unverified booking bonuses will be
removed and the entry adjusted (base entries and other verified bonuses remain valid).

The random draw is conducted by Sponsor. Sponsor's decisions are final and binding
on all matters relating to the Giveaway.

---

### 9. Winner Notification

Potential winners will be notified by email and/or phone within three (3) business
days of the draw (on or around Tuesday, July 7, 2026). Winners must respond within
five (5) business days of the notification. Failure to respond may result in
forfeiture of the prize, and an alternate winner may be selected.

Sponsor reserves the right to verify eligibility of each potential winner before
awarding any prize. Sponsor may require a signed affidavit of eligibility and/or
a liability and publicity release as a condition of receiving a prize.

---

### 10. Odds of Winning

Odds depend on the total number of valid entries received and the number of entries
credited to each entrant. Entries are weighted — an entrant with 5 entries has a
proportionally higher chance of selection than one with 1 entry. After the Entry
Period closes, Sponsor logs the total weighted pool size in the draw record. Each
entry in the pool has a 1/[pool size] chance of being drawn.

---

### 11. General Conditions

- Sponsor reserves the right to cancel, suspend, or modify the Giveaway if fraud,
  technical failures, or any other factor impairs the integrity of the Giveaway.
- Any attempt to undermine the legitimate operation of the Giveaway may be a
  violation of criminal and civil law, and Sponsor reserves the right to seek
  damages to the fullest extent permitted by law.
- This Giveaway is in no way sponsored, endorsed, administered by, or associated
  with Facebook or Instagram. Entrants release Facebook and Instagram from any and
  all liability arising from their participation.
- Void where prohibited, taxed, or restricted by law.

---

### 12. Limitation of Liability

By entering, entrants agree to release and hold harmless Sponsor and its officers,
directors, employees, and agents from and against any claim or cause of action
arising out of participation in the Giveaway or receipt or use of any prize,
including, but not limited to: (a) any technical errors; (b) unauthorized human
intervention; (c) printing errors; or (d) any injury or damage to persons or
property caused directly or indirectly by participation in the Giveaway.

---

### 13. Governing Law

These Official Rules are governed by the laws of the State of Ohio without regard
to conflict-of-law principles. Any legal proceedings shall be brought exclusively
in the state or federal courts located in Hamilton County, Ohio.

---

### 14. Privacy

Information collected through entry forms is used solely to administer the Giveaway,
notify and verify winners, and — if the entrant opts in — to contact them about
future Tri-State Grill Cleaning services and promotions. Sponsor will not sell or
share entrant information with third parties for marketing purposes.

---

### 15. Winners List

To request a list of winners (available after Tuesday, July 7, 2026), email
jeff@cincygrillcleaning.com with "Giveaway Winners List Request" in the subject line.

---

*© 2026 Tri-State Grill Cleaning. All rights reserved.*

---

## Sponsor Checklist Before Launch

- [ ] Confirm and insert all placeholder dates (Entry Period open/close, announcement)
- [ ] Attorney review completed
- [ ] Verify giveaway registration requirements for OH and KY (check state thresholds)
- [ ] Update placeholder dates in `lib/giveaway.ts` display strings
- [ ] Drop real Weber Spirit II photos in `/public/giveaway/` (before + after)
- [ ] Deploy updated Apps Script as a new version
- [ ] Add `GIVEAWAY2026` to PROMO_CODES in deployed Apps Script
- [ ] Test the entry form end-to-end: submit, confirm Sheets row, confirm email auto-reply
- [ ] Run `npm run build` and `npm run typecheck` — confirm zero errors
- [ ] Publish to production (Vercel deploy)
- [ ] Pin Facebook/Instagram post on launch day
