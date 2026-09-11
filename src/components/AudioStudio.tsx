import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, X, RefreshCw, Send, AlertCircle } from 'lucide-react';
import { translations } from '../data/translations';
import type { Language } from '../data/translations';
import { useSpeechRecognition } from '../utils/useSpeechRecognition';
import { playBeep, playKioskClick } from '../utils/audioSystem';

interface AudioStudioProps {
  lang: Language;
  onFinish: (transcript: string) => void;
  onCancel: () => void;
}

export const AudioStudio: React.FC<AudioStudioProps> = ({
  lang,
  onFinish,
  onCancel,
}) => {
  const t = translations[lang];
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [isRecording, setIsRecording] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Speech to text hook
  const { transcript } = useSpeechRecognition(isRecording, lang);

  // Setup Web Audio analyser
  useEffect(() => {
    let active = true;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!active) {
          stream.getTracks().forEach(tr => tr.stop());
          return;
        }
        streamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;
        source.connect(analyser);

        drawAudioWave();
      } catch (e) {
        console.warn('Microphone permission not granted, using simulated audio visualizer:', e);
        drawSimulatedWave();
      }
    }

    initAudio();

    return () => {
      active = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(tr => tr.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const drawAudioWave = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#60a5fa');
        gradient.addColorStop(1, '#2563eb');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth - 4, barHeight, 4);
        ctx.fill();

        x += barWidth;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  const drawSimulatedWave = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bars = 24;
      const barWidth = canvas.width / bars;

      for (let i = 0; i < bars; i++) {
        const height = Math.abs(Math.sin(phase + i * 0.35)) * (canvas.height * 0.7) + 10;

        const gradient = ctx.createLinearGradient(0, canvas.height - height, 0, canvas.height);
        gradient.addColorStop(0, '#60a5fa');
        gradient.addColorStop(1, '#1d4ed8');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(i * barWidth + 3, canvas.height - height, barWidth - 6, height, 4);
        ctx.fill();
      }

      phase += 0.08;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  // Timer
  useEffect(() => {
    if (!isRecording) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleStop();
          return 0;
        }
        if (prev <= 5) {
          playBeep(920);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording]);

  const handleStop = () => {
    setIsRecording(false);
    playKioskClick();
  };

  const handleRetake = () => {
    playKioskClick();
    setSecondsRemaining(60);
    setIsRecording(true);
  };

  const handleSubmit = () => {
    playKioskClick();
    onFinish(transcript);
  };

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 's') {
        if (isRecording) handleStop();
      } else if (key === 'c' || key === 'escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="studio-overlay">
      <div className="studio-modal">
        {/* Modal Header */}
        <div className="studio-header">
          <div className="studio-title-box">
            <Mic size={22} color="#2563eb" />
            <span style={{ fontWeight: 800, fontSize: '17px' }}>
              {isRecording ? t.recordingAudio : t.previewHeading}
            </span>
            {isRecording && (
              <div className="rec-badge" style={{ borderColor: 'rgba(37, 99, 235, 0.5)', color: '#60a5fa' }}>
                <span className="rec-dot" style={{ background: '#3b82f6' }} />
                <span>MIC LIVE</span>
              </div>
            )}
          </div>

          <div className={`countdown-timer ${secondsRemaining <= 10 && isRecording ? 'warning' : ''}`}>
            ⏱️ {formatTime(secondsRemaining)}
          </div>
        </div>

        {/* Audio Pulse Ring & Waves */}
        <div className="audio-stage">
          <div className="audio-pulse-ring">
            {isRecording && (
              <>
                <div className="audio-ripple" />
                <div className="audio-ripple" />
              </>
            )}
            <Mic size={54} color="#ffffff" />
          </div>

          <canvas ref={canvasRef} width={480} height={70} className="waveform-canvas" />

          <p style={{ marginTop: '16px', color: '#cbd5e1', fontWeight: 600, fontSize: '15px' }}>
            {isRecording ? t.speakNowPrompt : 'Voice complaint recorded! Ready to submit.'}
          </p>
        </div>

        {/* Live Speech Recognition Transcript */}
        <div className="transcript-preview">
          <div className="transcript-header">
            <div className="transcript-label" style={{ color: '#60a5fa' }}>
              <AlertCircle size={14} />
              <span>{t.speechRecognized}</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {isRecording ? 'Listening in real time...' : 'Transcribed audio'}
            </span>
          </div>
          <div className="transcript-content">
            {transcript ? (
              <p>{transcript}</p>
            ) : (
              <p className="transcript-placeholder">{t.speechPlaceholder}</p>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="studio-controls">
          {isRecording ? (
            <>
              <button className="btn-ctrl btn-ctrl-cancel" onClick={onCancel}>
                <X size={18} />
                <span>{t.cancel}</span>
              </button>

              <button className="btn-ctrl btn-ctrl-stop" onClick={handleStop}>
                <Square size={18} />
                <span>{t.stopRecording}</span>
              </button>
            </>
          ) : (
            <>
              <button className="btn-ctrl btn-ctrl-cancel" onClick={handleRetake}>
                <RefreshCw size={18} />
                <span>{t.retake}</span>
              </button>

              <button className="btn-ctrl btn-ctrl-submit" onClick={handleSubmit}>
                <Send size={18} />
                <span>{t.submitGrievance}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
