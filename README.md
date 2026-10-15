# Atelier Estates

Atelier Estates is a premium editorial real estate website built for architecturally significant homes, private acquisitions, and discreet advisory enquiries. The visual direction combines limestone tones, warm charcoal, terracotta accents, Cormorant Garamond typography, cinematic property photography, and a procedural Three.js architecture study.

**Live repository:** https://github.com/tanaydeshmukh7/atelier-estates

## What is included

- Cinematic homepage with featured property content and architectural storytelling.
- Responsive property collection at `/properties`.
- Search, location, property type, price range, and sorting filters.
- Dynamic property detail pages at `/properties/[slug]`.
- About page with agency story, values, and editorial layout.
- Contact page with general and property-specific enquiry forms.
- Procedural Three.js architecture scene with GSAP scroll-linked stages.
- Supabase property queries with published-listing filtering.
- Secure server-side enquiry submission through `/api/enquiries`.
- Protected agency dashboard at `/admin` with Supabase Auth, membership authorization, property CRUD, publication controls, and Storage-backed photography.
- Privacy-friendly anonymous property visit analytics and protected enquiry management at `/admin/analytics` and `/admin/enquiries`.
- Validation, honeypot spam protection, basic email rate limiting, and duplicate-submit prevention.
- Accessible loading, empty, error, and not-found states.
- Reduced-motion CSS support and responsive layouts.

## Technology

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Supabase JavaScript SDK
- Three.js
- GSAP and ScrollTrigger
- Lucide React

## Project structure

```text
src/
  app/
    api/enquiries/          Secure enquiry endpoint
    admin/                  Protected agency login and property management
    about/                  Agency story
    contact/                Contact and enquiry form
    properties/             Collection and dynamic property pages
    page.tsx                Homepage
  components/
    3d/                     Procedural architecture scene
    enquiry/                Enquiry form
    layout/                 Navigation and footer
    properties/             Cards, filters, and collection UI
  data/                     Clearly labelled portfolio fallback data
  lib/
    properties.ts           Property query and mapping helpers
    admin-auth.ts           Bearer-token membership authorization
    admin-property.ts       Server-side property validation
    supabase.ts             Browser-safe Supabase client
    supabase-admin.ts       Server-only service-role client
  types/                    Property and enquiry types
supabase/
  schema.sql                Main schema, policies, and seed data
  001_secure_enquiries.sql  Follow-up security migration
  002_agency_management.sql Membership RLS and property-images Storage policies
  003_property_analytics.sql Anonymous visits, enquiry correlation, and retention indexes
```

## Run locally

Requirements:

- Node.js 18.17 or newer
- npm
- A Supabase project for live property data and enquiry storage

Install dependencies:

```powershell
npm install
```

Copy the environment template:

```powershell
Copy-Item .env.example .env.local
```

Set the following values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The publishable key may be used in browser-safe Supabase queries protected by RLS. The service-role key is server-only and must never be exposed in client components, committed to Git, or included in browser bundles.

Start the development server:

```powershell
npm run dev
```

Open http://localhost:3000.

Restart the development server after changing `.env.local`; Next.js reads environment variables when the server starts.

### Password reset links

Password reset emails use the current site's origin followed by `/admin/reset-password`, so links stay on the host where the reset was requested. Add the exact local and production callback URLs to Supabase **Authentication > URL Configuration**:

In Supabase, open **Authentication > URL Configuration** and set the production **Site URL** to the deployed site URL. Add both redirect URLs:

```text
http://localhost:3000/admin/reset-password
https://atelier-estates-one.vercel.app/admin/reset-password
```

Do not configure the Supabase production **Site URL** or email template with `http://localhost:3000`. Each recovery link is single-use and expires. If Supabase shows `otp_expired`, request a fresh email and open only the newest link. Do not reuse a link after it has already opened the reset page.

## Supabase setup

The application uses the existing richer property model rather than replacing it with a simplified schema.

1. Open the Supabase Dashboard.
2. Go to **SQL Editor**.
3. Run `supabase/schema.sql`.
4. Run `supabase/001_secure_enquiries.sql`.
5. Confirm that `properties`, `property_images`, and `enquiries` exist in **Table Editor**.
6. Confirm that the `property-media` storage bucket exists if you use Supabase-hosted images.
7. Run `supabase/002_agency_management.sql`.
8. Confirm that the `property-images` storage bucket exists and is public. Public image URLs are intentionally readable by anyone who has the URL; draft property records and image metadata remain hidden by RLS.
9. In Supabase Authentication, create the first administrator user with email/password. Then run this SQL once, replacing the email:

