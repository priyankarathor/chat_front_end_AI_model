import { useCallback, useEffect, useRef, useState } from 'react';

// Minimal type for the webkit SpeechRecognition API
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: { 0: { transcript: string }; isFinal: boolean };
  };
}

export function useVoiceInput() {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recRef = useRef<any>(null);
  const onFinalRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (e: SpeechRecognitionEventLike) => {
      let finalText = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interimText += t;
      }
      if (interimText) setInterim(interimText);
      if (finalText && onFinalRef.current) {
        onFinalRef.current(finalText.trim());
        setInterim('');
      }
    };
    rec.onend = () => {
      setListening(false);
      setInterim('');
    };
    rec.onerror = () => {
      setListening(false);
      setInterim('');
    };
    recRef.current = rec;
  }, []);

  const start = useCallback((onFinal: (text: string) => void) => {
    onFinalRef.current = onFinal;
    setInterim('');
    if (recRef.current) {
      try {
        recRef.current.start();
        setListening(true);
      } catch {
        /* already started */
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch {
        /* noop */
      }
    }
    setListening(false);
    setInterim('');
  }, []);

  return { listening, interim, start, stop, supported: !!recRef.current };
}

export function useSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    u.onend = () => setSpeakingId(null);
    u.onerror = () => setSpeakingId(null);
    utterRef.current = u;
    setSpeakingId(id);
    window.speechSynthesis.speak(u);
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  return { speakingId, speak, stop };
}
