# Girard — Native App (foundation)

This is the START of your real native Girard app (React Native / Expo),
built to REPLACE the current wrapper by updating your existing store listings.
It reuses your existing app identity, so nothing on the stores is re-created:

  - Expo owner:      olamideokulaja
  - EAS project:     girard  (projectId e3e515b9-2462-4751-b24e-0a521c126ffd)
  - iOS bundle:      com.girardpropertylimited.app   (updates your App Store app)
  - Android package: com.girardpropertylimited.twa   (updates your Play app)

## What works in this foundation
- Native Sign In and Sign Up screens (real React Native, not a website)
- Connected to your existing Girard Supabase — same data, same logins
- Stays signed in between app opens
- A placeholder Home screen that proves login works end to end

## What comes NEXT (future sessions, phased)
- Browse listings (native property feed)
- Property detail (photos, price, details)
- Pay / book (rent & short-let via Paystack)
- Dashboards, swaps, profile

## IMPORTANT — do NOT disturb the wrapper yet
Keep your existing wrapper repo (girard-mobile) as it is. Your iOS wrapper is in
Apple review and your Android wrapper is live on Google Play. This native app is
a SEPARATE repo for now; we only replace the wrapper on the stores once the
native app is genuinely ready. Nothing here is submitted yet.

## Two open items to handle at BUILD time (not now)
1. Android signing: the live Play app (com.girardpropertylimited.twa) was built
   by PWABuilder with its own signing key. To ship this native app as an UPDATE
   to that same Play listing, the signing must line up (Play App Signing). We
   sort this when we first build Android — flag it to Claude then.
2. First EAS build will validate the exact package versions (same as the wrapper
   did). If it reports a version mismatch, send the log and Claude adjusts.

## How we'll build it (later, when ready) — same as Qura
- Put this project in its OWN new GitHub repo (e.g. girard-native).
- Connect that repo to the existing "girard" EAS project.
- Build from GitHub (no Terminal where possible).
