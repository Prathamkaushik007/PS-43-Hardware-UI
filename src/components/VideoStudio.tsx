import React, { useState, useEffect, useRef } from 'react';
import { Camera, Square, X, RefreshCw, Send, AlertCircle, Mic, Volume2 } from 'lucide-react';
import { translations } from '../data/translations';
import type { Language } from '../data/translations';
import { useSpeechRecognition } from '../utils/useSpeechRecognition';
import { playBeep, playKioskClick } from '../utils/audioSystem';

interface VideoStudioProps {
  lang: Language;
  onFinish: (transcript: string, videoBlobUrl: string | null, videoBlob?: Blob | null) => void;
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
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(() => {
    const saved = localStorage.getItem('kiosk_camera_mirrored');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleMirror = () => {
    playKioskClick();
    setIsMirrored(prev => {
      const next = !prev;
      localStorage.setItem('kiosk_camera_mirrored', String(next));
      return next;
    });
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Speech-to-text hook with continuous listening
  const { transcript, isRecognizing } = useSpeechRecognition(isRecording, lang);

  // Initialize webcam & microphone
  useEffect(() => {
    let unmounted = false;

    async function startCamera() {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: true
          });
        } catch {
          // Fallback if specific audio or resolution constraints fail
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch {
            // Fallback if mic is unavailable or blocked
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          }
        }

        if (unmounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        setHasWebcam(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // Setup MediaRecorder
        try {
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          chunksRef.current = [];

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              chunksRef.current.push(e.data);
            }
          };

          recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setRecordedBlob(blob);
            setRecordedUrl(url);
          };

          recorder.start(500);
        } catch (recErr) {
          console.warn('MediaRecorder error:', recErr);
        }
      } catch (err) {
        console.error('Webcam initialization failed:', err);
        if (!unmounted) {
          setHasWebcam(false);
        }
      }
    }

    startCamera();

    return () => {
      unmounted = true;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Re-sync video element whenever hasWebcam or isRecording updates
  useEffect(() => {
    if (hasWebcam && isRecording && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [hasWebcam, isRecording]);

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
      } catch {}
    }
  };

  const handleRetake = () => {
    playKioskClick();
    setRecordedUrl(null);
    setRecordedBlob(null);
    setSecondsRemaining(60);
    setIsRecording(true);

    if (streamRef.current) {
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }

      try {
        chunksRef.current = [];
        const recorder = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          setRecordedBlob(blob);
          setRecordedUrl(URL.createObjectURL(blob));
        };
        recorder.start(500);
      } catch (err) {
        console.warn('Retake recorder error:', err);
      }
    }
  };

  const handleSubmit = () => {
    playKioskClick();
    onFinish(transcript, recordedUrl, recordedBlob);
  };

  // Keyboard shortcut listener inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 's') {
        if (isRecording) handleStop();
      } else if (key === 'c' || key === 'escape') {
        onCancel();
      } else if (key === 'f') {
        toggleMirror();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, isMirrored]);

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
            {isRecording && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#38bdf8', fontWeight: 700, marginLeft: '6px' }}>
                <Mic size={14} />
                <span>MIC LIVE</span>
              </div>
            )}
          </div>

          <div className={`countdown-timer ${secondsRemaining <= 10 && isRecording ? 'warning' : ''}`}>
            ⏱️ {formatTime(secondsRemaining)}
          </div>
        </div>

        {/* Video Screen Area */}
        <div className="video-stage">
          {/* Flip / Mirror Button for instant one-click toggle */}
          <button
            className="btn-flip-camera"
            onClick={toggleMirror}
            title="Toggle Horizontal Flip (Mirror / Normal) [Key: F]"
          >
            <RefreshCw size={13} />
            <span>{isMirrored ? (lang === 'hi' ? 'मिरर: चालू [F]' : 'Mirror: ON [F]') : (lang === 'hi' ? 'मिरर: बंद [F]' : 'Mirror: OFF [F]')}</span>
          </button>

          {isRecording ? (
            hasWebcam ? (
              <>
                {/* Real-time live camera feed with dynamic mirror toggle */}
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && streamRef.current && el.srcObject !== streamRef.current) {
                      el.srcObject = streamRef.current;
                      el.play().catch(e => console.debug('Live video play:', e));
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className={`video-element ${isMirrored ? 'mirrored' : ''}`}
                />

                <div className="camera-guide-frame">
                  <div className="camera-guide-text">
                    👤 Position face & grievance document within frame
                  </div>
                </div>
              </>
            ) : (
              /* Fallback while camera is acquiring */
              <div className="simulated-camera">
                <div className="sim-avatar-circle">
                  <Camera size={48} />
                </div>
                <div style={{ textAlign: 'center', padding: '0 20px' }}>
                  <p style={{ fontWeight: 700, color: '#f8fafc', fontSize: '16px' }}>
                    {t.speakNowPrompt}
                  </p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                    [Connecting to camera...]
                  </p>
                </div>
              </div>
            )
          ) : (
            /* Stopped state: preview playback */
            recordedUrl ? (
              <video
                src={recordedUrl}
                controls
                autoPlay
                playsInline
                className={`video-element ${isMirrored ? 'mirrored' : ''}`}
              />
            ) : (
              <div className="simulated-camera">
                <div className="sim-avatar-circle" style={{ borderColor: '#10b981', color: '#34d399' }}>
                  <Volume2 size={48} />
                </div>
                <p style={{ fontWeight: 700, color: '#f8fafc' }}>
                  Video recorded successfully! Ready to submit.
                </p>
              </div>
            )
          )}
        </div>

        {/* Live Speech Recognition Transcript */}
        <div className="transcript-preview">
          <div className="transcript-header">
            <div className="transcript-label">
              <AlertCircle size={14} />
              <span>{t.speechRecognized}</span>
              {isRecording && isRecognizing && (
                <span style={{ fontSize: '10px', color: '#10b981', marginLeft: '6px' }}>● Listening</span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {isRecording ? 'Listening in real time (Hindi / English)...' : 'Transcribed text'}
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
