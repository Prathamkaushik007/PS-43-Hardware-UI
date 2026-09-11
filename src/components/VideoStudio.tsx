import React, { useState, useEffect, useRef } from 'react';
import { Camera, Square, X, RefreshCw, Send, AlertCircle } from 'lucide-react';
import { translations } from '../data/translations';
import type { Language } from '../data/translations';
import { useSpeechRecognition } from '../utils/useSpeechRecognition';
import { playBeep, playKioskClick } from '../utils/audioSystem';

interface VideoStudioProps {
  lang: Language;
  onFinish: (transcript: string, videoBlobUrl: string | null) => void;
  onCancel: () => void;
}

export const VideoStudio: React.FC<VideoStudioProps> = ({
  lang,
  onFinish,
  onCancel,
}) => {
  const t = translations[lang];
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [hasWebcam, setHasWebcam] = useState<boolean>(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Speech-to-text hook
  const { transcript } = useSpeechRecognition(isRecording, lang);

  // Initialize webcam
  useEffect(() => {
    let active = true;

    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: true
        });

        if (!active) {
          stream.getTracks().forEach(tr => tr.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setHasWebcam(true);

        // Setup MediaRecorder
        try {
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          chunksRef.current = [];

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };

          recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setRecordedUrl(url);
          };

          recorder.start(500);
        } catch (e) {
          console.debug('MediaRecorder error:', e);
        }
      } catch (err) {
        console.warn('Webcam permission denied or not available, using simulated kiosk feed:', err);
        setHasWebcam(false);
      }
    }

    setupCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(tr => tr.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // 60-second countdown timer
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
      } catch {
        // ignore
      }
    }
  };

  const handleRetake = () => {
    playKioskClick();
    setRecordedUrl(null);
    setSecondsRemaining(60);
    setIsRecording(true);

    if (streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});

      try {
        const recorder = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          setRecordedUrl(URL.createObjectURL(blob));
        };
        recorder.start(500);
      } catch {}
    }
  };

  const handleSubmit = () => {
    playKioskClick();
    onFinish(transcript, recordedUrl);
  };

  // Keyboard shortcut listener inside modal
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
            <Camera size={22} color="#e11d48" />
            <span style={{ fontWeight: 800, fontSize: '17px' }}>
              {isRecording ? t.recordingVideo : t.previewHeading}
            </span>
            {isRecording && (
              <div className="rec-badge">
                <span className="rec-dot" />
                <span>REC LIVE</span>
              </div>
            )}
          </div>

          <div className={`countdown-timer ${secondsRemaining <= 10 && isRecording ? 'warning' : ''}`}>
            ⏱️ {formatTime(secondsRemaining)}
          </div>
        </div>

        {/* Video Screen Area */}
        <div className="video-stage">
          {isRecording ? (
            hasWebcam ? (
              <video ref={videoRef} autoPlay playsInline muted className="video-element" />
            ) : (
              <div className="simulated-camera">
                <div className="sim-avatar-circle">
                  <Camera size={48} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 700, color: '#f8fafc', fontSize: '16px' }}>
                    {t.speakNowPrompt}
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    [Hardware Camera Simulation Mode Active]
                  </p>
                </div>
              </div>
            )
          ) : (
            recordedUrl ? (
              <video src={recordedUrl} controls autoPlay className="video-element" />
            ) : (
              <div className="simulated-camera">
                <div className="sim-avatar-circle" style={{ borderColor: '#10b981', color: '#34d399' }}>
                  <Camera size={48} />
                </div>
                <p style={{ fontWeight: 700, color: '#f8fafc' }}>
                  Video recorded successfully! Ready to submit.
                </p>
              </div>
            )
          )}

          {isRecording && (
            <div className="camera-guide-frame">
              <div className="camera-guide-text">
                👤 Position face & grievance document within frame
              </div>
            </div>
          )}
        </div>

        {/* Live Speech Recognition Transcript */}
        <div className="transcript-preview">
          <div className="transcript-header">
            <div className="transcript-label">
              <AlertCircle size={14} />
              <span>{t.speechRecognized}</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {isRecording ? 'Listening in real time...' : 'Transcribed text'}
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
