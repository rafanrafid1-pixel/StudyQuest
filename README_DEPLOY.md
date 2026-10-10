# StudyQuest V7.4 — PC + Mobile Web Link

This build includes a responsive HTML app, PWA manifest/service worker, Supabase email/password sign-in, and opt-in cloud syncing with a basic conflict prompt. It is **not yet a live public website**; you must deploy it and configure a Supabase project.

## 0. Protect existing data
1. Open your current V6.5/V7.0 app on the device where the latest data lives.
2. Settings → Your Data → Export backup.
3. Keep the backup file somewhere safe. Browser local storage does not automatically move between devices or versions.

## 1. Deploy the website
Use a static HTTPS host such as GitHub Pages, Netlify, or Cloudflare Pages. Upload all files from this folder, keeping the names and folder structure. The `index.html` must be at the published root. Do not open `index.html` as a local file for PWA installation; service workers require localhost or HTTPS.

## 2. Create the Supabase backend
1. Create a Supabase project.
2. In SQL Editor, run all of `supabase_setup.sql`.
3. In Project Settings → API (or Connect), copy the Project URL and the **publishable/anon public key**.
4. Never use or expose a `service_role` or secret key in this app.
5. In Authentication settings, configure the site's URL and redirect URL for the deployed HTTPS website. Email confirmation may be enabled, in which case check the inbox before signing in.

## 3. Connect StudyQuest
1. Open the deployed website on your PC.
2. Settings → PC + Mobile Cloud Link.
3. Enter the project URL and public key, then press Connect service.
4. Create an account or sign in.
5. Press Sync now. On first sync, carefully choose whether to upload this device's data or download the existing cloud copy. Back up first.
6. Open the same website on your phone, enter the same URL/key, sign in to the same account, and press Sync now. The same account is required on both devices.

## 4. Install on Android
Open the deployed HTTPS website in Chrome → menu (⋮) → Install app or Add to Home screen. The exact wording depends on Chrome and whether the PWA requirements are met.

## Important limits of this first build
- No live website has been published by generating these files alone.
- External CDN assets mean the entire interface may not be fully styled offline; the service worker caches the app shell, not every third-party dependency.
- Cloud sync is opt-in and conflict-aware at the whole-planner level, not a per-task merge. If both devices change data since the last sync, choose which complete copy to keep. Export backups regularly.
- Test with sample data first. Do not put real data into a cloud project until you've checked the policies and sign-in settings.
