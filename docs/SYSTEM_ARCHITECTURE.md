# TripSync System Architecture Guide

This document describes the high-level and low-level system design, frontend state layout, backend controllers, database schema, API reference endpoints, and sequence diagrams of TripSync.

---

## 1. High-Level Design (HLD)

TripSync operates on a decoupled client-server architecture.

```
┌────────────────────────────────────────────────────────┐
│                      CLIENT TIER                       │
│  - React 19 SPA (Vite compiled static assets)          │
│  - Tailwind CSS v4 local PostCSS compilation           │
│  - Mappls Web Map JS SDK Loader                        │
│  - Google Gen AI client chat SDK                       │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / JSON Envelopes
                            ▼
┌────────────────────────────────────────────────────────┐
│                    APPLICATION TIER                    │
│  - Node/Express REST API Server                        │
│  - Security: Helmet, Rate limiters, CORS filters       │
│  - Validation: express-validator input verification    │
└───────────────────────────┬────────────────────────────┘
                            │ Mongoose ODM
                            ▼
┌────────────────────────────────────────────────────────┐
│                     DATABASE TIER                      │
│  - MongoDB Instance (user accounts, saved routes,      │
│    and trip history logs)                              │
└────────────────────────────────────────────────────────┘
```

---

## 2. Frontend State & Navigation Architecture

To prevent cascading parent re-renders, the React global state is split into domain-specific contexts. Backwards compatibility is preserved using an aggregator pattern in `AppContext.tsx`.

```mermaid
graph TD
    subgraph Context Provider Layer
        A[AppProvider] --> B[AuthProvider]
        A --> C[TripProvider]
        A --> D[NavigationProvider]
        A --> E[UIProvider]
    end

    subgraph Screen / View Layer
        B --> F[HomeScreen / AccountScreen]
        C --> G[PlannerScreen / HistoryScreen]
        D --> H[NavigationScreen / SakhaScreen]
        E --> I[MainScreen / Modals / Theme Toggle]
    end
```

### Context Breakdown
* **`AuthProvider`:** Session states (`user`, `isLoading`), register/login API calls, profile onboarding flow, and user vehicle fleet settings.
* **`TripProvider`:** Synchronizes saved routes and completed trip histories with API databases.
* **`NavigationProvider`:** Manages turn-by-turn states, waypoint stops, starting/ending coordinate selections.
* **`UIProvider`:** Controls global theme settings, tab selections, and modal states.
* **Geocoding & Routing Engine:** Acts as an adapter communicating directly with Mappls REST API endpoints (Suggest, Geocode, Advanced Route, Nearby search).

---

## 3. Database Schema & Models

TripSync utilizes Mongoose schemas mapping structure to MongoDB documents.

```mermaid
erDiagram
    User {
        ObjectId _id PK
        String name
        String phone UK
        String password
        Vehicle[] twoWheelers
        Vehicle[] fourWheelers
        Date createdAt
    }

    Trip {
        ObjectId _id PK
        ObjectId userId FK
        String origin
        String destination
        Date startDate
        String startTime
        String vehicle
        Number travelers
        String status
        Stop[] stops
    }

    SavedRoute {
        ObjectId _id PK
        ObjectId userId FK
        String origin
        String destination
        String stay
    }

    User ||--o{ Trip : creates
    User ||--o{ SavedRoute : saves
```

* **Indexing:** 
  * `User.phone` (Unique index): Speeds up login checks.
  * `Trip.userId` (Index): Speeds up fetching trip history.
  * `SavedRoute.userId` (Index): Speeds up retrieving saved places.
* **Mongoose Hooks:** `User` schema encrypts passwords using a pre-save hook using `bcryptjs` with 10 salt rounds.

---

## 4. API Reference Endpoints

API routes are prefixed with `/api`. All JSON responses follow consistent payload envelopes.

### Authentication Endpoints

* **POST `/api/auth/signup`:** Registers new user.
  * *Request Body:* `{ name, phone, password, twoWheelers: [], fourWheelers: [] }`
  * *Response (201 Created):* `{ _id, name, phone, twoWheelers, fourWheelers, token }`
* **POST `/api/auth/login`:** Validates user credentials.
  * *Request Body:* `{ phone, password }`
  * *Response (200 OK):* `{ _id, name, phone, token }`

### Trip Logs Endpoints (Protected - JWT Required)

* **POST `/api/trips`:** Saves a trip log.
  * *Request Body:* `{ origin, destination, startDate, startTime, vehicle, travelers, stops: [] }`
  * *Response (210 Created):* Saved Trip Document object.
* **GET `/api/trips`:** Retrieves current user's history logs.
* **DELETE `/api/trips/:id`:** Removes a specific trip log.

### Saved Routes Endpoints (Protected - JWT Required)

* **POST `/api/saved-routes`:** Saves a planned route.
  * *Request Body:* `{ origin, destination, stay }`
* **GET `/api/saved-routes`:** Retrieves saved routes.
* **DELETE `/api/saved-routes/:id`:** Removes a saved route.

---

## 5. Sequence Diagrams

### Sakha AI Co-pilot Chat Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as React Client (SakhaScreen)
    participant AISvc as aiService (Gemini Wrapper)
    participant SDK as Google Gen AI SDK
    participant API as Gemini API Server

    User->>FE: Input text prompt ("Navigate Mumbai to Pune")
    FE->>FE: Display message bubble in Chat
    FE->>AISvc: sendMessageToSakha(message, chatHistory)
    AISvc->>SDK: Generate content request
    SDK->>API: Generate request (gemini-2.5-flash)
    API-->>SDK: Return generated response text
    SDK-->>AISvc: Return text with intent tag [NAVIGATE: Mumbai | Pune]
    AISvc->>AISvc: Parse navigation tag, extract origin & destination
    AISvc-->>FE: Return clean text + navigationIntent object
    FE->>FE: Update message history state
    FE-->>User: Render Sakha chat bubble & Floating Navigation Trigger Card
```

### Live Map Waypoint Addition Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as React Client (NavigationScreen)
    participant GPS as Geolocation API
    participant MapSvc as mapService
    participant MapSDK as Mappls Map JS SDK
    
    User->>FE: Click "Add Stop" -> Select "Gas Station"
    FE->>GPS: Request getCurrentPosition()
    GPS-->>FE: Return user latitude and longitude
    FE->>MapSvc: searchNearbyPlaces("gas station", userCoords)
    MapSvc-->>FE: Return gas stations array
    FE-->>User: Render Stops List Modal
    
    User->>FE: Select Gas Station
    FE->>FE: Append waypoint to route stops list
    FE->>MapSvc: getDirections(origin, destination, waypoints)
    MapSvc-->>FE: Return updated directions result
    FE->>MapSDK: Update directions overlay polyline
    MapSDK-->>User: Render updated route path on screen
```
