import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "../contexts/AppContext";
import {
  MicrophoneIcon,
  ReverseIcon,
  PaperPlaneIcon,
  ArrowRightIcon,
} from "../constants";
import {
  GeolocationPermissionError,
  MicrophonePermissionError,
} from "../components/common/PermissionErrors";
import {
  getAutocompletePredictions,
  reverseGeocode,
} from "../services/mapService";
import { useSpeechToText } from "../hooks/useSpeechToText";
import {
  PredictionsList,
  PlacePrediction,
} from "../components/map/PredictionsList";
import { TabScreenHeader } from "../components/common/TabScreenHeader";
import { sendMessageToSakha } from "../services/aiService";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  navigationIntent?: { origin: string; destination: string } | null;
}

export const SakhaScreen = () => {
  const {
    navigationOrigin,
    navigationDestination,
    setNavigationOrigin,
    setNavigationDestination,
    setActiveModal,
    startNavigationFrom,
  } = useAppContext();

  // Mode Toggle: 'quick' | 'assistant'
  const [activeMode, setActiveMode] = useState<"quick" | "assistant">(
    "assistant",
  );

  // Quick Navigate State
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [originPredictions, setOriginPredictions] = useState<PlacePrediction[]>(
    [],
  );
  const [destinationPredictions, setDestinationPredictions] = useState<
    PlacePrediction[]
  >([]);
  const [activeInput, setActiveInput] = useState<
    "origin" | "destination" | null
  >(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const originSpeech = useSpeechToText((text) => setNavigationOrigin(text));
  const destinationSpeech = useSpeechToText((text) =>
    setNavigationDestination(text),
  );
  const micPermissionError = originSpeech.error || destinationSpeech.error;

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: "Namaste! I'm Sakha, your AI road-trip co-pilot. 🚗✨\n\nAsk me anything about route planning, local food recommendations, scenic pit stops, or just describe where you want to go (e.g., 'Plan a weekend trip from Mumbai to Lonavala').",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Predictions loaders
  useEffect(() => {
    const fetchPredictions = async () => {
      if (
        activeInput === "origin" &&
        navigationOrigin &&
        navigationOrigin.length > 2 &&
        navigationOrigin !== "Current Location"
      ) {
        const results = await getAutocompletePredictions(navigationOrigin);
        setOriginPredictions(results);
      } else {
        setOriginPredictions([]);
      }
    };
    const timer = setTimeout(fetchPredictions, 300);
    return () => clearTimeout(timer);
  }, [navigationOrigin, activeInput]);

  useEffect(() => {
    const fetchPredictions = async () => {
      if (
        activeInput === "destination" &&
        navigationDestination &&
        navigationDestination.length > 2
      ) {
        const results = await getAutocompletePredictions(navigationDestination);
        setDestinationPredictions(results);
      } else {
        setDestinationPredictions([]);
      }
    };
    const timer = setTimeout(fetchPredictions, 300);
    return () => clearTimeout(timer);
  }, [navigationDestination, activeInput]);

  const handleSelectPrediction = (
    field: "origin" | "destination",
    prediction: PlacePrediction,
  ) => {
    if (field === "origin") {
      setNavigationOrigin(prediction.description);
    } else {
      setNavigationDestination(prediction.description);
    }
    setActiveInput(null);
  };

  const handleStartTrip = async () => {
    if (permissionError) setPermissionError(null);

    if (!navigationDestination) {
      alert("Please enter a destination.");
      return;
    }
    if (!navigationOrigin) {
      alert("Please enter an origin.");
      return;
    }

    const resolveCurrentLocation = async (field: "origin" | "destination") => {
      setIsLoadingLocation(true);
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
            });
          },
        );

        const formattedAddress = await reverseGeocode(
          position.coords.latitude,
          position.coords.longitude,
        );
        if (formattedAddress && formattedAddress !== "Unknown Location") {
          if (field === "origin") setNavigationOrigin(formattedAddress);
          else setNavigationDestination(formattedAddress);
          return formattedAddress;
        } else {
          throw new Error("No address resolved.");
        }
      } catch (error: any) {
        setPermissionError(
          "Could not resolve location. Please configure settings or search manually.",
        );
        if (field === "origin") setNavigationOrigin("");
        else setNavigationDestination("");
        return null;
      } finally {
        setIsLoadingLocation(false);
      }
    };

    if (navigationOrigin === "Current Location") {
      const resolvedOrigin = await resolveCurrentLocation("origin");
      if (!resolvedOrigin) return;
    }

    if (navigationDestination === "Current Location") {
      const resolvedDestination = await resolveCurrentLocation("destination");
      if (!resolvedDestination) return;
    }

    setActiveModal("travelMode");
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isSendingMessage) return;

    const userMessageText = chatInput;
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      text: userMessageText,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsSendingMessage(true);

    try {
      const history = chatMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, text: m.text }));

      const response = await sendMessageToSakha(userMessageText, history);

      const replyMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: "model",
        text: response.text,
        navigationIntent: response.navigationIntent,
      };

      setChatMessages((prev) => [...prev, replyMsg]);
    } catch (error: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: "model",
          text: `Sorry, I'm having trouble connecting right now: ${error.message || error}`,
        },
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <>
      <TabScreenHeader title="Sakha Assistant" />
      <div className="p-6 text-text flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] max-w-sm md:max-w-4xl w-full mx-auto space-y-5 animate-fade-in">
        {/* Immersive Subheading Mode Switcher */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg relative z-10 flex-shrink-0">
          <button
            onClick={() => setActiveMode("quick")}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${activeMode === "quick" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-200"}`}
          >
            Quick Navigate
          </button>
          <button
            onClick={() => setActiveMode("assistant")}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${activeMode === "assistant" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-200"}`}
          >
            AI Chat Assistant
          </button>
        </div>

        {/* Quick Navigate View */}
        {activeMode === "quick" ? (
          <div className="flex-grow flex flex-col justify-between space-y-4 overflow-y-auto no-scrollbar">
            <div className="card bg-slate-900 border border-slate-800 p-5 space-y-5 relative shadow-sm">
              <div className="relative">
                <label
                  htmlFor="origin-input"
                  className="block text-[11px] font-bold text-slate-450 uppercase tracking-wider mb-2"
                >
                  Starting Point
                </label>
                <div className="relative">
                  <input
                    id="origin-input"
                    type="text"
                    value={navigationOrigin || ""}
                    onFocus={() => {
                      if (navigationOrigin === "Current Location")
                        setNavigationOrigin("");
                      setActiveInput("origin");
                    }}
                    onBlur={() => setTimeout(() => setActiveInput(null), 250)}
                    onChange={(e) => setNavigationOrigin(e.target.value)}
                    placeholder="Enter starting location or 'Current Location'"
                    className="input pr-10"
                    autoComplete="off"
                  />
                  <button
                    onClick={originSpeech.startListening}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all cursor-pointer ${originSpeech.isListening ? "bg-rose-500/10 text-rose-500 animate-pulse" : "text-slate-500 hover:text-slate-300"}`}
                    aria-label="Search by voice for origin"
                  >
                    <MicrophoneIcon className="w-4 h-4" />
                  </button>
                </div>
                {activeInput === "origin" && originPredictions.length > 0 && (
                  <PredictionsList
                    predictions={originPredictions}
                    onSelect={(p) => handleSelectPrediction("origin", p)}
                  />
                )}
              </div>

              <div className="flex justify-center -my-3 relative z-10">
                <button
                  onClick={() => {
                    const temp = navigationOrigin;
                    setNavigationOrigin(navigationDestination);
                    setNavigationDestination(temp);
                  }}
                  className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white active:scale-95 transition-all cursor-pointer shadow-sm"
                  aria-label="Reverse direction"
                >
                  <ReverseIcon className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label
                  htmlFor="destination-input"
                  className="block text-[11px] font-bold text-slate-450 uppercase tracking-wider mb-2"
                >
                  Final Destination
                </label>
                <div className="relative">
                  <input
                    id="destination-input"
                    type="text"
                    value={navigationDestination || ""}
                    onFocus={() => setActiveInput("destination")}
                    onBlur={() => setTimeout(() => setActiveInput(null), 250)}
                    onChange={(e) => setNavigationDestination(e.target.value)}
                    placeholder="Where to?"
                    className="input pr-10"
                    autoComplete="off"
                  />
                  <button
                    onClick={destinationSpeech.startListening}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all cursor-pointer ${destinationSpeech.isListening ? "bg-rose-500/10 text-rose-500 animate-pulse" : "text-slate-500 hover:text-slate-300"}`}
                    aria-label="Search by voice for destination"
                  >
                    <MicrophoneIcon className="w-4 h-4" />
                  </button>
                </div>
                {activeInput === "destination" &&
                  destinationPredictions.length > 0 && (
                    <PredictionsList
                      predictions={destinationPredictions}
                      onSelect={(p) => handleSelectPrediction("destination", p)}
                    />
                  )}
              </div>
            </div>

            <button
              onClick={handleStartTrip}
              disabled={!navigationDestination || isLoadingLocation}
              className="btn btn-primary btn-full py-3.5 text-xs font-bold tracking-wider uppercase flex-shrink-0 cursor-pointer"
            >
              {isLoadingLocation ? "Resolving location..." : "Start Navigation"}
            </button>
          </div>
        ) : (
          /* AI Assistant Chat View */
          <div className="flex-grow flex flex-col justify-between overflow-hidden relative">
            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto space-y-4 pr-1 pb-4 scrollbar-thin">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} space-y-1.5`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-lg text-xs leading-relaxed ${msg.role === "user" ? "bg-slate-800 border border-slate-700 text-white rounded-tr-none" : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"}`}
                  >
                    {msg.text.split("\n").map((line, i) => (
                      <p
                        key={i}
                        className={
                          line.trim() === "" ? "h-2" : "mb-1 last:mb-0"
                        }
                      >
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Inline Interactive Navigation Trigger Button */}
                  {msg.navigationIntent && (
                    <div className="card bg-slate-900 border border-slate-800 p-4 flex flex-col gap-3.5 w-full max-w-[85%] mt-1">
                      <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                        Plan Detected
                      </p>
                      <p className="text-xs font-medium text-slate-200 leading-snug">
                        Start road trip from {msg.navigationIntent.origin} to{" "}
                        {msg.navigationIntent.destination}?
                      </p>
                      <button
                        onClick={() =>
                          startNavigationFrom(
                            msg.navigationIntent!.origin,
                            msg.navigationIntent!.destination,
                          )
                        }
                        className="btn btn-primary btn-sm flex items-center justify-center gap-1.5 cursor-pointer text-xs py-2 px-3"
                      >
                        Start Navigation{" "}
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {isSendingMessage && (
                <div className="flex items-center space-x-2 text-slate-500 text-xs pl-1.5 animate-pulse font-medium">
                  <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce"></div>
                  <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce delay-75"></div>
                  <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce delay-150"></div>
                  <span>Sakha is composing trip plan...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input Controls */}
            <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-lg flex items-center gap-2 flex-shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendChatMessage();
                }}
                placeholder="Message Sakha..."
                className="bg-transparent text-xs text-white flex-grow p-2.5 focus:outline-none placeholder-slate-650 font-medium"
                disabled={isSendingMessage}
              />
              <button
                onClick={handleSendChatMessage}
                disabled={!chatInput.trim() || isSendingMessage}
                className="p-2.5 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold rounded-md transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer flex items-center justify-center"
                aria-label="Send message to AI assistant"
              >
                <PaperPlaneIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {permissionError && (
          <GeolocationPermissionError
            message={permissionError}
            onRetry={() => {
              setPermissionError(null);
              handleStartTrip();
            }}
            onCancel={() => setPermissionError(null)}
          />
        )}
        {micPermissionError && (
          <MicrophonePermissionError
            message={micPermissionError}
            onRetry={() => {
              originSpeech.setError(null);
              destinationSpeech.setError(null);
            }}
            onCancel={() => {
              originSpeech.setError(null);
              destinationSpeech.setError(null);
            }}
          />
        )}
      </div>
    </>
  );
};
