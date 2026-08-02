# Property Detail screen (ships OVER-THE-AIR — no build needed)

These are JavaScript-only changes, so committing them publishes an over-the-air
update. Your phone gets it on the next app open (open twice if needed).

Files:
  App.js                             <- adds the Property Detail screen to navigation
  src/screens/ListingsScreen.js      <- tapping a listing now opens its detail page
  src/screens/PropertyDetailScreen.js<- NEW: full listing (photos, amenities, description, Pay/Book)

## Upload (no Terminal, NO build)
1. GitHub -> girard-native repo -> Add file -> Upload files.
2. Drag in `App.js` and the `src` folder -> Commit changes to `main`.
3. That triggers the OTA workflow. Wait ~1-2 min, then fully close and
   reopen the Girard app TWICE — the update applies on the second launch.

## What you'll see
- Tap a listing -> full page opens: swipeable photos, rent, amenities chips,
  description, and a "Pay / Book" button (shows "coming soon" for now).
- Back button top-left returns to the feed.

## If it does NOT update over the air
The OTA workflow is new and may need a tweak. If nothing changes after
reopening twice, tell me — worst case we do one build and it's in.

## Reminder
The cropped home-screen ICON fix still needs a BUILD (native). That's separate
from this OTA update.
