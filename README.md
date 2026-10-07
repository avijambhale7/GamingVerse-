# GamingVerse

Games, café bookings, a CD & accessories marketplace and a community feed —
React + Vite on Vercel, with Firebase Auth and the Realtime Database.

## Deploying database rules

`database.rules.json` is published to the live database automatically by the
GitHub Actions workflow `.github/workflows/deploy-rules.yml`:

- it runs on every push to `main` that changes `database.rules.json`, and can
  also be started by hand (Actions → **Deploy database rules** → **Run workflow**);
- it first compiles the rules in the Firebase emulator — a broken rule stops
  the deploy — then runs `firebase deploy --only database`.

**One-time setup — add the secret:**

1. Firebase console → Project settings → **Service accounts** →
   **Generate new private key** (or reuse the JSON already set as
   `FIREBASE_SERVICE_ACCOUNT` on Vercel).
2. GitHub repo → **Settings** → **Secrets and variables** → **Actions** →
   **New repository secret**.
3. Name: `FIREBASE_SERVICE_ACCOUNT`. Value: the whole JSON file contents.
   Save.

The key only ever lives in that secret; the workflow writes it to a temporary
file for the deploy (`GOOGLE_APPLICATION_CREDENTIALS`) and deletes it after.
Never commit the JSON file.

To check the rules locally the same way the workflow does:

```bash
npx firebase-tools emulators:exec --only database --project demo-gamingverse "node scripts/validate-rules.mjs"
```

Admin → Overview → **System status** shows whether the live rules match this
build.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
