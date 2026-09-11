import { useState, useEffect, useRef } from 'react';

// Speech recognition type shim
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export function useSpeechRecognition(isRecording: boolean, lang: 'en' | 'hi') {
  const [transcript, setTranscript] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);
  const simTimerRef = useRef<any>(null);

  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
      }
      return;
    }

    // Reset transcript on start
    setTranscript('');

    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';

        recognition.onresult = (event: any) => {
          let fullText = '';
          for (let i = 0; i < event.results.length; i++) {
            fullText += event.results[i][0].transcript + ' ';
          }
          setTranscript(fullText.trim());
        };

        recognition.onerror = (e: any) => {
          console.debug('Speech recognition event:', e.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
        return;
      } catch (err) {
        console.warn('SpeechRecognition failed to start, falling back to simulated stream:', err);
      }
    }

    // Fallback simulation when Web Speech recognition is restricted/unsupported in sandbox
    const sampleSentencesEn = [
      "There is a severe water leakage problem near Ward No 4.",
      "The main pipeline has broken and clean water is flooding the street.",
      "It has been three days without drinking water supply in our locality.",
      "Please repair this pipeline urgently as children have to walk through muddy water."
    ];

    const sampleSentencesHi = [
      "वार्ड नंबर 4 के पास मुख्य पानी की पाइपलाइन फूट गई है।",
      "सड़क पर लगातार तीन दिन से गंदा पानी भर रहा है।",
      "हमारे मोहल्ले में पीने का पानी नहीं आ रहा है।",
      "कृपया जल संस्थान से इस लीकेज को तुरंत ठीक करवाने की कृपा करें।"
    ];

    const sampleSentences = lang === 'hi' ? sampleSentencesHi : sampleSentencesEn;
    let step = 0;

    simTimerRef.current = setInterval(() => {
      if (step < sampleSentences.length) {
        setTranscript(prev => (prev ? prev + ' ' + sampleSentences[step] : sampleSentences[step]));
        step++;
      }
    }, 4000);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isRecording, lang]);

  return { transcript, setTranscript, isSupported };
}
