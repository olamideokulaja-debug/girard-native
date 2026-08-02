# Girard native — full current project (one upload, one build)

This is the COMPLETE app. Uploading it makes your repo correct no matter what
state it's in. It includes:
  - deep navy colour (reverted) on screens, icon and splash
  - your gold emblem icon + gold "GIRARD PROPERTY / ESTATE LIMITED" on sign-in
  - over-the-air updates switched on (expo-updates + .eas workflow)
  - NEW: Browse Listings screen showing your real `properties` from Supabase

## Upload (no Terminal)
1. GitHub -> girard-native repo -> Add file -> Upload files.
2. Drag EVERYTHING from this folder in (App.js, app.json, package.json, index.js,
   eas.json, .gitignore, the `src`, `assets`, and `.eas` folders).
   - `.eas` is hidden (starts with a dot). If Finder hides it, press
     Cmd+Shift+. to show hidden files, then drag it too. (Or you already added it.)
3. Commit changes.

## Build ONCE
Builds -> Build from GitHub -> main -> preview -> Android -> Confirm.

## After this build
Because OTA is on, the NEXT changes to text/colours/screens/logic reach your
phone by just committing to main (no build). Only icon/splash/native config
changes will need a build.

## What you'll see after installing
- Sign in -> lands on "Browse verified property"
- Your real listings from the properties table (title, area, type, beds, rent,
  Verified badge). Pull down to refresh.
- Tapping a card does nothing yet — the Property Detail screen is the next step.
