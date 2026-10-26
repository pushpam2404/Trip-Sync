/**
 * Rule-based stand-in for Sakha, used when the server has no GEMINI_API_KEY.
 * It is deterministic and only knows a handful of request shapes, so replies
 * are labelled as demo output in the UI. The return shape matches the real path.
 */
export interface SakhaReply {
    text: string;
    navigationIntent: { origin: string; destination: string } | null;
}

const titleCase = (value: string) =>
    value
        .trim()
        .replace(/[.,!?]+$/g, '')
        .replace(/\s+/g, ' ')
        .split(' ')
        .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
        .join(' ');

// "from Pune to Goa", "take me from Pune to Goa", "Pune to Goa", "route Pune -> Goa"
const ROUTE_PATTERNS: RegExp[] = [
    /\bfrom\s+(.+?)\s+(?:to|towards?|->)\s+(.+)$/i,
    /^(?:plan|navigate|drive|route|trip|go|take me)?\s*(?:a\s+)?(?:trip\s+|route\s+|drive\s+)?(.+?)\s+(?:to|->)\s+(.+)$/i,
];

const VERBS = /^(take me|take|me|navigate|drive|go|route|trip|plan|directions?)$/i;
const TRAILING_NOISE = /\s+(?:this|next|on|by|for|with|please|tomorrow|today|tonight|weekend|via|using)\b.*$/i;

export const extractRoute = (message: string): { origin: string; destination: string } | null => {
    for (const pattern of ROUTE_PATTERNS) {
        const match = message.trim().match(pattern);
        if (!match) continue;
        const origin = titleCase(match[1].replace(/^(?:me|a|the)\s+/i, ''));
        const destination = titleCase(match[2].replace(TRAILING_NOISE, ''));
        if (VERBS.test(origin)) continue;
        if (origin && destination && origin.length <= 60 && destination.length <= 60) {
            return { origin, destination };
        }
    }
    return null;
};

const TOPICS: { test: RegExp; text: string }[] = [
    {
        test: /\b(petrol|fuel|diesel|gas station|pump)s?\b/i,
        text: 'I cannot search live petrol pump listings in demo mode. Once you are navigating, tap Add stop, choose Petrol, and TripSync lists the nearest pumps with distances. On long highways, fill up when the tank is at half, not at the last quarter, because pumps thin out on ghat sections.',
    },
    {
        test: /\b(food|restaurant|eat|dhaba|chai|breakfast|lunch|dinner|cafe)s?\b/i,
        text: 'I cannot look up live restaurant listings in demo mode. While navigating, tap Add stop and choose Food to see places near you, nearest first. A good habit on Indian highways is to stop where trucks are parked, since those dhabas turn over food quickly.',
    },
    {
        test: /\b(atm|cash|bank)s?\b/i,
        text: 'ATM search needs live data, which demo mode does not have. During navigation, Add stop then ATM lists the closest ones. Carry some cash for tolls and small towns, and top up before entering hill sections.',
    },
    {
        test: /\b(ev|charging|charger|electric)\b/i,
        text: 'I cannot see live charger availability in demo mode. During navigation, Add stop then EV charging shows chargers nearby. Plan to charge before your battery drops under 20 percent and check the station is open before you detour.',
    },
    {
        test: /\b(weather|rain|monsoon|forecast|temperature|fog)\b/i,
        text: 'Demo mode has no weather feed. Check the IMD forecast or your phone weather app before you leave. In the monsoon, leave early and keep extra time for ghat roads, and in winter expect fog on the north Indian plains before 9 am.',
    },
    {
        test: /\b(toll|fastag)\b/i,
        text: 'I cannot calculate tolls in demo mode. Keep your FASTag balance topped up, and note that toll plazas on expressways can differ from the old highway the map may suggest.',
    },
    {
        test: /\b(hotel|stay|resort|homestay|lodge)s?\b/i,
        text: 'For stays, open the Planner: enter a destination, then pick from hotels near it, or type one you have already booked. Places you add afterwards become saved routes from that stay.',
    },
];

const GREETING = /^(hi|hello|hey|namaste|namaskar|good (morning|afternoon|evening))\b/i;

export const demoReply = (rawMessage: string): SakhaReply => {
    const message = rawMessage.trim();

    const route = extractRoute(message);
    if (route) {
        return {
            text: `Here is a route from ${route.origin} to ${route.destination}. I am running in demo mode, so I cannot give distance, time or stops from live data. Tap Start navigation and TripSync will work them out from the map.`,
            navigationIntent: route,
        };
    }

    const topic = TOPICS.find((t) => t.test.test(message));
    if (topic) return { text: topic.text, navigationIntent: null };

    if (/\b(take me|navigate|directions?|route)\b/i.test(message)) {
        return {
            text: 'Where are you starting from and where do you want to go? Say it like "take me from Pune to Mahabaleshwar" and I will set up the route.',
            navigationIntent: null,
        };
    }

    if (GREETING.test(message)) {
        return {
            text: 'Namaste. I am the demo version of Sakha. Try "take me from Mumbai to Lonavala", ask about petrol, food, ATMs, EV charging, stays or weather, and I will point you to the right part of the app.',
            navigationIntent: null,
        };
    }

    return {
        text: 'I am in demo mode, so I only understand a few kinds of request. Try "take me from Pune to Goa", or ask about petrol pumps, food stops, ATMs, EV charging, stays, tolls or weather.',
        navigationIntent: null,
    };
};
