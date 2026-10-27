import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigation } from '../contexts/NavigationContext';
import { useStartTrip } from '../hooks/useStartTrip';
import { getSakhaStatus, sendMessageToSakha, type SakhaReply } from '../services/aiService';
import { CURRENT_LOCATION, getCurrentAddress } from '../services/location';
import { m, AnimatePresence } from '../components/ui/motion';
import { PlaceInput } from '../components/ui/PlaceInput';
import { RouteLine } from '../components/ui/RouteLine';
import { Notice } from '../components/ui/Notice';
import { SendIcon, SwapIcon, LocateIcon, ArrowRightIcon } from '../components/ui/icons';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  navigationIntent?: SakhaReply['navigationIntent'];
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: 'Namaste, I am Sakha. Ask me about a route, a good place to stop for chai, or what to see on the way. If you tell me where you are headed, I can start the navigation for you.',
};

const SUGGESTIONS = [
  'Weekend trip from Mumbai to Lonavala',
  'Best petrol and food stops from Delhi to Jaipur',
  'Is the Bengaluru to Coorg drive fine with kids?',
];

// The conversation survives moving to another screen and back, but not closing the tab.
const CHAT_KEY = 'tripsync-chat';
const readSavedChat = (): ChatMessage[] => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CHAT_KEY) || 'null');
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch {
    // ignore and start fresh
  }
  return [WELCOME];
};

let messageCounter = 0;
const nextId = () => `m${Date.now()}-${messageCounter++}`;

export default function SakhaScreen() {
  // The tab lives in the URL, so back, forward and shared links land on the right one.
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'route' ? 'route' : 'chat';
  const setTab = (next: 'chat' | 'route') => setParams(next === 'route' ? { tab: 'route' } : {});
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    getSakhaStatus().then((status) => setDemo(!!status?.demo));
  }, []);

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-4 pt-4 sm:px-8 sm:pt-8">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="t-title">Sakha</h1>
        {demo && (
          <span
            className="rounded-full border-[1.5px] border-line-strong px-2.5 py-0.5 text-sm font-semibold text-ink-soft"
            title="No Gemini key is set on the server, so Sakha answers from a small built-in responder."
          >
            Demo mode
          </span>
        )}
      </div>
      <div className="segmented mb-4 shrink-0" role="tablist" aria-label="Sakha modes">
        <button type="button" role="tab" id="tab-chat" aria-selected={tab === 'chat'} aria-controls="panel-chat" onClick={() => setTab('chat')}>
          Ask Sakha
        </button>
        <button type="button" role="tab" id="tab-route" aria-selected={tab === 'route'} aria-controls="panel-route" onClick={() => setTab('route')}>
          Quick route
        </button>
      </div>

      {/* Both stay mounted so switching tabs keeps the conversation and the form. */}
      <div className={tab === 'chat' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
        <Chat onDemo={setDemo} />
      </div>
      <div className={tab === 'route' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
        <QuickRoute />
      </div>
    </div>
  );
}

