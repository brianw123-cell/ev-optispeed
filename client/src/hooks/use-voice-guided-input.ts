import { useState, useCallback } from 'react';
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
}

export function useVoiceGuidedInput({ form, fields, onComplete }: UseVoiceGuidedInputProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSupported] = useState(() => 
    'speechSynthesis' in window && 
    ('webkitSpeechRecognition' in (window as any) || 'SpeechRecognition' in (window as any))
  );

  const recognition = isSupported ? new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)() : null;

  // Configure speech recognition
  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
  }

  const speak = useCallback(async (text: string): Promise<void> => {
    setIsSpeaking(true);
    setCurrentMessage(text);
    
    try {
      await speakWithClearVoice(text, 1.0);
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const listen = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      setIsListening(true);
      setCurrentMessage('Listening...');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        setIsListening(false);
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setCurrentMessage('Voice input error. Moving to next field...');
        setTimeout(() => resolve(''), 1500);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      try {
        recognition.start();
      } catch (error) {
        setIsListening(false);
        reject(error);
      }
    });
  }, [recognition]);

  const processField = useCallback(async (fieldIndex: number) => {
    if (fieldIndex >= fields.length) {
      setIsActive(false);
      setCurrentFieldIndex(0);
      setCurrentMessage('Calculating...');
      onComplete?.();
      return;
    }

    const field = fields[fieldIndex];
    setCurrentFieldIndex(fieldIndex);

    // Read field description
    await speak(field.description);
    
    // Wait a moment before listening
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Listen for user input
      const transcript = await listen();
      
      if (transcript) {
        // Parse and validate the input
        const parsedValue = field.parseValue(transcript);
        
        if (field.validation ? field.validation(parsedValue) : parsedValue !== null) {
          form.setValue(field.name, parsedValue);
          await speak(`Set to ${parsedValue}`);
        } else {
          await speak('Invalid input. Using default value.');
        }
      } else {
        await speak('No input received. Skipping this field.');
      }

      // Wait before moving to next field
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Process next field
      await processField(fieldIndex + 1);
      
    } catch (error) {
      await speak('Voice input error. Skipping this field.');
      await new Promise(resolve => setTimeout(resolve, 800));
      await processField(fieldIndex + 1);
    }
  }, [fields, form, speak, listen, onComplete]);

  const startVoiceInput = useCallback(async () => {
    if (!isSupported || isActive) return;

    setIsActive(true);
    setCurrentFieldIndex(0);
    
    // Start directly with first field
    await processField(0);
  }, [isSupported, isActive, processField]);

  const stopVoiceInput = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
    window.speechSynthesis.cancel();
    setIsActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setCurrentFieldIndex(0);
    setCurrentMessage('');
  }, [recognition]);

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