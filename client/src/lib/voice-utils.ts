/**
 * Voice utilities for speech synthesis with British accent preference
 */

export function getBestVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  
  // First priority: High-quality, clear voices (often female voices are clearer)
  const clearVoices = voices.filter(voice => 
    voice.lang.includes('en') && (
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('alex') ||
      voice.name.toLowerCase().includes('victoria') ||
      voice.name.toLowerCase().includes('karen') ||
      voice.name.toLowerCase().includes('susan') ||
      voice.name.toLowerCase().includes('allison') ||
      voice.name.toLowerCase().includes('ava') ||
      voice.name.toLowerCase().includes('serena')
    )
  );
  
  if (clearVoices.length > 0) {
    return clearVoices[0];
  }
  
  // Second priority: Any female English voice (typically clearer)
  const femaleVoice = voices.find(voice => 
    voice.lang.includes('en') && voice.name.toLowerCase().includes('female')
  );
  
  if (femaleVoice) {
    return femaleVoice;
  }
  
  // Third priority: Default system voice (usually the clearest)
  const defaultVoice = voices.find(voice => voice.default);
  
  if (defaultVoice) {
    return defaultVoice;
  }
  
  // Fallback: First available English voice
  return voices.find(voice => voice.lang.includes('en')) || null;
}

export function speakWithClearVoice(text: string, rate: number = 1.0): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Wait a bit for voices to load if they haven't already
    const setVoiceAndSpeak = () => {
      const bestVoice = getBestVoice();
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    };

    // If no voices are loaded yet, wait for them
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
    } else {
      setVoiceAndSpeak();
    }
  });
}