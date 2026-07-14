# TripSync Product Guide

This document provides a comprehensive overview of the TripSync product vision, features, target audience, personas, user journeys, and future roadmap.

---

## 1. Product Overview

### Vision
TripSync is designed to be the ultimate smart travel companion for Indian road travelers. By combining real-time navigation, custom transit profiles, and AI-enabled trip assistance, TripSync simplifies the complex logistics of planning, executing, and reviewing road trips. The application transforms travel from a fragmented task of switching between maps, planners, and notes, into a unified, delightful digital experience.

### Purpose
Modern road travel, particularly in regions with complex highway systems and varied transit options like India, requires careful planning around vehicle types (2-wheelers vs 4-wheelers), passenger count, stay options, and pit stops. TripSync serves as the centralized platform that:
- Seamlessly resolves optimal turn-by-turn routes based on specific vehicle configurations.
- Recommends hotels, stays, and scenic attractions around any destination.
- Leverages conversational AI ("Sakha") to act as a co-pilot that answers queries and executes route changes.
- Records and standardizes completed trips into a historical log for future reference and re-navigation.

### Target Audience
- **Weekend Explorers:** Urban professionals planning quick getaways (e.g., Mumbai to Lonavala, Delhi to Agra) looking for stay and attraction recommendations.
- **Road Trip Enthusiasts:** Travelers planning long-distance journeys who need to manage multi-stop waypoints (petrol pumps, food spots, ATMs).
- **Daily Commuters:** Users managing personal vehicle fleets who want to log mileage, duration, and route preferences.
- **Group Travelers:** Families or friends traveling together who need to track passenger metrics and transport modes.

---

## 2. Core Features

### 🚗 Sakha AI Co-pilot
- **Quick Navigation:** Bound input fields for origin and destination with geocoding, voice search, and route reversing.
- **AI Chat Assistant:** A conversational interface powered by Google Gemini (Gemini 2.5 Flash) that offers travel suggestions, local food ideas, and dynamically parses navigation intent.
- **One-Click Navigation Activation:** Inline action cards generated from AI chat to trigger real-time navigation immediately.

### 🗺️ Live Navigation Screen
- **Google Maps Integration:** Frosted glass overlay controllers rendering the path, custom markers, and real-time user positioning.
- **Dynamic Stops (Waypoints):** Live nearby search wrapper finding restaurants, gas stations, ATMs, and EV chargers, adding them dynamically to the active route.
- **Auto-Centering & Recenter controls:** Maintains map lock relative to user coordinates, allowing manual drag overrides.

### 📅 Trip Planner
- **Step-by-Step Wizard:** Step indicators guiding the user from destination selection to stays and popular local landmarks.
- **Stays and Landmark Recommendations:** Real-time query matching to discover hotels or suggest attractions based on coordinates, saving them directly as saved destinations.

### 📍 Saved Places
- **Interactive Routes List:** Quick reference of saved routes displaying origin, destination, stay, travel time, and reverse buttons.

### 🕒 Trip History
- **Historical Trip Logs:** Completed trip logs showing duration, distance, transit mode (4W, 2W, train, walking), passenger count, and vehicle registration numbers.

---

## 3. User Personas

### Persona 1: Amit Patel — The Weekend getaway Planner
* **Profile:** 28, Software Engineer in Pune. Owns a Hyundai i20 (4W). Travels twice a month.
* **Goals:** Quickly find stays and local attractions, bundle them into routes, and navigate with pre-calculated stops.
* **Pain Points:** Jumping between booking and map apps; hard to calculate total travel times with multiple stops.

### Persona 2: Priya Sharma — The Adventurous Solo Biker
* **Profile:** 24, Content Creator in Mumbai. Owns a Royal Enfield Himalayan (2W). Rides on long weekends.
* **Goals:** Plan motorcycle-friendly routes, use voice controls on the road, and find dhabas/fuel stations via AI.
* **Pain Points:** Maps recommending prohibited highways; typing while riding is dangerous.

### Persona 3: Vikram & Ritu — The Family Road-Trippers
* **Profile:** 42 & 38, Delhi, Mahindra XUV700. Travel with elderly parents and children.
* **Goals:** Plan passenger-specific stops (restrooms, EV chargers) and easily reverse routes for return trips.
* **Pain Points:** Distracted driving while altering routes; re-keying long return routes manually.

---

## 4. Complete User Journeys

### 1. Authentication & Onboarding
* Launch App -> AuthContext checks localStorage token -> Re-routes to login if invalid.
* New users sign up and are guided through a 2-step setup: name and vehicle fleet details (number of 2W/4W and registration plates) to establish their default driving profile.

### 2. Trip Planning & Discovery
* Open Planner -> Enter Destination (with autocomplete prediction).
* Stays discovery queries Google Places API within 5km of destination. Select stay.
* Query landmarks near chosen stay. Tap "Plus" on attractions to save route links.

### 3. Sakha AI Co-pilot Chat
* Open Sakha -> Toggle to AI Chat.
* User types: "Suggest a route Mumbai to Goa with clean food stops."
* Gemini 2.5 Flash processes query, appends `[NAVIGATE: Mumbai | Goa]` at the end of response text.
* UI captures intent tag, hides it, and renders a floating button card: **Start Navigation: Mumbai to Goa**.
* Tap card -> Confirms mode, vehicle choice, passenger count, and triggers maps.

---

## 5. Future Roadmap

### Version 1.1: Security & Onboarding Polish (Short-Term)
* Add verification checks on registration input forms to prevent incorrect formatting.
* Improve screen transition speeds and trap keyboard focus inside dropdown menus/modals.

### Version 1.2: Offline Navigation & PWA (Medium-Term)
* Enable PWA service worker caching for offline asset loading.
* Use IndexedDB to save trip logs offline, syncing automatically when connectivity recovers.
* Cache routing coordinates to render static fallback guides when offline.

### Version 2.0: Collaborative Trip Planning (Long-Term)
* Integrate WebSockets to let friends join planning rooms and add waypoints together.
* Shared expense ledger to divide tolls, fuel, and hotel bills per passenger.
* Export itineraries as PDFs or shareable web links.