```sql
INSERT INTO public.agency_members (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'admin@example.com';
```

Disable public sign-up in **Authentication > Providers > Email**. Add subsequent agents only through a controlled administrator operation; never trust a browser-provided role or email address for authorization.

Property visit analytics requires `supabase/003_property_analytics.sql`. It creates a deduplicated `property_visits` table and adds optional `visitor_id`/`session_id` columns to `enquiries`. Raw visit events are configured for a 365-day retention period; enable the commented `pg_cron` cleanup job in that migration if your Supabase plan supports it.

The schema includes:

- `properties` for published property records and architectural metadata.
- `property_images` for normalized public image metadata.
- `enquiries` for visitor requests and internal enquiry status.
- Row Level Security policies for published property reads and administrator management.

Public users can read published properties and public image metadata. Enquiries are inserted by the server route with the server-only service-role client; public users have no direct enquiry read or insert policy. Management requires an authenticated Supabase user whose UUID is present in `agency_members` with role `agent` or `admin`. Only administrators can change that table under RLS.

## How enquiries work

The form submission flow is:

```text
Contact form
  -> POST /api/enquiries
  -> server-side validation
  -> honeypot and rate-limit checks
  -> Supabase service-role insert
  -> success only after Supabase confirms the insert
```

The API validates:

- Full name length.
- Email format and maximum length.
- Optional phone number format and length.
- Message length.
- Enquiry type.
- Optional property UUID.

If configuration is missing, validation fails, the request is rate-limited, or Supabase rejects the insert, the API returns an error response instead of displaying a fake success message. Failed submissions retain the user's form values.

## Demo and live property behavior

When Supabase credentials are not configured, the site uses the clearly labelled portfolio dataset in `src/data/properties.ts` so the UI remains reviewable. When Supabase is configured, property pages query published records from Supabase. Live query failures return empty/error states rather than silently presenting fallback listings as live database data.

The demo status banner explains when the site is running without live Supabase credentials.

## Available scripts

```powershell
npm run dev       # Start the development server
npm run build     # Create a production build
npm run start     # Start the production server
npm run lint      # Run Next.js ESLint checks
npm exec tsc -- --noEmit  # Run TypeScript validation
```

## Production deployment

Deploy the Next.js application to a platform that supports server-side environment variables, such as Vercel or another Node.js host.

Configure these environment variables in the deployment provider:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Run the production checks before deployment:

```powershell
npm exec tsc -- --noEmit
npm run lint
npm run build
```

Never commit `.env.local` or any service-role key. The repository `.gitignore` excludes local environment files, `.next`, `node_modules`, logs, and TypeScript build metadata.

## Admin verification checklist

After applying the migrations, verify with two Auth users (one provisioned in `agency_members`, one not provisioned):

1. A signed-out visitor is redirected from `/admin` to `/admin/login`.
2. A signed-in but unauthorized user is signed out and denied by `/api/admin/me`.
3. An authorized agent can save a draft, upload multiple JPEG/PNG/WebP images, select the first image as cover, edit it, publish it, and see it at `/properties/<slug>`.
4. Unpublishing removes the listing from public collection/detail queries; deleting it removes normalized metadata and attempts Storage cleanup.
5. An agent cannot insert, update, or delete `agency_members`, promote itself, or mutate listings through direct Supabase calls without membership RLS approval.
6. Public anonymous requests cannot select draft properties or insert/update/delete listings.

The dashboard sends access tokens only to server API routes. The service-role key is never sent to the browser. Image files are stored in the public `property-images` bucket under a user-scoped path; do not use that bucket for private or sensitive media.

Property analytics uses a random first-party visitor UUID and a session UUID stored in cookies. It does not use IP addresses, fingerprinting, precise location, or visitor identity claims. Enquiry contact details are collected only when voluntarily submitted through the advisory form. Anonymous visit records are visible only to authorized agency members; enquiry read/update access follows the existing administrator-only RLS policy.

## Design and implementation notes

The project preserves the original Atelier Estates direction and extends it with reusable components rather than replacing the architecture. The UI uses shared Tailwind tokens for limestone, charcoal, sandstone, and terracotta colors. Property cards, filters, enquiry forms, navigation, and the footer are isolated into reusable components.

The architecture visualization is procedural, so it does not depend on an external model file. It uses Three.js geometry and materials with GSAP/ScrollTrigger camera stages. The existing reduced-motion CSS rules reduce animation for users who request less motion.

## License

This project is a portfolio implementation for Atelier Estates. Property content and imagery are demonstration material unless connected to a configured live Supabase dataset.
