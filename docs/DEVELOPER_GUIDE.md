# TripSync Developer & Environment Setup Guide

This document is a comprehensive guide to onboarding developers, configuring environment variables, running the codebase locally, and extending its features.

---

## 1. Directory Structure

Ensure files are placed in their appropriate directories:

```
Trip_Sync/
├── client/                     # React Frontend Application
│   ├── src/
│   │   ├── components/         # Modals, icons, overlays
│   │   ├── contexts/           # Subcontexts (Auth, Trip, Nav, UI)
│   │   ├── services/           # API handlers (Axios, Maps, Gemini)
│   │   └── screens/            # Application Screen Views
├── server/                     # Express Backend Application
│   ├── src/
│   │   ├── config/             # DB connection configuration
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Validation and security middleware
│   │   └── models/             # Mongoose Schemas
```

---

## 2. Environment Variables

Create `.env` configuration files inside their respective folders.

### Client Variables (`client/.env`)
* **`VITE_API_URL`:** Backend API base URL (Default: `http://localhost:3001/api`).
* **`VITE_GOOGLE_MAPS_API_KEY` (Required):** API key with Maps JS, Places, and Directions APIs active.
* **`GEMINI_API_KEY` (Required):** API key generated via Google AI Studio for conversational chatbot features.

### Server Variables (`server/.env`)
* **`PORT`:** Listener port (Default: `3001`).
* **`MONGO_URI` (Required):** MongoDB Atlas server connection string or local MongoDB instance path.
* **`JWT_SECRET` (Required):** Security string to sign JSON Web Tokens.
* **`ALLOWED_ORIGINS`:** White-list client URLs permitted to access API routes (CORS).

---

## 3. Getting Started Locally

### 1. Prerequisites
Install **Node.js** (v18+) and **npm**. Make sure **MongoDB** is running locally on port `27017` or use a MongoDB Atlas cluster.

### 2. Running Backend Server
```bash
cd server
npm install
npm run dev
```
*The server boots on `http://localhost:3001`.*

### 3. Running Frontend Client
```bash
cd client
npm install
npm run dev
```
*The client boots on `http://localhost:5173`.*

---

## 4. Coding Conventions & Extending Features

### Naming Schemes
* **UI Components:** PascalCase with matching filename (e.g., `InstructionPanel.tsx`).
* **React Hooks:** camelCase prefixed with `use` (e.g., `useAuth.tsx`).
* **DB REST Routes:** pluralized kebab-case nouns (e.g., `/api/saved-routes`).

### How to Add a New Page / Route
1. Create your visual page inside `client/src/screens/YourScreen.tsx`.
2. Register the path route inside `client/App.tsx`:
   ```typescript
   <Route path="/your-path" element={
       <ProtectedRoute>
           <YourScreen />
       </ProtectedRoute>
   } />
   ```
3. Use the standard `useNavigate` hook from `react-router-dom` to transition paths:
   ```typescript
   const navigate = useNavigate();
   navigate('/your-path');
   ```

### Adding Server Validation to Endpoints
Input payloads should always be validated. Inject schemas into routes prior to controller mounting:
```typescript
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validationMiddleware';

router.post('/route', [
    body('param').trim().notEmpty().withMessage('Param is required'),
    validateRequest
], controllerAction);
```
