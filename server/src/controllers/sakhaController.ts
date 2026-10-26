import { Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { AuthRequest } from '../types';
import { HttpError } from '../middleware/errorHandler';

const SYSTEM_PROMPT = `You are Sakha, a helpful, friendly road-trip co-pilot for travellers in India.
You help plan itineraries, find stays, suggest local food stops, petrol pumps, ATMs, and good routes.
Keep your tone warm and practical, and use what you know about Indian roads, traffic and travel conditions.

If the user explicitly asks to start a trip, plan a route, or navigate between two places, end your reply with a navigation tag in exactly this format: [NAVIGATE: Origin | Destination]
Origin and Destination are city names or specific places. Example: [NAVIGATE: Mumbai | Pune]
Do not put any other formatting inside the brackets. Use at most one tag per message, and only when both places are clear.`;

const NAV_TAG = /\[NAVIGATE:\s*([^|\]]+)\|\s*([^\]]+)\]/i;

let client: GoogleGenAI | null = null;
const getClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new HttpError(503, 'Sakha is not configured on this server (GEMINI_API_KEY is missing).');
    }
    client ??= new GoogleGenAI({ apiKey });
    return client;
};

// POST /api/sakha
export const chatWithSakha = async (req: AuthRequest, res: Response) => {
    const { message, history = [] } = req.body as {
        message: string;
        history?: Array<{ role: 'user' | 'model'; text: string }>;
    };

    const contents = [
        ...history.slice(-20).map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        { role: 'user', parts: [{ text: message }] },
    ];

    let replyText: string;
    try {
        const response = await getClient().models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
            contents,
            config: { systemInstruction: SYSTEM_PROMPT },
        });
        replyText = response.text || '';
    } catch (error) {
        if (error instanceof HttpError) throw error;
        console.error('Gemini request failed:', error);
        throw new HttpError(502, 'Sakha could not reach the AI service. Try again in a moment.');
    }

    if (!replyText) {
        throw new HttpError(502, 'Sakha did not return a reply. Try rephrasing your message.');
    }

    const match = replyText.match(NAV_TAG);
    res.json({
        text: replyText.replace(NAV_TAG, '').trim(),
        navigationIntent: match ? { origin: match[1].trim(), destination: match[2].trim() } : null,
    });
};
