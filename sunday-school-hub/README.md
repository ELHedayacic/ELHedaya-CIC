# El Hedaya Islamic School — Sunday School Hub

A production-ready registration and class-management system for a Sunday School
program: a **family portal** (register, schedule, homework, progress, messages,
online payments) and a **staff console** (classes, schedule, roster, homework
board, attendance, badges, messaging, fee & payment management).

Built with React + TypeScript + Vite, Supabase (Postgres, Auth, Edge
Functions), Tailwind CSS, and Square for payments — matching the stack you've
used across your other Supabase/Vercel projects.

---

## 1. Stack & architecture

| Layer | Choice |
|---|---|
| Frontend | Vite + React 18 + TypeScript + React Router + Tailwind |
| Backend | Supabase (Postgres + Row Level Security + Auth + Edge Functions) |
| Payments | Square Web Payments SDK (client) + Supabase Edge Function (server) |
| Hosting | Vercel (frontend) + Supabase (backend) |

**Why an Edge Function for payments?** Your Square *access token* is a secret
that must never reach the browser. The client only ever handles a card
**nonce** (a one-time token from Square's SDK); the Edge Function exchanges
that nonce for an actual charge using the secret token, which lives only in
Supabase's server-side secrets.

**Messaging, not email.** Per your setup, there's no outbound email service —
teachers post updates (to everyone, a class, or one family) directly from the
staff console, and they land in the family's in-app inbox instantly. If you
want real email later, it's a small addition (see §6).

---

## 2. Project structure

```
sunday-school-hub/
├── src/
│   ├── pages/
│   │   ├── LandingPage.tsx, auth/            # public site + login/signup
│   │   ├── portal/                           # family portal (8 pages)
│   │   └── admin/                            # staff console (7 pages)
│   ├── components/ui/                        # Button, Card, Modal, Tabs, etc.
│   ├── components/shared/                    # JourneyPath, SquarePaymentForm, ...
│   ├── context/AuthContext.tsx                # session + role
│   ├── hooks/                                # useMyStudents, useClasses, useTeachers
│   └── types/                                # DB row types
├── supabase/
│   ├── migrations/0001_init.sql              # full schema + RLS policies
│   └── functions/
│       ├── process-payment/                   # charges a card via Square
│       └── square-webhook/                     # keeps payment status in sync
└── .env.example
```

---

## 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run these fifteen files **in order**:
   `supabase/migrations/0001_init.sql`, then `0002_profile_trigger.sql`, then
   `0003_admin_role_security.sql`, then `0004_fix_role_trigger.sql`, then
   `0005_homework_attachments.sql`, then `0006_staff_deletion_safety.sql`,
   then `0007_last_admin_demotion_guard.sql`, then `0008_student_photos.sql`,
   then `0009_add_principal_role.sql`, then `0010_principal_admin_tier.sql`,
   then `0011_announcement_attachments.sql`, then
   `0012_student_multi_class.sql`, then `0013_fee_categories.sql`, then
   `0014_must_change_password.sql`, then `0015_default_registration_fee.sql`.
   **`0009` and `0010` must be run as two separate executions**, not pasted
   together — Postgres won't allow using a brand-new enum value in the same
   transaction it was added in.
   - `0001` creates every table, enum, RLS policy, and seeds four starter
     badges.
   - `0002` adds a trigger that creates each user's `profiles` row
     automatically on signup — this runs server-side, so it works regardless
     of your email confirmation setting (a client-side insert at that point
     would otherwise be rejected by RLS, since no session exists yet until
     the user confirms).
   - `0003` locks down who can change a `role` — only admins, even via a
     direct API call — closing a gap where any teacher could otherwise have
     promoted themselves to admin.
   - `0004` fixes a bug in `0003`'s guard: it originally also blocked role
     changes made directly in the SQL Editor (needed to bootstrap your first
     admin below), not just through the app.
   - `0005` creates a Storage bucket for homework file attachments
     (worksheets/handouts as images or PDFs) and locks uploads to staff only
     — anyone signed in can view/download, but only teachers and admins can
     add or remove files.
   - `0006` fixes several foreign keys that would otherwise block deleting a
     staff account the moment they'd ever taken attendance, created
     homework, or posted an announcement — their records now survive
     unattributed instead of the delete failing outright.
   - `0007` blocks demoting the very last remaining admin, at the database
     level — the same protection deletion already has, closing the one gap
     where the program could theoretically end up with nobody able to
     manage it.
   - `0008` creates a **private** Storage bucket for student photos, scoped
     so only that child's own parent or staff can view/upload/delete —
     unlike homework attachments, this is never publicly readable, since
     it's photos of children.
   - `0009` adds a `principal` role.
   - `0010` makes `principal` carry the exact same permissions as `admin`
     everywhere — it's a distinct, more accurate title for whoever runs the
     school, not a different access level. Also extends the "can't remove
     the last admin" protection to cover deletion at the database level,
     not just through the Edge Function.
   - `0011` lets staff pin a flyer/PDF/image to a message-board post —
     reuses the existing homework-attachments bucket and its permissions,
     so no new Storage setup is needed for this one.
   - `0012` lets a student be enrolled in more than one class — previously
     each student had a single `class_id` column; this replaces it with a
     proper `student_classes` join table. **This is a real schema change**:
     if you already had students assigned to classes before running this,
     their existing single assignment carries over automatically as part
     of the migration, nothing is lost.
   - `0013` replaces the fee categories (previously
     registration/term/event/materials) with the school's actual
     categories — General Fee, Books, Supplies, Other. Any existing fees
     get remapped automatically (registration/term → General Fee, event →
     Other, materials → Books) rather than left in a broken state.
   - `0014` adds the flag behind the new temp-password staff creation flow
     — forces a password change on first login for accounts created this
     way, enforced at the database and route level, not just as a
     suggestion in the UI.
   - `0015` lets an admin mark one fee as the default registration fee,
     shown to a parent immediately after registering a child. A partial
     unique index guarantees at most one fee can hold this at a time, at
     the database level.
3. **Auth settings** (Authentication > Settings): for local testing it's
   easiest to turn **"Confirm email"** off so signup logs the user in
   immediately without needing to click a link. Turn it back on before going
   live — profile creation works correctly either way now.
4. Copy your **Project URL** and **anon public key** from Settings > API into
   `.env` (copy `.env.example` → `.env` first).
5. Create your first staff account (a bootstrapping step — after this, use
   the in-app **Staff & families** page described below for everyone else):
   - Sign up normally through the app (it will create a `parent` profile).
   - In the Supabase Table Editor, open `profiles` and change that user's
     `role` from `parent` to `admin`. Click the cell itself (not the row's
     arrow icon) — since `role` is an enum it should offer a dropdown; if it
     doesn't, use the row's edit/pencil icon instead, which opens a panel
     with a proper dropdown. Confirm the value actually saved before moving
     on.
   - That's your program administrator. They can promote everyone else —
     teachers, other admins — from **Staff & families** inside the admin
     console, no dashboard access required after this point.

### Creating teacher and admin accounts day-to-day
Once you have one admin account, go to `/admin/staff` in the app and click
**Create staff account**. Enter their name, email, and access level — the
account is created immediately with a temporary password (auto-generated,
editable if you'd rather set your own). No email is sent at all; you copy
that password and hand it to them however works best — in person, a text
message, whatever's reliable for that person. **This replaced an
email-invite-link flow** that turned out to be a common friction point in
practice (spam filters, staff unfamiliar with "click the link to set your
password" flows, deliverability issues generally) — a password you hand
someone directly sidesteps all of that.

The moment they log in with that temporary password, they're forced to a
**Set your password** screen before they can reach anything else in the
app, regardless of role — enforced both right after login and by every
protected page, so there's no way to skip it by navigating around. Once
they set their own password, they're in normally from then on.

The same Staff page lists every existing account too, with a role dropdown
if you need to change someone's access after the fact (e.g. a parent who
should also be a teacher, or stepping someone down), and a **remove**
button (trash icon) if an account needs to go entirely — the confirmation
dialog explains what happens to their classes and past records first. Only
admins can see this page or create accounts/change roles/remove accounts; a
database trigger silently blocks a non-admin from changing their own role
even via a direct API call, so this can't be bypassed from outside the UI.
You can't remove your own account or the last remaining admin, so the
program can never end up with nobody able to manage it.

The older email-invite Edge Function (`invite-staff`) is still in the
codebase and still works if you'd ever rather use it for a specific
person, but the Staff page's UI no longer calls it by default.

### Required: allow-list your redirect URLs
The "forgot password" flow (still email-based, since a family or staff
member resetting their own password doesn't have this problem — they're
choosing to click a link from their own inbox, not waiting on an invite
they might not expect) emails a link that has to land back on *your* app.
Supabase blocks redirects to URLs it doesn't recognize as a security
measure, so you need to explicitly allow them: Authentication → **URL
Configuration** → add both of these under **Redirect URLs** (keep the
wildcard):
```
http://localhost:5173/**
```
and, once deployed, your real domain the same way (e.g.
`https://yourdomain.com/**`). Skip this and the reset links will silently
redirect somewhere unexpected instead of to `/set-password`.

### Row Level Security, in plain terms
- Parents can only see/edit their own children, their own payments, and
  announcements addressed to them.
- Teachers and admins (`is_staff()`) can read and write everything needed to
  run the program.
- This is enforced at the database level, not just hidden in the UI.

### Chasing unpaid fees
The **Fees** page also lists every enrolled student underneath the fee
structures, showing whether their family has paid every *active* fee —
"Paid" or "Unpaid: [fee names]", based on real completed Square payments,
not just whether a charge was attempted. For anyone unpaid, **Message
family** opens a pre-filled reminder (editable) that posts to their in-app
inbox and, if you leave the checkbox on, also sends as a real email in the
same action — same underlying send as the Messages page's "Send email"
feature, just pre-addressed to that one family with their specific unpaid
fees already filled in. No setup needed for this — it's just a different
view of data you're already collecting.

---

## 4. Set up Square

1. Create a [Square Developer](https://developer.squareup.com/apps) account
   and an application. Start in **Sandbox** — it gives you fake cards to test
   full charges end-to-end before you touch real money.
2. From the app's **Sandbox** credentials, grab:
   - **Application ID** → `VITE_SQUARE_APPLICATION_ID`
   - **Location ID** (Sandbox Locations tab) → `VITE_SQUARE_LOCATION_ID` and
     the Edge Function secret `SQUARE_LOCATION_ID`
   - **Access Token** → Edge Function secret `SQUARE_ACCESS_TOKEN` only
     (never put this in `.env` / the frontend)
3. Set the Edge Function secrets (see §5 below).
4. Test a payment in the app using Square's sandbox test card:
   `4111 1111 1111 1111`, any future expiry, any CVV, any ZIP.
5. When you're ready to accept real payments: create a **production**
   application/location in Square, flip `VITE_SQUARE_ENV` and
   `SQUARE_ENV` to `production`, and swap in the production IDs/token.
6. (Optional, recommended for production) Register the `square-webhook`
   function's URL under Square Dashboard → Webhooks, subscribed to
   `payment.updated` and `refund.updated`, so refunds and delayed captures
   stay in sync automatically.

---

## 5. Deploy the Edge Functions

**If you already had these deployed from before:** `list-profiles`,
`invite-staff`, and `delete-staff` all changed to recognize the new
`principal` role — redeploy those three (same "paste code, click Deploy"
either via CLI or the dashboard editor) or admins/principals will hit
permission errors using the Staff & families page until you do.
`send-family-email` also changed, to look up a class's families through
the new `student_classes` table now that a student can be in more than one
class — redeploy it too, or emailing "one class" will silently find nobody
to send to.

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF

supabase secrets set \
  SQUARE_ACCESS_TOKEN=your-sandbox-or-prod-access-token \
  SQUARE_LOCATION_ID=your-location-id \
  SQUARE_ENV=sandbox

supabase secrets set \
  RESEND_API_KEY=your-resend-api-key \
  RESEND_FROM_EMAIL=updates@mail.yourdomain.org

supabase functions deploy process-payment
supabase functions deploy square-webhook --no-verify-jwt
supabase functions deploy list-profiles
supabase functions deploy invite-staff
supabase functions deploy create-staff-account
supabase functions deploy delete-staff
supabase functions deploy send-family-email
```

`process-payment` requires the caller's Supabase auth JWT (the frontend sends
this automatically via `supabase.functions.invoke`), so it stays
`--verify-jwt` (the default). `square-webhook` is called by Square, not a
logged-in user, so JWT verification is disabled and it verifies Square's own
HMAC signature instead.

**About `send-family-email`:** this is what powers the "Send email" button
on the Messages page — any staff member can email all families, one class,
or one family, with an optional PDF/image attachment. It uses the same
Resend account as your SMTP setup, but talks to Resend's HTTP API directly
rather than through Supabase Auth's SMTP integration (which only handles
Supabase's own signup/invite/reset emails, not custom ones from your app).
Reuse the same API key from your SMTP setup for `RESEND_API_KEY` — it works
for both. `RESEND_FROM_EMAIL` should be an address on your verified domain
(e.g. `updates@mail.clemmonsislamiccenter.org`); email providers won't let
you send *from* an arbitrary staff member's personal address, so the app
shows their real name as the sender and routes replies back to their real
email instead — families can reply directly to the staff member even though
the technical "from" address is the school's.

**Email delivery note:** staff invites and "forgot password" links both go
out through Supabase's built-in email sender by default — the same one with
the very low per-hour limit mentioned earlier for signup confirmations. Fine
for testing a handful of invites; before onboarding a real staff list, set up
your own SMTP (Authentication → Settings → SMTP Settings — Resend, Postmark,
or SendGrid are the easy ones) so you're not sharing that limit. This is
separate from `send-family-email`'s Resend usage above, but if you're using
Resend for both, they share the same account's sending limits (free tier:
100/day, 3,000/month) — worth keeping an eye on if you send frequent
family-wide emails on top of normal signup/invite traffic.

---

## 6. Run it locally

```bash
npm install
cp .env.example .env   # fill in your Supabase + Square values
npm run dev
```

Visit `http://localhost:5173`. Sign up as a family, then use the admin
account you promoted in §3 to sign in and set up your first class.

---

## 7. Deploy to Vercel

1. Push this repo to GitHub (matches your usual `Siteworks-dms` workflow).
2. Import it in Vercel. Framework preset: **Vite**.
3. Add the four `VITE_*` environment variables from your `.env` in Vercel's
   Project Settings → Environment Variables.
4. Deploy. The Supabase Edge Functions are deployed separately (§5) and don't
   need anything from Vercel.

---

## 8. What's genuinely production-ready vs. what to add next

**Solid as shipped:**
- Full RLS-secured multi-role data model
- Real Square charge flow through a server-side function (no secrets in the
  client)
- Class/schedule/homework/attendance/badges/messaging/payments all backed by
  real tables, not mock data

**Worth adding before a big public launch:**
- **Rate limiting / abuse protection** on signup (Supabase has basic
  protections; consider Cloudflare Turnstile on the signup form for a church
  with a public URL).
- **Real email** — if you later want confirmations or reminders by email in
  addition to the in-portal messages, add [Resend](https://resend.com) (or
  SendGrid) inside `process-payment`/a new Edge Function; the schema already
  has everything needed to trigger from `payments` or `announcements`.
- **File uploads** for student photos and homework attachments — wire up
  Supabase Storage (a couple of buckets + an upload component); the
  `photo_url` / `resource_url` columns are already there waiting for real
  URLs.
- **Automated tests** — none are included; add Vitest + Testing Library for
  the components you touch most.
- **Multi-child discounts / recurring billing** if your fee model needs it —
  Square supports subscriptions via a separate API if you outgrow one-time
  charges.

---

## 9. Rebranding

The app is branded for **El Hedaya Islamic School**, with its logo at
`public/logo.png` (used throughout the app) and `public/favicon.png` (browser
tab icon). To rebrand again later: swap those two image files (keep the same
filenames so you don't have to touch any code), then update the name in
`index.html` (`<title>`), the `Header`/`Footer` copy in
`src/pages/LandingPage.tsx`, and the sidebar labels in `PortalLayout.tsx` /
`AdminLayout.tsx` / `LoginPage.tsx` / `ConfigNotice.tsx`. Colors and fonts
live in `tailwind.config.js` if you want to shift the palette too.

### One thing worth knowing about the color system
The app runs a **light theme everywhere except the auth pages**
(login/signup/forgot-password/set-password), which intentionally stay on a
fixed dark card over the mosque photograph — a deliberate brand moment, not
an oversight. This works via two mechanisms in `tailwind.config.js`:

- The `twilight` neutral scale (backgrounds, body text) is fully reversed
  from a typical dark-mode assignment — same class names everywhere
  (`bg-twilight-900`, `text-twilight-50`, etc.), just pointed at light
  values instead of dark ones. `twilight-950` is the one exception, kept
  dark on purpose for the modal backdrop overlay.
- The accent colors (`aurora`/`amber`/`grow`/`coral`) were **not**
  reversed — their original 300–600 shades are exactly what the auth pages
  still depend on to read against their dark card. New 700/800 shades
  were added instead, for anywhere else in the app that needs a properly
  dark, light-background-legible version of an accent color as text.

If you ever want the auth pages to go light too, or want to bring back a
full dark theme, start by reading that comment block at the top of
`tailwind.config.js` — it explains exactly which values are shared vs.
pinned, so you don't accidentally break one while changing the other.

