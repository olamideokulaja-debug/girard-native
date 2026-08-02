# App: auto-return after payment (JavaScript-only)

File:
  src/screens/PropertyDetailScreen.js  <- now auto-returns from Paystack and confirms

## Ship it
GitHub -> girard-native -> Add file -> Upload files -> drag the `src` folder -> Commit to main.
Then reopen the app twice (over-the-air). If it doesn't take effect, do one build:
Builds -> Build from GitHub -> main -> preview -> Android -> Confirm.

NOTE: the WEBSITE api changes (initialize + pay-return) must be deployed too, or
the auto-return has nowhere to bounce back from.
