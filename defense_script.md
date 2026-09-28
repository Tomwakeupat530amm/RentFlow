# RentFlow — Defense Speaker Script

Talk track for the 17-slide deck (`RentFlow_Defense.pptx`). English, to match the slides and report.
Target ~12–13 minutes + Q&A. One idea per slide; the slide is terse, you fill the detail.

**Delivery tips**
- Advance the slide first, then start the sentence tied to it. Don't read bullets aloud — say the claim, point at the box.
- Numbers to keep exact: **10,500,000 đ** monthly revenue · **3 of 6** rooms rented · **50%** fill · **3,500,000 đ** rent-only invoice.
- When you hit the meter defect, say it plainly and move on. You lose more by hiding it than by owning it.
- If the live app misbehaves, switch to the screenshot on slide 15 and keep talking. Never debug live.

---

## Slide 1 — Title  (~30s)

"Good morning. My name is Nghiêm Phú Khang, student ID BI12-204, Data Science. My thesis is the
design and implementation of RentFlow — a web-based, multi-tenant system that helps Vietnamese
landlords run a rental business. The whole product is built around one monthly chain: onboarding a
tenant, reading the meters, generating the invoice, taking payment, and seeing it all on a dashboard.
I'll walk through the problem, the design decisions, the architecture, that central flow, and an
honest look at what works and what doesn't yet."

*[Click to slide 2.]*

## Slide 2 — Context  (~50s)

"This is the problem. A landlord in Vietnam runs a repetitive monthly cycle by hand. Every room, every
month: read the electricity and water meter, multiply by a unit price, add rent and fixed fees like
internet and rubbish, produce an invoice, collect the money, update the books. Across several
buildings and dozens of rooms, the records live in separate notebooks, spreadsheets, and memory. One
missed meter reading or one mistyped price silently produces a wrong invoice. There is no single
source of truth per room, and no quick answer to 'how much did I collect this month, which rooms are
empty, which bills are overdue.' RentFlow puts that whole cycle in one place with the math done by
software."

*[Click.]*

## Slide 3 — Objective  (~40s)

"From that problem I set seven objectives, and each one maps to a delivered module — I'll show them in
Chapter IV. Organization and access with roles; buildings and rooms with per-building prices; tenants
and contracts; the monthly operations, meter entry and invoicing, which is the heart; online payment;
operations support — incidents, expenses, dashboard; and a separate tenant self-service portal.
Highlighted is objective four, monthly operations, because that's where the thesis lives."

*[Click.]*

## Slide 4 — Scope  (~40s)

"I want to be precise about scope up front, so nothing looks more finished than it is. In scope, on the
left, are the seven objectives, all delivered and evidenced. Explicitly out of scope, on the right, in
red: fully automated payment reconciliation — matching a transfer to an invoice is partly manual; a
cryptographically binding e-signature — contract signing is a lightweight state toggle; and a formal
unit-test suite — I validated end-to-end instead. Stating these now saves us the 'where is feature X'
question later."

*[Click.]*

## Slide 5 — Design choice: two sign-ins  (~45s)

"The first design decision: the app has two very different audiences, so it has two sign-in systems.
Staff run the business every day and need full accounts — that's Supabase Auth, email or Google. A
tenant just checks a bill occasionally, so forcing a full account is overkill. Tenants get a lighter
portal: phone number plus a PIN, and the server issues a signed JWT that the edge middleware checks on
every /portal request. The trade-off: maintaining two systems. On the landlord screen, the PIN is auto-generated,
displayed, and can be regenerated or copied with 1 click to send via Zalo, while on the tenant side they access
their bills and incidents via phone and PIN."

*[Click.]*

## Slide 6 — Design choice: Vietnamese payments  (~45s)

"Second decision: payment is built for how Vietnam actually pays. Tenants pay by bank transfer, not
cards, so the app generates a VietQR link through the PayOS gateway that a tenant scans with any
banking app. The same gateway also handles the premium plan upgrade — two separate payment domains,
one gateway. The flow: the PayOS webhook performs dual-matching — first by order_code, then falling back
to the invoice UUID in the transfer description with HMAC-SHA256 signature verification. Additionally,
a manual payment confirmation button is available for cash settlements."