function Chat({ onDemo }: { onDemo: (demo: boolean) => void }) {
  const startTrip = useStartTrip();
  const [messages, setMessages] = useState<ChatMessage[]>(readSavedChat);
  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_KEY, JSON.stringify(messages));
    } catch {
      // storage unavailable; the chat just won't survive leaving the page
    }
  }, [messages]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [messages, sending]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;

    // Replies that failed are display-only, so they never go back to the model as history.
    const history = messages.filter((msg) => msg.id !== 'welcome' && !msg.isError).map(({ role, text }) => ({ role, text }));
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: message }]);
    setInput('');
    setSending(true);

    try {
      const reply = await sendMessageToSakha(message, history);
      if (reply.demo !== undefined) onDemo(reply.demo);
      setMessages((prev) => [...prev, { id: nextId(), role: 'model', text: reply.text, navigationIntent: reply.navigationIntent }]);
    } catch (error) {
      setMessages((prev) => [...prev, { id: nextId(), role: 'model', text: (error as Error).message, isError: true }]);
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    send(input);
  };

  return (
    <section id="panel-chat" role="tabpanel" aria-labelledby="tab-chat" className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pb-4 pr-1" role="log" aria-live="polite" aria-label="Conversation with Sakha">
        <ul className="space-y-5">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <m.li
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                className={msg.role === 'user' ? 'flex justify-end' : ''}
              >
                {msg.role === 'user' ? (
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-bg">{msg.text}</p>
                ) : msg.isError ? (
                  <Notice>{msg.text}</Notice>
                ) : (
                  <div className="max-w-[92%] border-l-4 border-accent pl-4">
                    <p className="mb-0.5 text-sm font-semibold text-ink-muted">Sakha</p>
                    <div className="space-y-2">
                      {msg.text.split(/\n{2,}/).map((para, i) => (
                        <p key={i} className="whitespace-pre-wrap">{para}</p>
                      ))}
                    </div>
                    {msg.navigationIntent && (
                      <div className="mt-4 rounded-[var(--radius-control)] border border-line-strong bg-surface p-4">
                        <RouteLine from={msg.navigationIntent.origin} to={msg.navigationIntent.destination} />
                        <button
                          type="button"
                          className="btn btn-outline btn-sm mt-4"
                          onClick={() => startTrip(msg.navigationIntent!.origin, msg.navigationIntent!.destination)}
                        >
                          Start navigation
                          <ArrowRightIcon className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </m.li>
            ))}
          </AnimatePresence>
          {sending && (
            <li className="flex items-center gap-2 border-l-4 border-accent pl-4 text-ink-muted" aria-label="Sakha is typing">
              <span className="flex gap-1" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <m.span
                    key={i}
                    className="size-2 rounded-full bg-ink-muted"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
                  />
                ))}
              </span>
              Sakha is replying
            </li>
          )}
        </ul>

        {messages.length === 1 && (
          <div className="mt-6">
            <p className="t-meta mb-2">Try asking</p>
            <ul className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button type="button" className="btn btn-outline btn-sm text-left whitespace-normal" onClick={() => send(s)}>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="flex shrink-0 items-end gap-2 pb-4 pt-2">
        <label htmlFor="sakha-input" className="sr-only">Message Sakha</label>
        <input
          id="sakha-input"
          className="input flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message Sakha"
          maxLength={2000}
          autoComplete="off"
          enterKeyHint="send"
        />
        <button type="submit" className="btn btn-primary size-[2.875rem] p-0!" disabled={!input.trim() || sending} aria-label="Send message">
          <SendIcon className="size-5" aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

function QuickRoute() {
  const { origin, destination, setOrigin, setDestination } = useNavigation();
  const startTrip = useStartTrip();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMyLocation = () => setOrigin(CURRENT_LOCATION);

  const go = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    let from = origin.trim();
    let to = destination.trim();
    if (!from || !to) {
      setError('Enter both a starting point and a destination.');
      return;
    }
    setBusy(true);
    try {
      if (from === CURRENT_LOCATION) from = await getCurrentAddress();
      if (to === CURRENT_LOCATION) to = await getCurrentAddress();
      startTrip(from, to);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="panel-route" role="tabpanel" aria-labelledby="tab-route" className="min-h-0 flex-1 overflow-y-auto pb-6">
      <form onSubmit={go} className="space-y-4" noValidate>
        {error && <Notice>{error}</Notice>}
        <div>
          <PlaceInput
            label="From"
            value={origin}
            onChange={setOrigin}
            placeholder="Starting point"
            suppressFor={CURRENT_LOCATION}
          />
          <button type="button" className="btn btn-quiet btn-sm mt-1 -ml-2" onClick={useMyLocation}>
            <LocateIcon className="size-4" aria-hidden="true" />
            Use my location
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              setOrigin(destination);
              setDestination(origin);
            }}
          >
            <SwapIcon className="size-4" aria-hidden="true" />
            Swap
          </button>
        </div>

        <PlaceInput label="To" value={destination} onChange={setDestination} placeholder="Where to?" />

        <button type="submit" className="btn btn-primary btn-block" disabled={!destination.trim() || busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? 'Finding your location' : 'Choose how to travel'}
        </button>
      </form>
    </section>
  );
}
