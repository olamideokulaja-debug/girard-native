# Girard native — EVERYTHING in one build

This is the whole app with all the latest changes:
  - padded app icon (fixes the cropped home-screen icon)
  - emblem logo in the listings header (instead of "GIRARD" text)
  - tappable listings -> Property Detail page (photos, amenities, description, Pay/Book)
  - deep navy colour, gold wordmark on sign-in, OTA enabled

## Step 1 — upload EVERYTHING (replace what's there)
1. GitHub -> girard-native repo -> Add file -> Upload files.
2. Drag in ALL of these from this folder:
     App.js, app.json, package.json, index.js, eas.json, .gitignore,
     and the folders: src, assets, .eas
   (.eas is hidden — press Cmd+Shift+. in Finder to show it, or it's already there.)
3. Commit changes.

## Step 2 — ONE build
Builds -> Build from GitHub -> Git ref: main -> Profile: preview -> Platform: Android -> Confirm.

## Step 3 — install
When it's green, open the APK link on your phone and install (allow "install from this source").
Now you'll see: the fixed icon, the emblem header, and tapping a listing opens its full page.

## Note on the test listing
A test property is currently in your database so the feed isn't empty.
Ask Claude to delete it whenever you're done.