*[Click.]*

## Slide 7 — Design choice: multi-tenancy  (~45s)

"Third decision, and the one an examiner should push on: how do I keep different landlord businesses
from ever seeing each other's data, when they all share one database? Every row carries an
organization tag, org_id. The database itself, through Row-Level Security, blocks a query from
returning another organization's rows. Staff join an organization with an invite code. Those RLS policies
are versioned in 19 SQL migration scripts directly in the repository under supabase/migrations/.
The point: the database enforces tenancy, not just the application code."

*[Click.]*

## Slide 8 — Architecture  (~40s)

"That decision rests on the architecture. Next.js is one full-stack project, but it runs three
strictly separated contexts. Client: the 'use client' components in the browser — they never hold a
secret. Server, highlighted: Server Components, Server Actions, route handlers, and src/lib — the only
context with business logic, database access, PayOS, and secrets. Edge middleware runs before every
request and routes portal traffic through the tenant check. Untrusted browser code is physically split
from privileged work."

*[Click.]*

## Slide 9 — Data access  (~50s)

"Here's how that boundary works in practice, and it's a common point of confusion, so let me be exact.
When a landlord submits a form — top row — the browser doesn't call an HTTP or REST endpoint. It
invokes a Server Action, createContract, which runs on the server. That action uses the SSR client,
server.ts, which carries the user's cookies, so the INSERT into Postgres runs under Row-Level Security,
scoped to their organization. Bottom row: there are actually three database clients at three trust
levels — the browser anon client, the server SSR client which is the default and runs under RLS, and
an admin service-role client that bypasses RLS and is used sparingly. The default path always runs
under RLS; the bypass is the rare exception."

*[Click.]*

## Slide 10 — Data model  (~35s)

"The schema is about thirteen entities. The in-repo type file mirrors the live Supabase schema.
Grouped three ways: tenancy and access; property and billing, highlighted, which is the billing spine
— buildings, rooms, service prices, meter records, invoices; and people and operations. What matters
more than the names are three rules that hold everywhere: money is stored as whole đồng — integers, no
floating point; nearly every table is org-scoped; and statuses are fixed enumerations."

*[Click.]*

## Slide 11 — ER diagram  (~30s)

"This is the entity-relationship diagram of that domain, organization-scoped, centered on the
organization at the top, fanning out to buildings and rooms, tenants and contracts, and down to
invoices and their line items. I'm happy to zoom into any relationship in questions."

*[Click.]*

## Slide 12 — Central flow  (~60s)

"Now the central chain — this carries the thesis. Left to right: onboard a tenant and create a
contract; enter the meter readings, consumption is new minus old; generate the invoice — the pivotal
step, highlighted; take payment through PayOS; and it all surfaces on the dashboard. Creating a
contract flips the room to occupied — three contracts, three rooms occupied. Metered records are
strictly validated and saved with unique constraints per room and month, and when generating invoices,
electric and water consumption lines automatically attach based on consumption delta times the building's
unit price."

*[Click.]*

## Slide 13 — Billing rule  (~45s)

"This is the one formula worth knowing. An invoice total is the rent, plus a sum over metered services
— electricity and water, each consumption times the building's unit price — plus a sum over fixed
services like internet and rubbish. Two design reasons behind it. Why integers: every amount is whole
VND, so there's no floating-point rounding error in money. Why new minus old: consumption is the meter
delta, and a new reading below the old one is rejected as invalid."

*[Click.]*

## Slide 14 — Chain effects  (~40s)

"When generation runs, one invoice per active contract ripples across three surfaces: the dashboard
gets revenue, occupancy, overdue, and the profit trend; payment gets a VietQR link per invoice with a
paid/partial/unpaid status; and the tenant portal shows the bill to the tenant with itemized lines for
rent, electricity, water, and fixed services."

