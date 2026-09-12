import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, X, RefreshCw, Send, AlertCircle, Volume2 } from 'lucide-react';
import { translations } from '../data/translations';
import type { Language } from '../data/translations';
import { useSpeechRecognition } from '../utils/useSpeechRecognition';
import { playBeep, playKioskClick, playInstructionAudio } from '../utils/audioSystem';

interface AudioStudioProps {
  lang: Language;
  onFinish: (transcript: string, audioUrl?: string | null) => void;
  onCancel: () => void;
}

export const AudioStudio: React.FC<AudioStudioProps> = ({
  lang,
  onFinish,
  onCancel,
}) => {
  const t = translations[lang];
  const [preRecordState, setPreRecordState] = useState<'INFO' | 'COUNTDOWN' | null>('INFO');
  const [countdown, setCountdown] = useState<number>(3);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const hasPlayedIntroRef = useRef<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { transcript, isRecognizing } = useSpeechRecognition(isRecording, lang);

  // Pre-recording Flow (Instruction Audio & Countdown)
  useEffect(() => {
    let unmounted = false;
    let cleanupAudio: (() => void) | undefined;
    
    if (preRecordState === 'INFO') {
      if (!hasPlayedIntroRef.current) {
        hasPlayedIntroRef.current = true;
        cleanupAudio = playInstructionAudio('audio', lang, t.audioInfoText, () => {
          if (!unmounted) setPreRecordState('COUNTDOWN');
        });
      }
    } else if (preRecordState === 'COUNTDOWN') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setPreRecordState(null);
            setIsRecording(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
    
    return () => {
      unmounted = true;
      if (cleanupAudio) cleanupAudio();
    };
  }, [preRecordState, lang, t.audioInfoText]);

  // Setup Web Audio analyser and MediaRecorder
  useEffect(() => {
    let active = true;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        if (!active) {
          stream.getTracks().forEach(tr => tr.stop());
          return;
        }
        streamRef.current = stream;

        // Setup live audio visualizer
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

        // Setup MediaRecorder for audio playback
        try {
          const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : '';

          const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          chunksRef.current = [];

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
          };

          recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
            const url = URL.createObjectURL(blob);
            setRecordedAudioUrl(url);
          };

          // We defer starting the recorder until isRecording becomes true
        } catch (recErr) {
          console.debug('MediaRecorder for audio error:', recErr);
        }
      } catch (e) {
        console.warn('Microphone permission not granted, using simulated visualizer:', e);
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

  // Start MediaRecorder when preRecordState becomes null (transition to RECORDING)
  useEffect(() => {
    if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      try {
        chunksRef.current = [];
        mediaRecorderRef.current.start(500);
      } catch (e) {
        console.warn('Failed to start recorder on transition:', e);
      }
    }
  }, [isRecording]);

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

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
  };

  const handleRetake = () => {
    playKioskClick();
    setRecordedAudioUrl(null);
    setSecondsRemaining(60);
    setIsRecording(true);

    if (streamRef.current) {
      try {
        const recorder = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setRecordedAudioUrl(URL.createObjectURL(blob));
        };
        recorder.start(500);
      } catch {}
    }
  };

  const handleSubmit = () => {
    playKioskClick();
    onFinish(transcript, recordedAudioUrl);
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
          {preRecordState === 'INFO' ? (
            <div style={{ display: 'flex', flexDirection: 'column', padding: '40px' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '20px', textAlign: 'center' }}>
                Instructions
              </div>
              <div style={{ fontSize: '18px', color: '#cbd5e1', textAlign: 'center', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                {t.audioInfoText}
              </div>
            </div>
          ) : preRecordState === 'COUNTDOWN' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '120px', fontWeight: 900, color: '#2563eb', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                {countdown}
              </div>
            </div>
          ) : isRecording ? (
            <>
              <div className="audio-pulse-ring">
                <div className="audio-ripple" />
                <div className="audio-ripple" />
                <Mic size={54} color="#ffffff" />
              </div>

              <canvas ref={canvasRef} width={480} height={70} className="waveform-canvas" />

              <p style={{ marginTop: '16px', color: '#cbd5e1', fontWeight: 600, fontSize: '15px' }}>
                {t.speakNowPrompt}
              </p>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '480px', gap: '16px' }}>
              <div className="audio-pulse-ring" style={{ width: '80px', height: '80px', background: '#10b981' }}>
                <Volume2 size={36} color="#ffffff" />
              </div>
              <p style={{ color: '#f8fafc', fontWeight: 700, fontSize: '16px' }}>
                Voice complaint recorded! Click play to verify your voice.
              </p>

              {recordedAudioUrl && (
                <div style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', padding: '12px 18px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <audio src={recordedAudioUrl} controls autoPlay style={{ width: '100%', outline: 'none' }} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Speech Recognition Transcript */}
        <div className="transcript-preview">
          <div className="transcript-header">
            <div className="transcript-label" style={{ color: '#60a5fa' }}>
              <AlertCircle size={14} />
              <span>{t.speechRecognized}</span>
              {isRecording && isRecognizing && (
                <span style={{ fontSize: '10px', color: '#10b981', marginLeft: '6px' }}>● Listening</span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {isRecording ? 'Listening in real time (Hindi / English)...' : 'Transcribed audio'}
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
          {preRecordState !== null ? (
            <button className="btn-ctrl btn-ctrl-cancel" onClick={onCancel} title="Cancel (Key: C)">
              <X size={18} />
              <span>{t.cancel}</span>
            </button>
          ) : isRecording ? (
            <>
              <button className="btn-ctrl btn-ctrl-cancel" onClick={onCancel} title="Cancel recording (Key: C)">
                <X size={18} />
                <span>{t.cancel}</span>
              </button>

              <button className="btn-ctrl btn-ctrl-stop" onClick={handleStop} title="Stop recording (Key: S)">
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
