# App: reflect "Leased" instantly after payment (JavaScript-only)

The server already flips a long-let to "Leased" on payment (confirmed working).
These changes make the APP show it right away instead of needing a manual refresh.

Files:
  src/screens/PropertyDetailScreen.js  <- on payment success: marks Leased, button shows "Leased", returns to the feed
  src/screens/ListingsScreen.js        <- feed refetches every time it regains focus (so the leased one drops off)

## Ship it
GitHub -> girard-native -> Add file -> Upload files -> drag the `src` folder -> Commit to main.
Reopen the app twice (over-the-air). If it doesn't take effect, do one build:
Builds -> Build from GitHub -> main -> preview -> Android -> Confirm.
