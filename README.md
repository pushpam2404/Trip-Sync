# TripSync

A road trip planner for India. You pick a route, find a stay, add petrol and food stops on the way, and ask Sakha (a Gemini-backed chat assistant) when you are unsure. Trips and saved routes sync to your account.

Live: https://trip-sync-rho.vercel.app

<p>
  <img src="docs/screenshots/login-desktop.png" alt="TripSync sign-in page on desktop" width="720">
</p>

<p>
  <img src="docs/screenshots/home-mobile.png" alt="Home screen on a phone" width="190">
  <img src="docs/screenshots/sakha-mobile.png" alt="Sakha chat with a navigation card" width="190">
  <img src="docs/screenshots/planner-mobile.png" alt="Trip planner, choosing a stay" width="190">
  <img src="docs/screenshots/history-mobile.png" alt="Trip history" width="190">
</p>

The screenshots come from the real production build running against a throwaway mock API with made-up data (Asha Rao and her trips are not real). The live map screen is not shown because map tiles need a Mappls key.

## What it does

- Sign up with a phone number and password, then add your name and vehicles (bikes and cars, with registration numbers).
- Sakha chat. Describe a trip and the reply can include a card that starts navigation. Quick route is the form version, with place suggestions and voice input.
- Trip planner in three steps: destination, stay, places to visit near the stay. Places you add become saved routes.
- Navigation screen with the route on a Mappls map, the next instruction, arrival time, distance and drive time. You can add stops along the way: petrol, food, ATM, EV charging, or any searched place.
- Trip history. Ending a trip logs it with route, vehicle, travellers and stops. Any past trip or saved route can be started again.
- Account page for your name, vehicles and a light or dark theme.

## Status

I stopped working on this for a while and have now gone through it again. The main fixes are listed in the [commit history](https://github.com/pushpam2404/Trip-Sync/commits/main). Two examples: trip history never got any entries because nothing called the function that saves them, and the navigation screen threw as soon as a route arrived.

What I have checked: both packages typecheck and build, the server's tests pass, and I clicked through sign-up, sign-in, Sakha, the planner, saved routes, history, account, the trip setup sheets and the navigation screen in a browser at phone and desktop widths. An automated accessibility scan (axe) reported nothing on the main screens in both themes.

What I have not checked: the map and turn-by-turn guidance against a live Mappls account while moving, Sakha against a live Gemini key, and the server against a real MongoDB in this pass. Those need credentials, so treat them as the likeliest places for a remaining bug.

## How it is built

| Part | Tools |
|------|-------|
| Client | React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7, Motion, Lucide icons |
| Server | Node, Express 4, TypeScript, Mongoose, express-validator, helmet, express-rate-limit |
| Data | MongoDB (Atlas free tier in production) |
| Maps | Mappls web SDK for the map, Mappls REST for search and directions |
| AI | Google Gemini through `POST /api/sakha`, so the key stays on the server |

```
client/   React app (screens, components, contexts, services)
server/   Express API (routes, controllers, middleware, models, tests)
docs/     architecture, developer guide, product notes
```

More detail in [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md).

## Running it locally

You need Node 20 or newer and a MongoDB database.

```bash
git clone https://github.com/pushpam2404/Trip-Sync.git
cd Trip-Sync
npm run install:all

cp server/.env.example server/.env       # fill in MONGO_URI and JWT_SECRET
cp client/.env.example client/.env.local # optional Mappls keys

npm run dev:server   # http://localhost:3001
npm run dev:client   # http://localhost:5173
```

Without Mappls keys the app runs, but place suggestions are empty and the map shows a message. Without `GEMINI_API_KEY`, Sakha answers that it is not configured.

### Environment variables

| File | Variable | Needed for |
|------|----------|------------|
| `server/.env` | `MONGO_URI`, `JWT_SECRET` | required, the server will not start without them |
| `server/.env` | `ALLOWED_ORIGINS` | CORS, set to the client URL in production |
| `server/.env` | `GEMINI_API_KEY`, `GEMINI_MODEL` | Sakha chat |
| `client/.env.local` | `VITE_API_URL` | API base URL, defaults to `http://localhost:3001/api` in dev |
| `client/.env.local` | `VITE_MAPPLS_MAP_SDK_KEY`, `VITE_MAPPLS_REST_API_KEY` | map, search and directions |

The two Mappls keys end up in the browser bundle, which is how Mappls expects them to be used. Restrict them to your domains. The Gemini key is never sent to the browser.

### Scripts

| Command | Does |
|---------|------|
| `npm run dev:server` / `npm run dev:client` | start the dev servers |
| `npm run typecheck` | type-check both packages |
| `npm run build` | build both packages |
| `npm test` | server tests (token handling, validation, CORS, phone normalisation) |

## Deployment

The live site uses free tiers: the client on Vercel, the API on Render, the database on MongoDB Atlas. The settings I use are in the [developer guide](docs/DEVELOPER_GUIDE.md#deployment). The Render free tier sleeps when idle, so the first request after a quiet spell can take a while.

## Known limitations

- Sign-in is a phone number and password with no OTP check.
- The session token is a 30-day JWT kept in `localStorage`. There is no refresh or server-side revocation.
- Walking and train modes use the car route, so their estimates are for a car.
- History stores the route estimate from when the trip ended, not a measured time or distance.
- Distance and drive time on the navigation screen are fixed at the moment the route was fetched.
- The client has no automated tests yet.
- The default Gemini model name is `gemini-3.5-flash`. If your key cannot use it, set `GEMINI_MODEL`.

## Roadmap

1. Run a real drive against the live Mappls API and tighten turn progress.
2. Offline cache for the last route and history.
3. Walking and transit routing.
4. Shared trips and a split-the-costs sheet.

## License

MIT, see [LICENSE](LICENSE).
