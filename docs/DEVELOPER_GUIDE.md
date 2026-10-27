# Developer guide

## Requirements

- Node.js 20 or newer
- A MongoDB database: local, or a free Atlas cluster
- Optional, for the full experience: a Mappls account (map SDK key and REST key) and a Google AI Studio key for Gemini

Without the Mappls keys the app still runs. Login, history, saved routes and Sakha work; place suggestions are empty, the planner lets you type places, and the navigation screen shows a trip summary and an explanation instead of a map. Without `GEMINI_API_KEY`, Sakha runs in demo mode.

## First run

```bash
git clone https://github.com/pushpam2404/Trip-Sync.git
cd Trip-Sync
npm run install:all

cp server/.env.example server/.env      # set MONGO_URI and JWT_SECRET at least
cp client/.env.example client/.env.local   # VITE_API_URL is required

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
| `GEMINI_API_KEY` | no | Turns on the real Sakha. Without it `POST /api/sakha` answers from the built-in demo responder (`server/src/utils/sakhaDemo.ts`) and `GET /api/sakha` reports `{ demo: true }`, which makes the client show a "Demo mode" badge. |
| `GEMINI_MODEL` | no | Defaults to `gemini-2.5-flash`, which Google lists as free of charge. Google's pricing page also lists `gemini-3.8-flash` and `gemini-3.6-flash` as free; set `GEMINI_MODEL` to try one. There is no `gemini-3.5-flash`. |
| `PORT` | no | Defaults to 3001. Hosts such as Render set it. |

### `client/.env.local`

Vite only exposes names that start with `VITE_`, and everything in this file ends up in the browser bundle.

| Name | Notes |
|------|-------|
| `VITE_API_URL` | Required. API base URL, for example `http://localhost:3001/api` (`/api` is added if you leave it off). There is no fallback and no development default. When it is missing the app renders a configuration screen and logs the missing name to the console. It is read at build time, so rebuild or restart `vite` after changing it. |
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

The client tests use vitest (`npm test` in `client/`). They cover the pure logic: phone normalisation, distance and duration formatting, route and polyline parsing, API error mapping, how a finished trip is turned into a history entry and request body, and the `VITE_API_URL` handling.

The server tests use Node's built-in runner. `npm test` in `server/` compiles with `tsc` and runs `node --test` on `dist/__tests__`. They cover token handling and the `protect` middleware, phone normalisation, request validation and CORS. They do not need a database.

GitHub Actions (`.github/workflows/ci.yml`) runs install, typecheck, tests and build for both packages on every push.

## Conventions

- Screens are default exports in `client/src/screens`, registered with `lazy()` in `App.tsx`.
- Colours, fonts and radii are tokens in `client/src/index.css`. Components use the semantic names (`bg-surface`, `text-ink-soft`) so light and dark both work. Avoid raw hex values in components.
- Shared UI goes in `components/ui`. Icons are re-exported from `components/ui/icons.tsx` (Lucide), so swapping the set is a one-file change.
- Changes to trips, saved routes and vehicles are applied on screen first and rolled back with a toast if the server refuses them. Keep new mutations in `TripContext` or `AuthContext` that way, and pass messages through `useToast`.
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

## Session token storage

The login token is a 30-day JWT kept in `localStorage` under `tripsync-user`, and the axios instance sends it as a bearer header. I kept it there on purpose. The alternative, an httpOnly cookie, needs `SameSite=None` cookies between the Vercel and Render domains plus CSRF protection, which is more machinery than this project justifies. The cost is that any script injected into the page could read the token, so the client avoids `dangerouslySetInnerHTML` and third-party scripts. A 401 from the API on a request that carried a token signs the user out.

## Installing on a phone

`client/public/manifest.webmanifest`, the icons next to it and `client/public/sw.js` make the site installable. The service worker is registered only in production builds. It tries the network first for page loads and falls back to the last copy of the app, and it caches the hashed files under `/assets/` the first time they are fetched. It never touches API calls or other origins. After a bad deploy you can remove it by deleting `sw.js` and the registration at the bottom of `client/src/main.tsx`.

## Deployment

The live setup uses free tiers.

- Client on Vercel with `client` as the root directory. `client/vercel.json` rewrites every path to `index.html` so deep links like `/history` work after a refresh. Set `VITE_API_URL` (required, the Render URL ending in `/api`), `VITE_MAPPLS_MAP_SDK_KEY` and `VITE_MAPPLS_REST_API_KEY` in the project settings, then redeploy, because Vite bakes them in at build time.
- Server on Vercel as a serverless function with `server` as the root directory (see "Bringing the live app back from scratch"). It can also run on Render or any Node host with `npm run build && npm start`; set `MONGO_URI`, `JWT_SECRET` and `ALLOWED_ORIGINS`. `GEMINI_API_KEY` and `GEMINI_MODEL` are optional; leave the key out to keep Sakha in demo mode.
- MongoDB on an Atlas free cluster. Allow `0.0.0.0/0`, because neither Vercel nor Render has fixed outbound addresses on a hobby project.

### Bringing the live app back from scratch

The API runs on Vercel as a serverless function (`server/api/index.ts` wraps the same Express app that `npm start` runs, and `server/vercel.json` sends every path to it).

1. Create a free MongoDB Atlas M0 cluster, a database user, and allow access from anywhere (`0.0.0.0/0`), since Vercel has no fixed outbound addresses.
2. Create a Vercel project from this repo with `server` as the root directory, and set `MONGO_URI`, `JWT_SECRET` and `ALLOWED_ORIGINS` (the client's Vercel URL). Leave `GEMINI_API_KEY` unset to keep Sakha in demo mode.
3. Deploy. `GET <api url>/health` should return `healthy`, and `GET <api url>/api/sakha` should answer without a login error page.
4. In the client's Vercel project set `VITE_API_URL` to `<api url>/api` and redeploy it. Vite reads it at build time.

A function has no always-on process, so the MongoDB connection is opened once per warm instance and reused. The first request after a quiet period pays for a cold start, which is a second or two and not the minute a sleeping free Render service can take.

Render still works as an alternative: `render.yaml` defines the same API as a Node web service. Use New > Blueprint, paste `MONGO_URI`, and point `VITE_API_URL` at its URL.

## Troubleshooting

### Missing required environment variables on server start

Copy `server/.env.example` to `server/.env` and fill in `MONGO_URI` and `JWT_SECRET`.

### Browser shows a CORS error

The client origin is not in `ALLOWED_ORIGINS`. Include the scheme and port, for example `http://localhost:5173`.

### The app shows "TripSync is not configured"

`VITE_API_URL` was not set when the client was built. Set it in `client/.env.local` or the Vercel project settings and rebuild.

### Sakha shows a Demo mode badge

The server has no `GEMINI_API_KEY`. Set it and restart the server to get real answers.

### Suggestions are empty

`VITE_MAPPLS_REST_API_KEY` is missing or restricted to other domains. Restart `vite` after changing env files.

### The navigation screen shows directions but no map

`VITE_MAPPLS_MAP_SDK_KEY` is missing or the SDK could not load. The note at the top of the screen gives the reason.

