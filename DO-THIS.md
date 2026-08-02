# App: turn on the REAL Pay / Book (replaces "Coming soon")

This is the APP side. The "Coming soon" message is baked into the app, so it only
changes after you upload these and BUILD a new app.

Files:
  package.json                          <- adds expo-web-browser
  src/screens/PropertyDetailScreen.js   <- real Paystack Pay/Book flow

## Step 1 — upload to the APP repo (girard-native)
GitHub -> girard-native repo -> Add file -> Upload files ->
drag in package.json AND the src folder -> Commit.

## Step 2 — BUILD (required; new native module can't go over-the-air)
Builds -> Build from GitHub -> main -> preview -> Android -> Confirm.

## Step 3 — install the new APK on your phone
Open the green build's link on your phone, install, open the app.
Now the property page shows a real "Pay ... / yr" button instead of "Coming soon".

## Before testing a payment
Make sure PAYSTACK_SECRET_KEY in Vercel is set to your sk_test_... key first,
so test payments move no real money.
