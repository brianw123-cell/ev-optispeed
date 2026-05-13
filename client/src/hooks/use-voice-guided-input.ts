import { useState, useCallback, useRef, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { speakWithClearVoice } from '@/lib/voice-utils';

interface VoiceField {
  name: string;
  label: string;
  description: string;
  type: 'number' | 'select' | 'boolean';
  parseValue: (transcript: string) => any;
  validation?: (value: any) => boolean;
}

interface UseVoiceGuidedInputProps {
  form: UseFormReturn<any>;
  fields: VoiceField[];
  onComplete?: () => void;
  onError?: (message: string) => void;
}

// Time the recognizer waits for the user to start speaking before giving up.
const LISTEN_TIMEOUT_MS = 8000;

type SpeechRecognitionCtor = new () => any;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useVoiceGuidedInput({ form, fields, onComplete, onError }: UseVoiceGuidedInputProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSupported] = useState(
    () => typeof window !== 'undefined'
      && 'speechSynthesis' in window
      && getSpeechRecognitionCtor() !== null
  );

  // Stable recognizer instance + a ref to abort cleanly when the user cancels.
  const recognitionRef = useRef<any>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!isSupported) return;
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-US';
    recognitionRef.current = r;
    return () => {
      try { r.abort?.(); } catch { /* noop */ }
      recognitionRef.current = null;
    };
  }, [isSupported]);

  const speak = useCallback(async (text: string): Promise<void> => {
    setIsSpeaking(true);
    setCurrentMessage(text);
    try {
      await speakWithClearVoice(text, 1.0);
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  /**
   * Listen for one utterance with a hard timeout. Resolves with the transcript,
   * or rejects with a coded error: 'not-allowed' (mic permission), 'no-speech'
   * (silence), 'timeout' (never started), 'aborted' (user cancelled), 'unknown'.
   */
  const listen = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const r = recognitionRef.current;
      if (!r) return reject(new Error('not-supported'));

      setIsListening(true);
      setCurrentMessage('Listening...');

      let finished = false;
      const finish = (fn: () => void) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        setIsListening(false);
        fn();
      };

      const timer = setTimeout(() => {
        try { r.abort(); } catch { /* noop */ }
        finish(() => reject(new Error('timeout')));
      }, LISTEN_TIMEOUT_MS);

      r.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? '';
        finish(() => resolve(transcript));
      };
      r.onerror = (event: any) => {
        const errCode: string = event?.error ?? 'unknown';
        finish(() => reject(new Error(errCode)));
      };
      r.onend = () => {
        // If end fires without result or error, treat as no-speech.
        finish(() => resolve(''));
      };

      try {
        r.start();
      } catch (err) {
        finish(() => reject(err instanceof Error ? err : new Error('start-failed')));
      }
    });
  }, []);

  const processField = useCallback(async (fieldIndex: number): Promise<void> => {
    if (cancelledRef.current) return;
    if (fieldIndex >= fields.length) {
      setIsActive(false);
      setCurrentFieldIndex(0);
      setCurrentMessage('Calculating...');
      onComplete?.();
      return;
    }

    const field = fields[fieldIndex];
    setCurrentFieldIndex(fieldIndex);

    await speak(field.description);
    if (cancelledRef.current) return;

    await new Promise(resolve => setTimeout(resolve, 400));
    if (cancelledRef.current) return;

    try {
      const transcript = await listen();
      if (cancelledRef.current) return;

      if (transcript) {
        const parsedValue = field.parseValue(transcript);
        if (field.validation ? field.validation(parsedValue) : parsedValue !== null) {
          form.setValue(field.name, parsedValue);
          await speak(`Set to ${parsedValue}`);
        } else {
          await speak("I didn't understand that. Skipping.");
        }
      } else {
        await speak("I didn't hear anything. Skipping.");
      }

      await new Promise(resolve => setTimeout(resolve, 600));
      await processField(fieldIndex + 1);
    } catch (err) {
      if (cancelledRef.current) return;
      const code = err instanceof Error ? err.message : 'unknown';

      // 'not-allowed' / 'service-not-allowed' = mic permission denied or blocked.
      // We can't continue without it — bail out and tell the user.
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        cancelledRef.current = true;
        setIsActive(false);
        setIsListening(false);
        setCurrentMessage('');
        onError?.('Microphone access denied. Enable it in your browser settings to use voice input.');
        return;
      }

      // 'timeout' / 'no-speech' = user didn't speak. Skip the field, keep going.
      if (code === 'timeout' || code === 'no-speech') {
        await speak("Didn't catch that. Moving on.");
      } else {
        await speak('Voice error. Skipping.');
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      await processField(fieldIndex + 1);
    }
  }, [fields, form, speak, listen, onComplete, onError]);

  const startVoiceInput = useCallback(async () => {
    if (!isSupported || isActive) return;
    cancelledRef.current = false;
    setIsActive(true);
    setCurrentFieldIndex(0);
    await processField(0);
  }, [isSupported, isActive, processField]);

  const stopVoiceInput = useCallback(() => {
    cancelledRef.current = true;
    try { recognitionRef.current?.abort?.(); } catch { /* noop */ }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setCurrentFieldIndex(0);
    setCurrentMessage('');
  }, []);

  return {
    isSupported,
    isActive,
    isListening,
    isSpeaking,
    currentMessage,
    currentFieldIndex,
    startVoiceInput,
    stopVoiceInput
  };
}
