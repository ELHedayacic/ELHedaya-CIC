CLEMMONS ISLAMIC CENTER
STAGE 4 - EMBED EXISTING DONATION PORTAL

This package keeps the Stage 3 full homepage and adds a native:
  /donate

route that embeds:
  https://donation-kiosk-repo.vercel.app/donate

CHANGES
- Header Donate -> /donate
- Hero Donate -> /donate
- Homepage Donate Now -> /donate
- Added app/donate/page.tsx
- Added responsive embedded-donation page styles
- Added "Back to CIC" control
- Added "Open Full Portal" fallback
- iframe includes payment permission
- Footer build fix is included

INSTALL
1. Stop dev server with Ctrl + C
2. Extract directly into:
   D:\cic-latest-website\cic-website
3. Choose YES / REPLACE
4. Run:
   npm run dev
5. Test:
   http://localhost:3000
   then click Donate

IMPORTANT
If the iframe displays a browser message such as:
"refused to connect" or "blocked by Content Security Policy",
the donation-kiosk app will need to allow the new website as a frame parent
using its CSP frame-ancestors configuration. The "Open Full Portal" button
remains available as a fallback.

No Square credentials are copied into the new CIC website.
The existing donation-kiosk app continues to own its payment logic and secrets.
