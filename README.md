# SlugNav

UCSC campus navigation app for CSE 115A. Built with React Native, Expo,
TypeScript, and Supabase.

## Running the App:

Use **Node 22.13+ within Node 22**, **npm 10**, and **Expo Go compatible with SDK
57**. `.nvmrc` selects Node 22 if you use nvm. Docker and the Supabase CLI are not
required to run the app.

```sh
npm ci
npm start
```

Scan the QR code with Expo Go on a phone on the same network, or run
`npm run web` for a browser preview. The starter screen works without Supabase
configuration so you can work on UI immediately.

## Connecting to Supabase:

Shared project: [SlugNav](https://supabase.com/dashboard/project/sfpruukagfcjkkhtswlo).

1. Copy `.env.example` to `.env.local`. The project URL is already filled in.
2. Get the **publishable key** (`sb_publishable_...`) from the project's Connect
   dialog or API Keys settings and set `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Restart Expo, then run `npm run check:backend` to verify the URL and key.

Local environment files are ignored by Git. `EXPO_PUBLIC_` values are bundled
into the app: never use a secret/service-role key, database password, or access
token here. Running the app only needs the project URL and publishable key.

Use `getSupabase()` from `@/lib/supabase` for auth and database requests. It
requires the environment configuration above. Session persistence and native
foreground refresh are configured; login screens and auth callbacks are still
feature work. Native sessions use AsyncStorage, which is not encrypted storage.

## Useful Terminal Commands

| Command | Purpose |
| --- | --- |
| `npm start` | Start Expo for a phone |
| `npm run web` | Open the web preview |
| `npm run ios` / `npm run android` | Open an installed simulator/emulator |
| `npm run typecheck` | Check TypeScript |
| `npm run export` | Check production bundling for iOS, Android, and web |
| `npm run check:scripts` | Check if scripts pass linting/formatting \(runs before committing/pushing changes in Visual Studio Code IDE\) |
| `npm run check:backend` | Verify the URL/key against the hosted Auth API |

Bundling does not test native device behavior. The backend connection check does
not test database access or table permissions.

## Working on the Project

- Screens and navigation: `src/app/`. Keep reusable code outside that directory.
- Shared Supabase client: `src/lib/supabase.ts`; native refresh hook: `src/hooks/`.
- Work on feature branches and open PRs into `main`.
- Use `npx expo install <package>` for native dependencies. Commit `package.json`
  and `package-lock.json` together; teammates install with `npm ci`.
- Run type-checking and export before review. The tooling PR can run these in CI
  and add the team's linter/formatter. CI and linting are not configured yet.
- Database contributors can use the Supabase CLI for versioned SQL migrations.
  Add tables, explicit permissions, and row-level security policies together;
  test access as different users before deploying to the shared project. No
  application tables are introduced by this scaffold.

`npm audit` currently reports upstream Expo dependency advisories. Review them
before releases; `npm audit fix --force` can break Expo SDK compatibility.

**Setup References:**
- [Expo / Expo Go](https://docs.expo.dev/get-started/create-a-project/)
- [Supabase React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native).
- Planning:
  - [Sprint 1](sprint1.md)
  - [Release Plan](RELEASE_PLAN.md).
