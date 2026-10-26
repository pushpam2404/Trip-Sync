# Product notes

TripSync is for people who plan road trips in India and are tired of juggling a maps app, a notes app and a hotel site. It keeps the route, the stay, the stops and the vehicle details in one place, and has a chat assistant for the questions that do not fit a form.

## What each screen does

### Sign up

Phone number and password, then a name, how many bikes and cars you own, and their registration numbers. Vehicles are optional and can be edited later.

### Home

A "Where to?" shortcut, links to the four main screens with real counts, the last trip with a button to drive it again, and the registration plates of your vehicles.

### Sakha

Two modes.
- *Ask Sakha* is a chat with Gemini. If you say where you are going, the reply carries a card that starts navigation for that route.
- *Quick route* is two place fields with suggestions and voice input, a swap button, and "use my location".

### Planner

Three steps: destination, stay, places. For the stay you either type one you have booked or choose from hotels near the destination. The last step lists places to visit near the stay, and each one you add becomes a saved route that starts at the stay.

### Saved

Saved routes with Navigate, Reverse and Delete.

### History

Trips logged when you end a trip on the map screen: route, vehicle, travellers, stops and the route estimate. You can drive any of them again or clear the list.

### Navigation

The map with the route drawn on it, the next instruction at the top, arrival time, distance and drive time at the bottom. You can add stops (petrol, food, ATM, EV charging, or any searched place) and remove them again.

### Account

Name, theme, and the vehicle list.

## Choices worth knowing about

- The phone number is the login. There is no OTP check, so anyone who knows a number can try to claim it. Verification would need an SMS provider, which is outside the free tier.
- Walking and train modes use the same driving route API, so their estimates are for a car. They exist so a trip can be logged with the right mode.
- History stores the route estimate from when you finished, not a measured trip.
- Place data comes from Mappls. When Mappls has no rating for a place, none is shown.

## Roadmap

Roughly in the order I would do them.

1. Tests for the client screens and a run against the live Mappls API to confirm turn progress on a real drive.
2. Offline support: cache the last route and history so the app opens without a connection.
3. Walking and transit routing through a provider that supports them.
4. Shared trips, so friends can add stops to the same plan.
5. A split-the-costs sheet for fuel, tolls and stays.
