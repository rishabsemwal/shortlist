# NOTES.md — Shortlist Assignment Reflection

## What was new to me and how I figured it out

**Firebase Admin SDK in Next.js Route Handlers**
I hadn't wired up the Admin SDK in a serverless environment before. The main hurdle was understanding that `admin.initializeApp()` is called once at module load time, but Next.js hot-reloads can trigger it multiple times in development — solved with a `admin.apps.length > 0` guard before initialising. Learned this from the Firebase docs and a few Next.js + Firebase community threads.

**Firestore Security Rules**
Writing rules that actually enforce business logic (not just "is the user logged in?") was new. The key insight: Firestore rules default-deny everything, which is why the waitlist write *has* to go through the server — a client-side write would be blocked even if I wanted it. For the vote rule, I used `!exists()` to make double-voting impossible at the data layer, not just the UI.

**Stable `onAuthStateChanged` subscription**
Early in development, I noticed that putting the listener in a `useEffect` with dependencies caused it to re-subscribe on every re-render — which would burn through Firestore's daily free-tier quota fast. Fixed it with an empty dependency array `[]`, so it subscribes once and cleans up on unmount.

---

## How I used AI

**What it got right:**
- The overall file/folder structure and naming conventions for Next.js App Router
- The shape of the Firebase client vs. Admin init files
- Helping draft the Firestore transaction logic for the vote handler

**What I overruled:**
- AI first suggested putting `FIREBASE_SERVICE_ACCOUNT` behind `NEXT_PUBLIC_` — caught that immediately and corrected it. Server-only credentials must never have that prefix.
- AI initially used `updateDoc` from the client SDK to increment `voteCount` — I replaced this with a Firestore transaction (both on client and server sides) so the increment is atomic and can't race.
- AI didn't add the `!exists()` guard in the Firestore rules for votes — I added it after re-reading the spec. Without it, rules would allow a second write to a different vote doc if the doc ID wasn't keyed on userId.

**Where it helped most:** boilerplate (tsconfig, package.json, CSS reset) and initial component scaffolding. Every piece of security-sensitive code was reviewed and adjusted manually.

---

## Where I got stuck and how I got unstuck

1. **Admin SDK JSON parsing** — pasting a multi-line JSON string as an env var breaks because newlines aren't preserved. Fix: serialize the key to a single-line string first (`jq -c .` on macOS, `ConvertTo-Json -Compress` on Windows), then parse it with `JSON.parse()` in the init file.

2. **Firestore rules and `serverTimestamp()`** — a `create` rule that checked `request.resource.data.createdAt` against a type failed because `serverTimestamp()` sends a special value the rules simulator doesn't evaluate as a `timestamp`. Solved by removing the timestamp type check from rules and trusting it at the application layer.

3. **Google sign-in popup on mobile** — popups are blocked on some mobile browsers. For this submission I kept popup-based sign-in; a production version would use `signInWithRedirect()` on mobile, detected via user-agent.

---

## What I cut, and why

- **Email/password auth** — Google sign-in covers the requirement and is simpler. Avoided adding a second auth method within the time constraint.
- **Admin "planned/shipped" marking** — optional feature, left for after the required items.
- **Tests** — also optional; focused on getting all five required items solid first.
- **File uploads** — not allowed on the Spark plan (no Cloud Storage), so no user avatars beyond Google's photo URL.

---

## Anything I know is wrong or fragile

- The `voteCount` field on the idea doc is incremented via a Firestore transaction, but if the transaction fails silently (network drop), the displayed count can temporarily drift from the real count until the real-time listener refreshes.
- The sign-in page uses `signInWithPopup`, which fails on mobile browsers that block popups. A more robust implementation would detect mobile and fall back to `signInWithRedirect`.
- `onSnapshot` in the board page will reconnect after network drops automatically, but there's no explicit "reconnecting…" UI state.

---

## What I'd do with another week

1. Add `signInWithRedirect` as a fallback for mobile popups.
2. Write a Jest + Firebase Emulator test around the vote logic — particularly the double-vote rejection path.
3. Implement the admin "planned/shipped" status toggle with an admin UID allowlist in Firestore rules.
4. Add proper error boundaries so a Firestore listener error doesn't silently blank the board.
5. Tune the Firestore index for the `orderBy createdAt desc` query (Firebase console will prompt for it once the index is needed).
6. Consider `signOut` invalidating the token server-side (Admin SDK `revokeRefreshTokens`) for stronger security.
