# TripSync — Smart Travel Companion

TripSync is a production-grade, AI-powered travel companion web application built for Indian road travelers. By combining real-time navigation, custom transit profiles, dynamic waypoints, and a conversational AI co-pilot, TripSync simplifies road trip planning and driving logistics into a single dashboard.

---

## 1. Product Overview

TripSync transforms travel planning by serving as a central hub for road trips. It enables travelers to:
* **Plan Journeys:** Discover accommodations and popular local landmarks step-by-step.
* **Navigate Smarter:** View turn-by-turn routes optimized for 2-wheelers or 4-wheelers.
* **Leverage Conversational AI ("Sakha"):** Converse with a travel co-pilot powered by Gemini AI to plan itineraries, find pit stops, and trigger maps with a single tap.
* **Dynamic Waypoints:** Find restaurants, gas stations, ATMs, and EV chargers, adding them dynamically to active routes.
* **Fleet Logging:** Track and store historical trip details mapped to passenger metrics and vehicle registration numbers.

---

## 2. System Architecture

TripSync uses a decoupled client-server model designed for performance and security.

### High-Level Components
* **Frontend Client:** React SPA bootstrapped with Vite, compiling Tailwind CSS locally for small, tree-shaken assets. Exposes domain-specific contexts to prevent parent re-renders.
* **Backend Server:** Node/Express API server running Mongoose schemas on MongoDB. Protected routes are secured by rate limiters, CORS filters, and authentication checkers.
* **Mappls Map Adapter:** Geocodes addresses, renders custom routing overlays, and calculates real-time ETA metrics.
* **Sakha AI Co-pilot:** Interfaces with the Google Gen AI SDK to process chat conversations and resolve route navigation cards.

---

## 3. Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend Client** | React 19, TypeScript, Vite, Tailwind CSS (v4), React Router Dom (v7) |
| **Backend Server** | Node.js, Express, TypeScript, Helmet, Rate Limiter |
| **Database** | MongoDB, Mongoose ODM |
| **APIs / SDKs** | MapmyIndia Mappls SDK & REST APIs, Google Gen AI SDK (Gemini 2.5 Flash) |

---

## 4. Environment Variables

Create `.env` files in both folders. See `docs/DEVELOPER_GUIDE.md` for detail.

### Server Config (`server/.env`)
```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/tripsync
JWT_SECRET=your_jwt_signing_secret_key
ALLOWED_ORIGINS=http://localhost:5173
```

### Client Config (`client/.env`)
```env
VITE_API_URL=http://localhost:3001/api
VITE_MAPPLS_MAP_SDK_KEY=your_mappls_map_sdk_key
VITE_MAPPLS_REST_API_KEY=your_mappls_rest_api_key
GEMINI_API_KEY=your_gemini_api_key
```

---

## 5. Running the Application Locally

### Running the Server
```bash
cd server
npm install
npm run dev
```

### Running the Client
```bash
cd client
npm install
npm run dev
```
*Open `http://localhost:5173` to launch the application.*

---

## 6. Project Directory Layout

```
Trip_Sync/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/         # Modals, icons, panels
│   │   ├── contexts/           # State providers
│   │   ├── services/           # Maps and AI API wrappers
│   │   └── screens/            # Application Screens
│   └── index.html              # Mount entry
└── server/                     # Node/Express API
    ├── src/
    │   ├── config/             # DB Connection
    │   ├── controllers/        # Request handlers
    │   ├── middleware/         # Security & validation checkers
    │   └── models/             # Schema definitions
```

---

## 7. AI Features (Sakha Co-pilot)
* **AI Chat Assistant:** Powering interactions using Gemini 2.5 Flash.
* **Structured Intent Detection:** Converts verbal requests (e.g., "Take me from Mumbai to Pune") into interactive floating route cards.
* **Voice Search Integrations:** Translates spoken details directly into query fields.

---

## 8. Roadmap & Future Scope
* **PWA Offline Capabilities (v1.2):** Cache styles, icons, and maps data, syncing logs once the network connection is restored.
* **Collaborative Boards (v2.0):** Shared rooms using WebSockets to plan trips and split expenses.
* **Weather Alert Routing (v3.0):** Warn drivers of weather-related highway blocks, suggesting alternative detours.