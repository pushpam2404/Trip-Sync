import { GoogleGenAI } from '@google/genai';

const getApiKey = (): string => {
    // Attempt to read from process.env or import.meta.env
    const key = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
                (import.meta.env?.GEMINI_API_KEY) || 
                '';
    return key;
};

/**
 * Sends a message to the Gemini API with system instructions to behave as the
 * Sakha AI Co-pilot. Generates conversational responses and parses structured route intents.
 */
export async function sendMessageToSakha(
    message: string,
    history: Array<{ role: 'user' | 'model'; text: string }>
) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables.');
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format chat history to match the SDK expectation
    const contents = [
        {
            role: 'user',
            parts: [{ text: `You are Sakha, a helpful, friendly, and expert AI road-trip co-pilot for Indian travelers.
You help plan itineraries, find stays, suggest local food joints, petrol pumps, ATMs, and optimal routes.
Keep your tone warm, enthusiastic, and knowledgeable about Indian roads, traffic, and travel tips.

CRITICAL: If the user explicitly asks to start a trip, plan a route, or navigate between two places, you MUST append a navigation tag at the very end of your response in the exact format: [NAVIGATE: Origin | Destination] where Origin and Destination are the city names or specific places.
Example: [NAVIGATE: Mumbai | Pune]
Do not include additional markdown formatting inside the brackets. Only include one tag per message if a clear route is resolved.` }]
        },
        ...history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        })),
        {
            role: 'user',
            parts: [{ text: message }]
        }
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents,
        });

        const replyText = response.text || 'I could not process that request.';
        
        // Parse navigation tag if present
        let navigationIntent: { origin: string; destination: string } | null = null;
        const navRegex = /\[NAVIGATE:\s*([^|]+)\s*\|\s*([^\]]+)\]/i;
        const match = replyText.match(navRegex);
        
        if (match) {
            navigationIntent = {
                origin: match[1].trim(),
                destination: match[2].trim()
            };
        }

        // Clean up the text of the bracket tag to make it clean for rendering
        const cleanText = replyText.replace(navRegex, '').trim();

        return {
            text: cleanText,
            navigationIntent
        };
    } catch (error: any) {
        console.error('Error contacting Gemini API:', error);
        throw error;
    }
}