*[Click.]*

## Slide 15 — Live demo  (~90s) #Chua du (can show tat ca nhung use case chinh cua ng dung)

"Let me show a full monthly run, end to end." *(If confident, switch to the app; otherwise stay on the
screenshot.)*
"I sign in as the owner. First I set up the property: create a building and set the electricity and
water unit prices, then bulk-create six rooms in one action. Next the people: I add three tenants with
their ID details, and create three contracts — as each contract is created, the room flips to occupied.
Then the monthly operation: I generate the month's invoices, one per active contract. I'll also show
the operational side — the incident board, where I drag a maintenance ticket across open, in progress,
and resolved; and recording an expense by category, which feeds the profit view. Finally the payoff on
the dashboard: 10,500,000 đ revenue from three contracts, three of six rooms rented, 50% fill, and the
six-month profit trend. This screenshot is my safety net — if the network drops, the result is exactly
this."

*[Click.]*

## Slide 16 — Beyond the core  (~40s)

"Around the billing chain are the support modules — each real, each honestly scoped. Incidents: a
drag-and-drop board across open, in progress, resolved, with priority and photos. The tenant portal:
mobile-first, JWT-secured with bottom navigation (Dashboard, Invoices, Incidents, Profile), where
tenants log in via phone and 6-digit PIN managed directly on the landlord's Tenants screen. And expenses
feeding the profit view, plus a lightweight homestay module."

*[Click.]*

## Slide 17 — Conclusion  (~30s)

"To conclude: RentFlow is a working, multi-tenant rental-management system, built on Next.js and
Supabase with a strict server/client/edge boundary and an organization-scoped data model. I seeded it
and ran it on a live deployment, so its behavior is understood, and every trade-off is documented with
a named fix. Thank you — I'm happy to take questions."

---

## Q&A prep bank

**Q: Why store money as integers?**
All amounts are whole VND, so integer storage removes floating-point rounding error from financial
values. No cents exist in đồng.

**Q: How are landlords kept from seeing each other's data?**
Every record carries org_id, and the default database client runs under Row-Level Security scoped to
the signed-in user, so the database rejects cross-organization reads — not the app code alone.

**Q: Is the tenant invoice payment fully automatic?**
Yes, via PayOS webhooks with HMAC-SHA256 signature verification and dual-matching (orderCode and invoice
UUID in transfer description). If a tenant pays in cash or outside the gateway, the dashboard provides a
manual payment fallback button.

**Q: How does the system handle concurrency on meter entries?**
PostgreSQL enforces a unique index (idx_one_meter_record_per_room_month) per room, month, year, and meter type.
If two users save concurrently, the second operation hits a unique violation and is gracefully rejected.

**Q: Why two authentication systems instead of one?**
Two audiences with different needs. Staff need full accounts and roles (Supabase Auth); a tenant only
views a bill, so a phone-plus-PIN portal with a signed JWT cookie is lighter and lower-friction.

**Q: Is it really an API between client and server?**
Not an HTTP/REST API in the mutation path. The client invokes a Server Action — a server function
call the framework wires up — which then uses the SSR Supabase client. Route handlers under /api do
exist, but for webhooks and integrations, not for the dashboard's own writes.

**Q: You have no unit tests — how did you validate?**
End-to-end with Playwright, covering auth, dashboard, rooms, incidents, payments, and the portal, plus
a manual runtime acceptance pass on the live deployment. Unit tests for permissions and invoice
arithmetic are named future work.

**Q: Why Supabase over rolling your own backend?**
As a solo developer I get hosted Postgres, authentication, Row-Level Security, and storage without
running a server. RLS policies are versioned in 19 migration files in the git repository.

**Q: What would you build or harden first in the next iteration?**
An offline-first PWA mode with IndexedDB caching so staff can record meters in basements without signal,
and automated Zalo ZNS / SMS messaging so bills and payment links are pushed automatically upon creation.
