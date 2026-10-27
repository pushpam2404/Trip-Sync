import api, { errorMessage } from './api';

export interface SakhaReply {
  text: string;
  navigationIntent: { origin: string; destination: string } | null;
  /** True when the server answered from its built-in demo responder (no Gemini key). */
  demo?: boolean;
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

/** Asks the server whether Sakha is running in demo mode, so the badge can show before the first message. */
export async function getSakhaStatus(): Promise<{ demo: boolean } | null> {
  try {
    const { data } = await api.get<{ demo: boolean }>('/sakha');
    return data;
  } catch {
    return null;
  }
}
