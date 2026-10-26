# Developer guide

## Requirements

- Node.js 20 or newer
- A MongoDB database: local, or a free Atlas cluster
- Optional, for the full experience: a Mappls account (map SDK key and REST key) and a Google AI Studio key for Gemini

Without the Mappls keys the app still runs. Login, history, saved routes and Sakha work; place suggestions are empty and the map screen shows an explanation.

## First run

```bash
git clone https://github.com/pushpam2404/Trip-Sync.git
cd Trip-Sync
npm run install:all

cp server/.env.example server/.env      # set MONGO_URI and JWT_SECRET at least
cp client/.env.example client/.env.local

npm run dev:server    # terminal 1, http://localhost:3001
npm run dev:client    # terminal 2, http://localhost:5173
```

Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Environment variables

### `server/.env`

| Name | Required | Notes |
|------|----------|-------|
| `MONGO_URI` | yes | Connection string. The server exits at startup if it is missing. |
| `JWT_SECRET` | yes | Signing secret. No default. |
| `ALLOWED_ORIGINS` | no | Comma separated browser origins. Defaults to `http://localhost:5173,http://localhost:3000`. Set it to your Vercel URL in production. |
| `GEMINI_API_KEY` | no | Enables Sakha. Without it `POST /api/sakha` answers 503. |
| `GEMINI_MODEL` | no | Defaults to `gemini-3.5-flash`. Change it if that model name is not available to your key. |
| `PORT` | no | Defaults to 3001. Render sets it. |

### `client/.env.local`

Vite only exposes names that start with `VITE_`, and everything in this file ends up in the browser bundle.

| Name | Notes |
|------|-------|
| `VITE_API_URL` | API base URL, for example `http://localhost:3001/api`. In development it defaults to that. A production build without it falls back to the deployed Render API configured in `src/services/api.ts`. |
| `VITE_MAPPLS_MAP_SDK_KEY` | Loads the map on `/navigation`. |
| `VITE_MAPPLS_REST_API_KEY` | Place search, geocoding, directions. |

Mappls keys are meant to be used from the browser. Restrict them to your domains in the Mappls console.

## Scripts

From the repository root:

| Command | What it does |
|---------|--------------|
| `npm run install:all` | Installs both packages. |
| `npm run dev:server`, `npm run dev:client` | Dev servers. |
| `npm run typecheck` | `tsc --noEmit` in both packages. |
| `npm run build` | Builds the server to `server/dist` and the client to `client/dist`. |
| `npm test` | Server tests. |

The server tests use Node's built-in runner. `npm test` in `server/` compiles with `tsc` and runs `node --test` on `dist/__tests__`. They cover token handling and the `protect` middleware, phone normalisation, request validation and CORS. They do not need a database.

GitHub Actions (`.github/workflows/ci.yml`) runs install, typecheck, build and the server tests for both packages on every push.

## Conventions

- Screens are default exports in `client/src/screens`, registered with `lazy()` in `App.tsx`.
- Colours, fonts and radii are tokens in `client/src/index.css`. Components use the semantic names (`bg-surface`, `text-ink-soft`) so light and dark both work. Avoid raw hex values in components.
- Shared UI goes in `components/ui`. Icons are re-exported from `components/ui/icons.tsx` (Lucide), so swapping the set is a one-file change.
- Server routes are plural kebab-case nouns. Controllers throw `HttpError` and never write their own 500 responses.

### Add a screen

1. Create `client/src/screens/YourScreen.tsx` with a default export.
2. Add `const YourScreen = lazy(() => import('./screens/YourScreen'))` and a `<Route>` in `client/src/App.tsx`. Put it under `AppShell` if it should have the navigation, or beside `account` if it should be full screen.
3. Link to it with `NavLink` or `useNavigate`.

### Add an endpoint

1. Add a controller in `server/src/controllers`. Use `req.user!._id` for anything owned by the user.
2. Add the route in `server/src/routes` with a validation chain ending in `validateRequest`, and wrap the controller in `asyncHandler`.
3. Mount new route files in `server/src/app.ts`.
4. Add a test in `server/src/__tests__` if the validation or auth behaviour is worth pinning.

## Deployment

The live setup uses free tiers.

- Client on Vercel with `client` as the root directory. `client/vercel.json` rewrites every path to `index.html` so deep links like `/history` work after a refresh. Set `VITE_API_URL`, `VITE_MAPPLS_MAP_SDK_KEY` and `VITE_MAPPLS_REST_API_KEY` in the project settings.
- Server on Render as a Node web service with `server` as the root directory. Build command `npm install && npm run build`, start command `npm start`. `typescript` and the `@types/*` packages are regular dependencies so the build works when Render skips dev dependencies. Set `MONGO_URI`, `JWT_SECRET`, `ALLOWED_ORIGINS` (the Vercel URL) and `GEMINI_API_KEY`.
- MongoDB on an Atlas free cluster. Allow Render's outbound addresses, or `0.0.0.0/0` if you accept that trade-off on a hobby project.

The Render free tier sleeps when idle, so the first request after a quiet period can take close to a minute.

## Troubleshooting

### Missing required environment variables on server start

Copy `server/.env.example` to `server/.env` and fill in `MONGO_URI` and `JWT_SECRET`.

### Browser shows a CORS error

The client origin is not in `ALLOWED_ORIGINS`. Include the scheme and port, for example `http://localhost:5173`.

### Sakha says it is not configured

Set `GEMINI_API_KEY` on the server and restart it.

### Suggestions are empty

`VITE_MAPPLS_REST_API_KEY` is missing or restricted to other domains. Restart `vite` after changing env files.

### The map area shows an error

`VITE_MAPPLS_MAP_SDK_KEY` is missing or the SDK could not load.

