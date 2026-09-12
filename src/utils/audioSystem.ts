// Audio synthesizer and Web Speech API utilities for Public Grievance Kiosk

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioCtxClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Plays tactile audio click feedback
export function playKioskClick(): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (err) {
    console.debug('Audio click feedback error:', err);
  }
}

// Plays celebratory chime when ticket is printed
export function playSuccessChime(): void {
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
    });
  } catch (err) {
    console.debug('Chime error:', err);
  }
}

// Plays recording countdown warning beeps
export function playBeep(pitch = 880): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (err) {
    console.debug('Beep error:', err);
  }
}

// ==========================================================
// ROBUST TEXT-TO-SPEECH (TTS) ENGINE
// ==========================================================
let currentUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const list = window.speechSynthesis.getVoices();
    if (list && list.length > 0) {
      cachedVoices = list;
    }
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

function findBestVoice(lang: 'en' | 'hi'): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (voices.length === 0) return null;

  if (lang === 'hi') {
    // 1. Exact Hindi
    const hiVoice = voices.find(v => v.lang.toLowerCase() === 'hi-in' || v.lang.toLowerCase().startsWith('hi'));
    if (hiVoice) return hiVoice;

    // 2. Name contains Hindi or India
    const hiNamedVoice = voices.find(v => /hindi|india|kalpana|heera/i.test(v.name));
    if (hiNamedVoice) return hiNamedVoice;

    // Fallback: any voice
    return voices.find(v => v.default) || voices[0];
  } else {
    // English priority: en-IN -> en-US -> en-GB -> any English
    const enInVoice = voices.find(v => v.lang.toLowerCase() === 'en-in');
    if (enInVoice) return enInVoice;

    const enUsVoice = voices.find(v => v.lang.toLowerCase() === 'en-us' || /david|zira|george|susan/i.test(v.name));
    if (enUsVoice) return enUsVoice;

    const enGbVoice = voices.find(v => v.lang.toLowerCase() === 'en-gb');
    if (enGbVoice) return enGbVoice;

    const anyEn = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    if (anyEn) return anyEn;

    return voices.find(v => v.default) || voices[0];
  }
}

export function speakText(text: string, lang: 'en' | 'hi' = 'en', onEnd?: () => void): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  // Wake up AudioContext if needed
  getAudioContext();

  try {
    // Cancel any previous speech
    window.speechSynthesis.cancel();
  } catch {}

  // Microtask delay prevents Chrome cancellation collision
  setTimeout(() => {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      currentUtterance = utterance;

      const bestVoice = findBestVoice(lang);
      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
      } else {
        utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
      }

      utterance.rate = 0.96;
      utterance.pitch = 1.02;

      let hasEnded = false;
      const finish = () => {
        if (!hasEnded) {
          hasEnded = true;
          currentUtterance = null;
          if (onEnd) onEnd();
        }
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
      currentUtterance = null;
      if (onEnd) onEnd();
    }
  }, 30);
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  return Boolean(currentUtterance && typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking);
}

export function playInstructionAudio(type: 'video' | 'audio', lang: 'en' | 'hi', fallbackText: string, onEnd: () => void): () => void {
  const audio = new Audio(`/audio/${type}_instruction_${lang}.mp3`);
  let isCancelled = false;
  
  const handleEnd = () => {
    if (isCancelled) return;
    audio.removeEventListener('ended', handleEnd);
    audio.removeEventListener('error', handleError);
    onEnd();
  };

  const handleError = () => {
    if (isCancelled) return;
    console.warn(`Failed to play pre-recorded audio for ${type} in ${lang}. Falling back to TTS.`);
    audio.removeEventListener('ended', handleEnd);
    audio.removeEventListener('error', handleError);
    speakText(fallbackText, lang, () => {
      if (!isCancelled) onEnd();
    });
  };

  audio.addEventListener('ended', handleEnd);
  audio.addEventListener('error', handleError);
  
  audio.play().catch(handleError);

  return () => {
    isCancelled = true;
    audio.pause();
    audio.removeEventListener('ended', handleEnd);
    audio.removeEventListener('error', handleError);
    stopSpeaking();
  };
}
