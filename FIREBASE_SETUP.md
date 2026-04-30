# Firebase setup — Assumption Learning Lens

This guide walks you through turning the prototype into a real Firebase deployment.
Demo mode keeps working until you set the env vars in this guide.

Allow about 30 minutes the first time.

---

## 1. Create a Firebase project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `assumption-learning-lens` (or similar) → continue.
3. Disable Google Analytics for now (not needed for V1) → create.

---

## 2. Enable Authentication

1. In the Firebase console sidebar, open **Build → Authentication**.
2. Click **Get started**.
3. Open the **Sign-in method** tab.
4. Enable **Google**.
   - Project public-facing name: *Assumption Learning Lens*
   - Support email: your school IT contact's email.
   - Save.
5. (Optional but recommended) Open **Settings → Authorized domains** and add the
   Netlify domain (e.g. `assumption-learning-lens-za.netlify.app`).

---

## 3. Create Firestore Database

1. In the sidebar open **Build → Firestore Database**.
2. Click **Create database**.
3. Choose **Production mode** (we have rules to deploy).
4. Choose a region close to South Africa (e.g. `europe-west1` or `europe-west3`).
5. Click **Enable**.

---

## 4. Deploy the security rules

Two ways to do this. The console method is fastest for V1.

### Option A — paste in the console

1. In Firestore, open the **Rules** tab.
2. Replace the contents with the file `firestore.rules` from this repo.
3. Click **Publish**.

### Option B — Firebase CLI (recommended for ongoing work)

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # accept defaults; point at firestore.rules
firebase deploy --only firestore:rules
```

---

## 5. Get the Web app config

1. Firebase console → click the gear icon → **Project settings**.
2. Scroll to **Your apps** → click **Web** (`</>`) to register a web app.
3. App nickname: `learning-lens-web`. **Don't** enable Firebase Hosting here
   (Netlify already hosts).
4. Click **Register app**. You'll see a config object like:

```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "assumption-learning-lens.firebaseapp.com",
     projectId: "assumption-learning-lens",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
```

5. Keep this tab open — you'll paste these values into Netlify.

---

## 6. Add the env vars to Netlify

1. Open https://app.netlify.com → your site → **Site configuration → Environment variables**.
2. Add these six variables (the prefix `VITE_` is required for Vite to expose them to the browser):

   | Name | Value (from Firebase config) |
   |------|------------------------------|
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

3. Click **Save**.
4. Trigger a rebuild: **Deploys → Trigger deploy → Deploy site**.
5. Wait ~90 seconds for the new deploy to complete.

> The same env vars also work locally — copy `.env.example` to `.env`,
> paste the values, and run `npm run dev`.

---

## 7. Bootstrap the first management user

The app's `AuthContext` creates new users with `role: 'student'` automatically.
You'll need to promote one user manually so they can manage the rest.

1. Sign in to the live app via Google with your school account once.
2. Open Firestore in the Firebase console → `users` collection.
3. Find the document for your `uid`. Edit `role` from `student` to `management`.
4. Sign out, sign back in. You're now Management.

After this, you can change other users' roles from inside the app's user-management
flow (planned for V2). Until then, add staff and management users by editing their
`role` field in the Firestore console — it's quick.

---

## 8. Test the live app

- Sign in as the management user → check you can create cycles, edit question
  sets, save settings, save a reviewed summary.
- Sign in as a different account → confirm they default to `student`.
- Have a student account submit a feedback form.
- Promote a staff account in Firestore (`role` = `staff`) and confirm they can
  see class summaries.

---

## 9. Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| "Missing or insufficient permissions" | Rules deployed but the user's `users/{uid}` doc doesn't exist | Sign in once via Google so `AuthContext` creates the doc |
| Google sign-in popup shows error | Netlify domain not authorised | Add domain in **Authentication → Settings → Authorized domains** |
| Demo mode still active after env vars added | Site wasn't rebuilt | Trigger a redeploy |
| Random users can read each other's submissions | Old rules cached | Republish `firestore.rules` |

---

## 10. What rules don't enforce (read this once)

The current rules grant Staff and Management read access on `submissions` so the
client can compute averages. This is appropriate for V1 because:

- The UI never shows raw student comments to staff in V1.
- Comments are short text by design.
- The school is a single trusted environment.

For a stricter, multi-school production version:

1. Move all aggregation into Cloud Functions.
2. Change the rule to `allow read: if false;` for the `submissions` collection.
3. Have the Cloud Function return only aggregated documents.
4. Add Firebase App Check to prevent abuse.

This is documented in `ROADMAP.md`.