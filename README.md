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
    supabase.ts             Browser-safe Supabase client
    supabase-admin.ts       Server-only service-role client
  types/                    Property and enquiry types
supabase/
  schema.sql                Main schema, policies, and seed data
  001_secure_enquiries.sql  Follow-up security migration
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

## Supabase setup

The application uses the existing richer property model rather than replacing it with a simplified schema.

1. Open the Supabase Dashboard.
2. Go to **SQL Editor**.
3. Run `supabase/schema.sql`.
4. Run `supabase/001_secure_enquiries.sql`.
5. Confirm that `properties`, `property_images`, and `enquiries` exist in **Table Editor**.
6. Confirm that the `property-media` storage bucket exists if you use Supabase-hosted images.

The schema includes:

- `properties` for published property records and architectural metadata.
- `property_images` for normalized public image metadata.
- `enquiries` for visitor requests and internal enquiry status.
- Row Level Security policies for published property reads and administrator management.

Public users can read published properties and public image metadata. Enquiries are inserted by the server route with the server-only service-role client; public users have no direct enquiry read or insert policy. Administrators require an authenticated user with `app_metadata.role = 'admin'`.

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

## Design and implementation notes

The project preserves the original Atelier Estates direction and extends it with reusable components rather than replacing the architecture. The UI uses shared Tailwind tokens for limestone, charcoal, sandstone, and terracotta colors. Property cards, filters, enquiry forms, navigation, and the footer are isolated into reusable components.

The architecture visualization is procedural, so it does not depend on an external model file. It uses Three.js geometry and materials with GSAP/ScrollTrigger camera stages. The existing reduced-motion CSS rules reduce animation for users who request less motion.

## License

This project is a portfolio implementation for Atelier Estates. Property content and imagery are demonstration material unless connected to a configured live Supabase dataset.
