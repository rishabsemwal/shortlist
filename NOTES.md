# NOTES.md — Shortlist Assignment Notes

## What was new to me

- Firebase Authentication and Firestore were new areas for me.
- I learned how to connect Firebase with a Next.js application.
- I learned the difference between the Firebase client SDK and Admin SDK.
- Firestore Security Rules were new to me. I learned how to restrict users so they can only perform allowed actions.
- I also learned more about React state, `useEffect`, TypeScript types, and Next.js API routes.
- I learned how real-time Firestore updates work using `onSnapshot()`.

## How I used AI

- I used AI during development because the assignment allows AI tools.
- AI helped me understand the requirements and plan the project structure.
- It helped with component scaffolding, Firebase setup, API routes, and debugging.
- Most of the suggestions worked after I tested them.
- I did not blindly use generated code. I reviewed the important parts and changed things when they did not fit the requirements.
- One example was keeping the Firebase service-account credentials server-side instead of exposing them through a `NEXT_PUBLIC_` environment variable.
- AI also helped me understand and implement the voting logic and Firestore rules.

## Where I got stuck

- Firebase Admin SDK setup was new to me, so initially I was confused about how server-side credentials should be handled.
- I worked through the Firebase documentation and tested the API until I understood it.
- Firestore Security Rules were also difficult at first. I tested the rules and adjusted them until the authentication and ownership checks worked correctly.
- I also had some normal debugging issues while connecting Firebase, authentication, and the UI.

## What I cut

- I focused first on the required features.
- I did not implement the optional admin planned/shipped workflow.
- I did not add extensive automated tests because they were optional.
- I left out file uploads because they were not required for the core assignment.

## What I know is fragile

- The voting flow could be made cleaner by making the server-side vote API the only place that changes the vote count.
- Google sign-in uses a popup, which may not work on some mobile browsers that block popups.
- The app could have a better message when the network connection is lost or reconnecting.

## What I would do with another week

- Make the server-side voting flow the only authoritative way to update vote counts.
- Add tests for voting, especially preventing double votes.
- Improve mobile Google sign-in with a redirect fallback.
- Add the optional admin functionality for Planned and Shipped ideas.
- Improve error handling and accessibility.
- Further clean up the code and improve the UI.

## Overall

This assignment helped me understand how a Next.js application can work with Firebase Authentication, Firestore, security rules, and API routes. AI was useful throughout development, but testing and understanding the generated code was important because I need to be able to explain and modify the project during the follow-up call.
