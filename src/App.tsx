import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { PromptBanner } from './components/PromptBanner';
import { ActionCards } from './components/ActionCards';
import { FeaturesBar } from './components/FeaturesBar';
import { Footer } from './components/Footer';
import { VideoStudio } from './components/VideoStudio';
import { AudioStudio } from './components/AudioStudio';
import { AIProcessingModal } from './components/AIProcessingModal';
import { ReceiptModal } from './components/ReceiptModal';
import { HelpModal } from './components/HelpModal';
import { translations } from './data/translations';
import type { Language } from './data/translations';
import { classifyGrievanceSimulation } from './utils/aiClassifier';
import type { GrievanceTicket } from './utils/aiClassifier';
import { speakText, stopSpeaking, isSpeaking as checkIsSpeaking, playKioskClick } from './utils/audioSystem';

export function App() {
  const [lang, setLang] = useState<Language>('en');
  const [activeMode, setActiveMode] = useState<'IDLE' | 'VIDEO' | 'AUDIO' | 'PROCESSING' | 'RECEIPT' | 'HELP'>('IDLE');
  const [isSpeakingGuide, setIsSpeakingGuide] = useState<boolean>(false);
  const [currentTicket, setCurrentTicket] = useState<GrievanceTicket | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<{ transcript: string; mediaType: 'VIDEO' | 'AUDIO' } | null>(null);

  const t = translations[lang];

  // Spoken instructions trigger (LISTEN button)
  const handleListenToggle = useCallback(() => {
    if (isSpeakingGuide || checkIsSpeaking()) {
      stopSpeaking();
      setIsSpeakingGuide(false);
    } else {
      setIsSpeakingGuide(true);
      speakText(t.welcomeTTS, lang, () => {
        setIsSpeakingGuide(false);
      });
    }
  }, [lang, isSpeakingGuide, t.welcomeTTS]);

  // Video flow trigger
  const handleOpenVideo = useCallback(() => {
    stopSpeaking();
    setIsSpeakingGuide(false);
    setActiveMode('VIDEO');
    speakText(t.videoStartTTS, lang);
  }, [lang, t.videoStartTTS]);

  // Audio flow trigger
  const handleOpenAudio = useCallback(() => {
    stopSpeaking();
    setIsSpeakingGuide(false);
    setActiveMode('AUDIO');
    speakText(t.audioStartTTS, lang);
  }, [lang, t.audioStartTTS]);

  // Handler when video recording finishes and citizen clicks submit
  const handleVideoFinish = (transcript: string, _videoUrl: string | null) => {
    setPendingSubmission({ transcript, mediaType: 'VIDEO' });
    setActiveMode('PROCESSING');
  };

  // Handler when audio recording finishes and citizen clicks submit
  const handleAudioFinish = (transcript: string) => {
    setPendingSubmission({ transcript, mediaType: 'AUDIO' });
    setActiveMode('PROCESSING');
  };

  // When AI analysis completes
  const handleProcessingComplete = () => {
    if (pendingSubmission) {
      const ticket = classifyGrievanceSimulation(
        pendingSubmission.transcript,
        pendingSubmission.mediaType,
        lang
      );
      setCurrentTicket(ticket);
    }
    setActiveMode('RECEIPT');
  };

  // Return to idle home screen
  const handleResetToHome = () => {
    stopSpeaking();
    setIsSpeakingGuide(false);
    setActiveMode('IDLE');
    setCurrentTicket(null);
    setPendingSubmission(null);
  };

  // Physical hardware keyboard listener (V, A, S, C, L, H, 1, 2)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input or textarea
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName?.toLowerCase())) {
        return;
      }

      const key = e.key.toLowerCase();

      if (activeMode === 'IDLE') {
        if (key === 'v' || key === '1') {
          playKioskClick();
          handleOpenVideo();
        } else if (key === 'a' || key === '2') {
          playKioskClick();
          handleOpenAudio();
        } else if (key === 'l') {
          handleListenToggle();
        } else if (key === 'h') {
          playKioskClick();
          setActiveMode('HELP');
        } else if (key === 't') {
          playKioskClick();
          setLang(prev => (prev === 'en' ? 'hi' : 'en'));
        }
      } else if (activeMode === 'HELP') {
        if (key === 'c' || key === 'escape') {
          playKioskClick();
          setActiveMode('IDLE');
        }
      } else if (activeMode === 'RECEIPT') {
        if (key === 'c' || key === 'escape' || key === 'enter') {
          playKioskClick();
          handleResetToHome();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeMode, handleOpenVideo, handleOpenAudio, handleListenToggle]);

  return (
    <div className="kiosk-viewport">
      {/* Top Navigation & Controls */}
      <Header
        lang={lang}
        onLanguageChange={(newLang) => {
          stopSpeaking();
          setIsSpeakingGuide(false);
          setLang(newLang);
        }}
        onListenClick={handleListenToggle}
        isSpeaking={isSpeakingGuide}
        onHelpClick={() => setActiveMode('HELP')}
      />

      {/* Prominent Gold Instructions Pill */}
      <PromptBanner text={t.pressEitherPrompt} />

      {/* Massive Video & Audio Action Cards */}
      <ActionCards
        lang={lang}
        onSelectVideo={handleOpenVideo}
        onSelectAudio={handleOpenAudio}
      />

      {/* Feature Highlights Bar */}
      <FeaturesBar lang={lang} />

      {/* Hardware Status Footer */}
      <Footer lang={lang} />

      {/* Video Studio Modal */}
      {activeMode === 'VIDEO' && (
        <VideoStudio
          lang={lang}
          onFinish={handleVideoFinish}
          onCancel={handleResetToHome}
        />
      )}

      {/* Audio Studio Modal */}
      {activeMode === 'AUDIO' && (
        <AudioStudio
          lang={lang}
          onFinish={handleAudioFinish}
          onCancel={handleResetToHome}
        />
      )}

      {/* AI Processing Simulation Modal */}
      {activeMode === 'PROCESSING' && (
        <AIProcessingModal
          lang={lang}
          onComplete={handleProcessingComplete}
        />
      )}

      {/* Grievance Receipt Modal */}
      {activeMode === 'RECEIPT' && currentTicket && (
        <ReceiptModal
          lang={lang}
          ticket={currentTicket}
          onClose={handleResetToHome}
        />
      )}

      {/* Kiosk Help Modal */}
      {activeMode === 'HELP' && (
        <HelpModal
          lang={lang}
          onClose={() => setActiveMode('IDLE')}
        />
      )}
    </div>
  );
}

export default App;
