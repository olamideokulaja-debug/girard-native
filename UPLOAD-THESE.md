# Girard native — colour revert to deep navy

Reverts the blue back to the previous navy (#0F2438), including the icon background.
The gold emblem and gold wordmark are unchanged.

Replace these files in your girard-native repo:
  app.json           <- splash + adaptive-icon background back to #0F2438
  src/theme.js       <- app screens back to deep navy #0F2438 / ink #16324F
  assets/icon.png    <- emblem recoloured onto deep navy
  assets/splash.png  <- matching launch screen

## Upload (no Terminal)
GitHub -> girard-native repo -> Add file -> Upload files ->
drag in `app.json`, the `src` folder, and the `assets` folder -> Commit.

## Then
- The icon/splash/background are NATIVE, so this needs ONE build:
  Builds -> Build from GitHub -> main -> preview -> Android -> Confirm.
- (Text-only changes could go over-the-air, but the icon colour cannot, so a build is needed here.)
