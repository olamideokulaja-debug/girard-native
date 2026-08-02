# App: Account / Profile screen (JavaScript-only)

New native Account screen (name, email, role, support links, sign out),
reached by tapping "Account" in the top-right of the Browse screen.

Files:
  App.js                             <- adds the Profile screen to navigation
  src/screens/ProfileScreen.js       <- NEW: the Account screen
  src/screens/ListingsScreen.js      <- header "Sign out" is now "Account" (sign-out moved into Account)

## Ship it
GitHub -> girard-native -> Add file -> Upload files -> drag App.js and the src folder -> Commit to main.
Reopen the app twice (over-the-air). If it doesn't take effect, do one build:
Builds -> Build from GitHub -> main -> preview -> Android -> Confirm.

No new dependency, so no version risk. Sign out now lives inside Account.
