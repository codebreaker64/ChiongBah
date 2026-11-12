# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users
Singapore NSFs (SAF, SPF, SCDF) and NSmen preparing for the 3-station IPPT: push-ups, sit-ups and the 2.4 km run. They open the app between training sessions, often tired and on a phone in one hand, to log a result, check their points and see how far they are from the next award. During a camera set the phone is propped sideways on the floor about 2 m away, so those screens are read at a distance and cannot rely on taps.

## Product Purpose
Help a serviceman reach a target IPPT award (Pass, Pass with Incentive, Silver, Gold) by the date of their next test. Success is the user knowing their current practice score, the gap to their target, and the cheapest next points to earn, within a few seconds of opening the app.

## Positioning
The app scores against the official IPPT tables for the user's age band and shows "where the next points are cheapest" per station, and its camera counts push-ups and sit-ups by IPPT-style rules on the phone itself.

## Operating Context
- Countdowns to the next IPPT and to ORD (SAF) or ROD (SPF/SCDF) for NSFs.
- Results come from manual entry, the on-device camera counter, or runs imported from Health Connect with a 2.4 km adjustment.
- Camera sets run in landscape, hands-free: a spoken "3, 2, 1, go" starts the timer once every setup check is ticked.

## Capabilities and Constraints
- Expo (SDK 58) and React Native with Reanimated 4 and Expo Router; Android first, iOS later.
- All data stays on the device (SQLite). No accounts, no cloud sync.
- Every score is labelled a practice estimate.
- Male scoring tables only for now.

## Brand Commitments
- Name: Chiong Bah. Mark: a gold IPPT medal with two generic rank chevrons on a green V ribbon (approved 5 Nov 2026).
- Unofficial: no SAF, MINDEF, SPF or SCDF logos, crests, real rank insignia, weapons, targets or crosshairs.
- Voice: plain, encouraging, Singapore-English friendly without slang overload.

## Evidence on Hand
- Official IPPT score tables in `src/domain/scoring/tables/`.
- No testimonials, user counts or ratings exist; do not invent them.

## Product Principles
1. Score first: the number and the gap to the next award are always one glance away.
2. Never pretend to be official.
3. Hands-free when the body is busy; taps only when the user is at the phone.
4. Private by default: nothing leaves the device unless the user exports it.

## Accessibility & Inclusion
- Honour the system Remove animations setting: every animation has an instant or crossfade fallback.
- Text scales with the system font size up to 1.3x.
- Gender-neutral wording.
