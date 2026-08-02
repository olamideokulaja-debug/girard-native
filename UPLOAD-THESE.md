# Girard native — icon + one-blue + gold wordmark + OTA (upload all these)

Replace/add these files in your girard-native repo, then do ONE build.
After this build, future TEXT/COLOUR/SCREEN changes reach phones over-the-air
(just by committing to main) — no more builds for those.

Files:
  package.json                          <- adds expo-updates (OTA engine)
  app.json                              <- OTA config + one blue (#0C2161) splash
  src/theme.js                          <- one blue everywhere (#0C2161)
  src/screens/SignInScreen.js           <- logo + gold "GIRARD PROPERTY / ESTATE LIMITED"
  src/screens/SignUpScreen.js           <- same
  assets/icon.png                       <- your emblem app icon
  assets/splash.png                     <- launch screen
  assets/logo.png                       <- gold emblem on the sign-in screen
  .eas/workflows/publish-update.yml     <- auto-publishes OTA updates on commit to main

## Upload (no Terminal)
1. GitHub -> girard-native repo -> Add file -> Upload files.
2. Drag ALL the folders from this update (assets, src, .eas) AND the two loose
   files (package.json, app.json) into the box. GitHub keeps paths & overwrites.
   NOTE: the ".eas" folder starts with a dot; if your Mac hides it, press
   Cmd+Shift+. (period) in Finder to show hidden folders, then drag it in.
3. Commit changes.

## Then build ONCE
Builds -> Build from GitHub -> main -> profile: preview -> Platform: Android -> Confirm.

## After that (the magic)
- Small changes (wording, colours, new screens) -> I give you updated files ->
  you commit to main -> the workflow publishes an OTA update -> your phone gets it
  on the next open. NO build, NO build-quota used.
- Icon / splash / native config changes -> still need a build (native can't go OTA).
