# EL Hedaya Islamic School Website

Public-facing Sunday School website for **EL Hedaya Islamic School / Clemmons Islamic Center**, wrapped around the existing secure Parent Portal at:

`https://elhedaya.clemmonsislamiccenter.org/`

## Current website sections

- Premium EL Hedaya hero and official school logo
- About the school
- Programs
- Picture Gallery
- Sunday schedule and $150 semester fee
- Policies
- Parent Portal / Registration CTA
- Contact and location information
- Responsive desktop, tablet, and mobile layouts

## Picture Gallery

The public gallery supports:

- Responsive modern photo grid
- Click/tap photo lightbox
- Keyboard previous/next navigation on desktop
- Optional photo title and caption
- Public users can view published images only

## Private Gallery Administration

**There is no Gallery Admin button, menu item, footer link, empty-gallery admin link, or other public link to the administration area.**

The private administration route is:

`/school-gallery-admin`

Bookmark that URL for administrators. Do not add it to public navigation.

Hiding the route is intentionally only a convenience/privacy measure. It is **not** the security boundary. Production security is enforced by:

1. Supabase Authentication
2. Required admin role in `app_metadata`
3. Row Level Security on the gallery table
4. Storage policies restricting upload/delete to authenticated admins

Even if someone guesses the admin URL, they cannot add or delete photos without an authorized admin account.

### Production safety behavior

If Supabase is not configured on a deployed production build, the admin page is disabled instead of silently granting local admin access.

Local preview administration is available only while running Vite in development mode.

## Admin capabilities

After successful admin authentication:

- Upload JPG, PNG, WEBP, or GIF files
- Add a picture from a direct image URL
- Add an optional title and caption
- Delete existing gallery pictures

## Run locally

```bash
npm install
npm run dev
```

Then open:

`http://localhost:5173/school-gallery-admin`

Local development mode can be used to preview the gallery manager before Supabase is connected.

## Connect Supabase for the live gallery

### 1. Run the provided SQL

Open your Supabase project and run:

`supabase/gallery.sql`

This creates:

- `school_gallery` table
- Public read policy
- Admin-only insert/update/delete policies
- `school-gallery` public Storage bucket
- Storage policies for gallery files

### 2. Create or use an admin user

Create the administrator in **Supabase Authentication > Users**.

The user must have this Supabase `app_metadata` value:

```json
{
  "role": "admin"
}
```

The frontend checks the role for the interface, while the database and Storage RLS policies enforce authorization server-side.

### 3. Configure environment variables

Copy `.env.example` to `.env.local`:

```env
VITE_PORTAL_URL=https://elhedaya.clemmonsislamiccenter.org/
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
VITE_GALLERY_TABLE=school_gallery
VITE_GALLERY_BUCKET=school-gallery
```

Only use the public Supabase anon/publishable key in Vite. Never put a Supabase service-role key or any other secret administrator key in frontend environment variables.

### 4. Configure Vercel

Add the same `VITE_*` variables to the public website's Vercel project and redeploy.

`vercel.json` contains a rewrite for the private gallery-admin route so directly opening/bookmarking the route works after deployment.

## Key files

- `src/components/Gallery.jsx` - public gallery and lightbox only
- `src/components/GalleryAdminPage.jsx` - private admin route UI
- `src/services/galleryService.js` - local/Supabase data layer
- `supabase/gallery.sql` - database, RLS, and Storage setup
- `src/App.jsx` - public site / private admin route switch
- `vercel.json` - direct-route rewrite for Vercel


## V3 gallery architecture

- The homepage no longer displays school photos. It contains a lightweight **Life at EL Hedaya** call-to-action only.
- Public gallery page: `/gallery`
- Hidden administration route: `/school-gallery-admin`
- The public gallery supports fullscreen viewing, previous/next navigation, keyboard arrows, mobile swipe, zoom controls, photo count, lazy image loading, and incremental **Load More** rendering.
- Admins may save new photos as **Published** or **Hidden**, and can toggle visibility later without deleting the image.
- There is no public link to the admin route. Supabase authentication and Row Level Security remain the actual security boundary.

## Homepage gallery preview

The **Life at EL Hedaya** section now automatically selects one random **published**
gallery photo each time the homepage loads. It uses the same gallery data source as
`/gallery`, so newly published photos are automatically eligible to appear on the homepage.

If no published gallery photos are available, the official EL Hedaya school logo is used
as a graceful fallback. Unpublished/hidden photos are never selected.

## Batch gallery uploads

The hidden gallery admin now supports selecting or drag-dropping up to 30 images at once.
Each image can be up to 10 MB (JPG, PNG, WEBP, or GIF). The admin can preview the
batch, remove individual files, clear the queue, and upload the batch in one action.
Uploads are processed independently, so a failed image remains in the queue for retry
without cancelling successful uploads. The existing URL-based image option remains available.


## V6 hero refinement

Removed the floating EL Hedaya logo badge from the right-side hero schedule card for a cleaner, more minimal composition. The official logo remains in the website branding/header where appropriate.
