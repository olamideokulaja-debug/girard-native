# App: real Pay / Book (needs ONE build — adds expo-web-browser)

Files:
  package.json                          <- adds expo-web-browser
  src/screens/PropertyDetailScreen.js   <- Pay/Book now starts a real Paystack payment

## Upload to girard-native repo, then build
1. GitHub -> girard-native -> Add file -> Upload files -> drag package.json and the src folder -> Commit.
2. Build: Builds -> Build from GitHub -> main -> preview -> Android -> Confirm.
   (New native module = a build is required; can't go over-the-air.)

## How it works
Tap "Pay ... / yr" on a property -> app asks your website to start the payment ->
opens the real Paystack checkout in the phone browser -> after you finish, the app
verifies it succeeded. Landlord split rides along via the property's subaccount/split.
