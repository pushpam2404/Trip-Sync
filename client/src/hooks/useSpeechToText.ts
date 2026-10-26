import { useState, useRef, useCallback } from 'react';

/** Browser speech recognition for filling a text field by voice. */
export function useSpeechToText(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    setError(null);
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      // Ask for the microphone first so a denial gives a clear message.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setError('Microphone permission denied.');
      return;
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => onResult(event.results[0][0].transcript);
    recognition.start();
  }, [onResult]);

  return { isListening, error, startListening, setError };
}
