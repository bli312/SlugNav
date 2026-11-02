# SlugNav

UCSC campus navigation app for CSE 115A. Built with React Native, Expo,
TypeScript, and Supabase.

## Running the App:

Use **Node 22.13+ within Node 22**, **npm 10**, and **Expo Go compatible with SDK
57**. `.nvmrc` selects Node 22 if you use nvm. Docker and the Supabase CLI are not
required to run the app.

Set up `.env.local` using [Connecting to Supabase](#connecting-to-supabase), then
install dependencies and start Expo:

```sh
npm ci
npm start
```

Scan the QR code with Expo Go on a phone on the same Wi-Fi. Before signing in
for the first time, register your [Expo Go callback](#expo-go-callback).

If the phone cannot connect or Supabase shows "Sorry, you have been blocked,"
stop Expo with Ctrl+C and try `npm start -- --tunnel`. Both devices need internet
access. The tunnel helper is included in `npm ci`; no global installation is
needed. Register the new callback URL when switching to a tunnel.

Use `npm run web` for a browser preview.

## Connecting to Supabase:

Shared project: [SlugNav](https://supabase.com/dashboard/project/sfpruukagfcjkkhtswlo).

1. Copy `.env.example` to `.env.local`. The project URL is already filled in.
2. Get the **publishable key** (`sb_publishable_...`) from the project's Connect
   dialog or API Keys settings and set `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Restart Expo to load the environment settings.

Local environment files are ignored by Git. `EXPO_PUBLIC_` values are bundled
into the app: never use a secret/service-role key, database password, or access
token here. Running the app only needs the project URL and publishable key.

Use `getSupabase()` from `@/lib/supabase` for auth and database requests. It
requires the environment configuration above. Session persistence and native
foreground refresh are configured. Native sessions use AsyncStorage, which is
not encrypted storage.

### Google sign-in

The Google provider and signup restrictions are shared across the team.

- Google OAuth: **External** audience, **Web application** client. See the
  [official setup guide](https://supabase.com/docs/guides/auth/social-login/auth-google).
  Google callback: `https://sfpruukagfcjkkhtswlo.supabase.co/auth/v1/callback`.
- Supabase: Google enabled; email and anonymous sign-ins disabled; new-user
  signups enabled. Keep **Skip nonce checks** and **Allow users without an email**
  off. Google client ID/secret stay in Supabase; no extra app environment variables.
- Development Site URL: `http://localhost:8081`. Allowed app redirects:
  `http://localhost:8081/auth/callback` and `slugnav://auth/callback`.

The [SQL migration](supabase/migrations/20261016000000_ucsc_google_auth.sql) defines
the UCSC signup restrictions. Apply it, then enable **Before User Created** under
**Authentication → Auth Hooks**, using **Postgres**, schema `public`, and function
`before_ucsc_user_created`.

### Expo Go callback

Each teammate running their own Metro server registers their own callback.
The same steps apply to LAN and tunnel URLs:

1. Copy the full `exp://…` URL shown beside the terminal QR code and append
   `/--/auth/callback`, preserving any port. For example:

   ```text
   Metro URL:    exp://abc123.exp.direct
   Callback URL: exp://abc123.exp.direct/--/auth/callback
   ```

2. Open [Supabase URL Configuration](https://supabase.com/dashboard/project/sfpruukagfcjkkhtswlo/auth/url-configuration)
   → **Redirect URLs → Add URL**, paste your callback, and save. Keep the other
   teammates' URLs. Google Console and `.env.local` need no callback changes.

Register it once and update it only if Metro shows a different URL, such as
after an IP/port change or switching between LAN and tunnel mode. Tunnel
addresses normally persist for the same project, Expo account, and port while
`.expo/` is retained. Use exact callbacks so the allow list covers the team's
servers.

For a stable callback across devices, Expo recommends
[development builds](https://docs.expo.dev/guides/authentication/). Installed
SlugNav builds use the existing `slugnav://auth/callback` redirect.

## Useful Terminal Commands

| Command | Purpose |
| --- | --- |
| `npm start` | Start Expo Go over the local network (default) |
| `npm start -- --tunnel` | Fallback for connection problems or blocked LAN callbacks |
| `npm run web` | Open the web preview |
| `npm run ios` / `npm run android` | Open an installed simulator/emulator |
| `npm run typecheck` | Check TypeScript |
| `npm test` | Run unit, component, and database tests locally |
| `npm run export` | Check production bundling for iOS, Android, and web |
| `npm run check:scripts` | Run TypeScript, ESLint, and tests |

Bundling does not test native device behavior.

Tests use Node's test runner and PGlite for data/database behavior, and
Jest with React Native Testing Library for components. They use synthetic data
and do not connect to the shared Supabase project.

## Working on the Project

- Screens and navigation: `src/app/`. Keep reusable code outside that directory.
- Shared Supabase client: `src/lib/supabase.ts`; native refresh hook: `src/hooks/`.
- Work on feature branches and open PRs into `main`.
- Use `npx expo install <package>` for native dependencies. Commit `package.json`
  and `package-lock.json` together; teammates install with `npm ci`.
- Run `npm run check:scripts` and `npm run export` before review. The checks cover
  TypeScript, ESLint, and tests; GitHub CI is not configured yet.
- Database contributors can use the Supabase CLI for versioned SQL migrations.
  Add tables, explicit permissions, and row-level security policies together;
  test access as different users before deploying to the shared project. See the
  [class schema](docs/class-schema.md) for tables, access rules, and SQL setup
  required for saving classes. `supabase/classes.sql` is a destructive class-data
  reset, not a routine setup step for each teammate.

`npm audit` currently reports upstream Expo dependency advisories. Review them
before releases; `npm audit fix --force` can break Expo SDK compatibility.

**Setup References:**
- [Expo / Expo Go](https://docs.expo.dev/get-started/create-a-project/)
- [Supabase React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native).
- Planning:
  - [Release Plan](RELEASE_PLAN.md).
  - [Sprint 1](sprint1.md)
  - [Sprint 2](sprint2.md)
