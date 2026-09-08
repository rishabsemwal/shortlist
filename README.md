# Shortlist

> Post ideas, vote on what matters most, and watch the roadmap grow.

A feature-voting board built with **Next.js 14 (App Router)**, **TypeScript**, **Firebase Auth**, and **Cloud Firestore** — deployed on Vercel.

---

## Live Demo

[https://shortlist-yourname.vercel.app](https://shortlist-yourname.vercel.app) ← replace with your Vercel alias

---

## Local Setup

### Prerequisites
- Node.js 18+
- A Firebase project (invite from Siempi, or your own for testing)

### 1. Clone & install

```bash
git clone https://github.com/your-username/shortlist.git
cd shortlist
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your Firebase values:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```
# Firebase Client SDK (from Firebase Console → Project Settings → General → Your Apps)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (Firebase Console → Project Settings → Service Accounts → Generate New Private Key)
# Paste the ENTIRE downloaded JSON as a single-line string:
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

**How to convert the service account JSON to a single line (Windows PowerShell):**
```powershell
Get-Content .\serviceAccount.json | ConvertTo-Json -Compress
```

### 3. Deploy Firestore security rules

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Using the Firebase Emulator (recommended for development)

Avoids burning through Firestore's free-tier daily quota:

```bash
firebase emulators:start
```

Then add these to `.env.local` to point the app at the emulator:
```
NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=localhost:8080
NEXT_PUBLIC_AUTH_EMULATOR_HOST=http://localhost:9099
```

---

## Required Environment Variables

| Variable | Where to find it | Exposed to browser? |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → Apps | ✅ Yes (safe) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Same | ✅ Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Same | ✅ Yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Same | ✅ Yes |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Same | ✅ Yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Same | ✅ Yes |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Console → Project Settings → Service Accounts | ❌ **Server only** |

---

## Deployment to Vercel

1. Push repo to GitHub (public repository, no secrets committed)
2. Import repo in [Vercel](https://vercel.com) → `New Project`
3. Add all env vars from `.env.local` in **Vercel → Project Settings → Environment Variables**
4. Deploy → note the **stable production alias** (e.g. `shortlist-yourname.vercel.app`)
5. Add that alias to **Firebase Console → Authentication → Settings → Authorized Domains**

> ⚠️ Use the **stable alias**, not the per-deployment hashed URL — hashed URLs change on every push.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page (public)
│   ├── sign-in/page.tsx      # Google sign-in
│   ├── board/page.tsx        # Protected idea board
│   └── api/
│       ├── waitlist/route.ts           # POST → Admin SDK → Firestore
│       └── ideas/[ideaId]/vote/route.ts # POST vote (server-side transaction)
├── components/
│   ├── Navbar.tsx
│   ├── WaitlistForm.tsx
│   ├── IdeaForm.tsx
│   └── IdeaCard.tsx
├── context/
│   └── AuthContext.tsx       # Firebase Auth React context
├── lib/
│   ├── firebase-client.ts    # Client SDK (browser-safe)
│   └── firebase-admin.ts     # Admin SDK (server-only)
└── types/
    └── index.ts
```

---

## Security Notes

- **`.env.local` is in `.gitignore`** — never committed
- **`FIREBASE_SERVICE_ACCOUNT`** has no `NEXT_PUBLIC_` prefix — never in the browser bundle
- **Firestore rules** enforce all business logic server-side — the UI is not the only guard
- **Double-voting** is prevented structurally: vote doc ID = userId, so a second write would require `!exists()` to pass — it won't
