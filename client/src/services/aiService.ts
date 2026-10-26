import api, { errorMessage } from './api';

export interface SakhaReply {
  text: string;
  navigationIntent: { origin: string; destination: string } | null;
}

export type SakhaTurn = { role: 'user' | 'model'; text: string };

/** Sends a chat turn to the TripSync API, which holds the Gemini key. */
export async function sendMessageToSakha(message: string, history: SakhaTurn[]): Promise<SakhaReply> {
  try {
    const { data } = await api.post<SakhaReply>('/sakha', { message, history });
    return data;
  } catch (error) {
    throw new Error(errorMessage(error, 'Sakha could not answer right now.'));
  }
}
