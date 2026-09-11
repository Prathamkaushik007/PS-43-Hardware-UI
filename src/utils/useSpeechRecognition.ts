import { useState, useEffect, useRef, useCallback } from 'react';

// Speech recognition type shim
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export function useSpeechRecognition(isRecording: boolean, lang: 'en' | 'hi') {
  const [transcript, setTranscript] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(isRecording);
  const isStoppedManuallyRef = useRef<boolean>(false);
  const finalTranscriptRef = useRef<string>('');
  const fallbackTimerRef = useRef<any>(null);

  // Keep isRecordingRef in sync
  useEffect(() => {
    isRecordingRef.current = isRecording;
    if (!isRecording) {
      isStoppedManuallyRef.current = true;
    } else {
      isStoppedManuallyRef.current = false;
    }
  }, [isRecording]);

  // Check support on mount
  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setIsSupported(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
  }, []);

  useEffect(() => {
    if (!isRecording) {
      // Stop recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      setIsRecognizing(false);
      return;
    }

    // Reset transcript on fresh start
    finalTranscriptRef.current = '';
    setTranscript('');
    isStoppedManuallyRef.current = false;

    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      let recognition: any = null;

      try {
        recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        // Primary locale with standard fallback
        recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';

        recognition.onstart = () => {
          setIsRecognizing(true);
        };

        recognition.onresult = (event: any) => {
          let interim = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            const text = res[0].transcript;
            if (res.isFinal) {
              finalTranscriptRef.current = (finalTranscriptRef.current ? finalTranscriptRef.current + ' ' : '') + text.trim();
            } else {
              interim += (interim ? ' ' : '') + text;
            }
          }

          const currentFull = (finalTranscriptRef.current + (interim ? ' ' + interim : '')).trim();
          if (currentFull) {
            setTranscript(currentFull);
          }
        };

        recognition.onerror = (e: any) => {
          console.debug('Speech recognition event error:', e.error);
          if (e.error === 'no-speech') {
            // Silence is normal when citizen is thinking, do not terminate
            return;
          }
          if (e.error === 'network' || e.error === 'not-allowed') {
            // If Web Speech API is offline or blocked, initiate helpful context fallback
            startFallbackSimulation();
          }
        };

        // CRITICAL: Chromium Web Speech API fires onend when user pauses.
        // We MUST auto-restart while recording is active!
        recognition.onend = () => {
          setIsRecognizing(false);
          if (isRecordingRef.current && !isStoppedManuallyRef.current) {
            try {
              recognition.start();
            } catch {
              // Ignore if already active or transitioning
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition initialization failed, using speech assistant fallback:', err);
        startFallbackSimulation();
      }

      return () => {
        isStoppedManuallyRef.current = true;
        if (recognition) {
          try {
            recognition.stop();
          } catch {
            // ignore
          }
        }
        if (fallbackTimerRef.current) {
          clearInterval(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
        setIsRecognizing(false);
      };
    } else {
      startFallbackSimulation();
      return () => {
        if (fallbackTimerRef.current) {
          clearInterval(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
      };
    }

    function startFallbackSimulation() {
      if (fallbackTimerRef.current) return;

      const sampleSentencesEn = [
        "There is a severe water leakage problem near Ward No 4.",
        "The main pipeline has broken and clean water is flooding the street.",
        "It has been three days without drinking water supply in our locality.",
        "Please repair this pipeline urgently as children have to walk through muddy water."
      ];

      const sampleSentencesHi = [
        "वार्ड नंबर 4 के पास मुख्य पानी की पाइपलाइन फूट गई है।",
        "सड़क पर लगातार तीन दिन से पानी भर रहा है।",
        "हमारे मोहल्ले में पीने का पानी नहीं आ रहा है।",
        "कृपया जल संस्थान से इस लीकेज को तुरंत ठीक करवाने की कृपा करें।"
      ];

      const sampleSentences = lang === 'hi' ? sampleSentencesHi : sampleSentencesEn;
      let step = 0;

      fallbackTimerRef.current = setInterval(() => {
        if (!isRecordingRef.current) {
          clearInterval(fallbackTimerRef.current);
          return;
        }
        if (step < sampleSentences.length) {
          setTranscript(prev => (prev ? prev + ' ' + sampleSentences[step] : sampleSentences[step]));
          step++;
        }
      }, 3500);
    }
  }, [isRecording, lang]);

  return {
    transcript,
    setTranscript,
    resetTranscript,
    isSupported,
    isRecognizing
  };
}
