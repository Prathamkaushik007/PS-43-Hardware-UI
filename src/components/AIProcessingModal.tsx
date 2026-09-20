import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle, Cpu, CloudUpload, HardDrive } from 'lucide-react';
import { translations } from '../data/translations';
import type { Language } from '../data/translations';

interface AIProcessingModalProps {
  lang: Language;
  onComplete: () => void;
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'failed';
  uploadMessage?: string;
  mediaType?: 'VIDEO' | 'AUDIO';
}

export const AIProcessingModal: React.FC<AIProcessingModalProps> = ({
  lang,
  onComplete,
  uploadStatus,
  uploadMessage,
  mediaType,
}) => {
  const t = translations[lang];
  const [currentStep, setCurrentStep] = useState<number>(0);

  const stepsEn = [
    'Ingesting audio/video stream into pipeline...',
    'Transcribing Hindi/English speech to text...',
    'Analyzing grievance with Gemini AI...',
    'Assigning category, department & urgency priority...',
    'Generating official tracking token & digital QR...'
  ];

  const stepsHi = [
    'ऑडियो/वीडियो स्ट्रीम प्राप्त की जा रही है...',
    'आवाज़ का हिंदी/अंग्रेजी में रूपांतरण जारी...',
    'जेमिनी एआई द्वारा समस्या का विश्लेषण...',
    'संबंधित विभाग एवं प्राथमिकता का निर्धारण...',
    'आधिकारिक ट्रैकिंग टोकन और क्यूआर कोड तैयार...'
  ];

  const steps = lang === 'hi' ? stepsHi : stepsEn;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 600);
          return prev;
        }
      });
    }, 700);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="studio-overlay">
      <div className="help-card" style={{ maxWidth: '520px', textAlign: 'center', padding: '36px 28px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.15)', border: '2px solid #3b82f6', color: '#60a5fa', marginBottom: '16px' }}>
          <Sparkles size={40} className="pulse-dot" />
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
          {t.submittingTitle}
        </h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
          {t.submittingDesc}
        </p>

        {/* Steps progression */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', background: '#090e1a', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {steps.map((stepText, idx) => {
            const isFinished = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  color: isFinished ? '#34d399' : isCurrent ? '#60a5fa' : '#475569',
                  fontWeight: isCurrent ? 700 : 500
                }}
              >
                {isFinished ? (
                  <CheckCircle size={16} color="#10b981" />
                ) : isCurrent ? (
                  <Cpu size={16} color="#3b82f6" />
                ) : (
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1.5px solid #475569' }} />
                )}
                <span>{stepText}</span>
              </div>
            );
          })}
        </div>

        {/* Cloudflare R2 Upload Status Banner (for video recording) */}
        {mediaType === 'VIDEO' && uploadStatus && uploadStatus !== 'idle' && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontWeight: 600,
              background:
                uploadStatus === 'success'
                  ? 'rgba(16, 185, 129, 0.12)'
                  : uploadStatus === 'failed'
                  ? 'rgba(245, 158, 11, 0.12)'
                  : 'rgba(56, 189, 248, 0.12)',
              border:
                uploadStatus === 'success'
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : uploadStatus === 'failed'
                  ? '1px solid rgba(245, 158, 11, 0.3)'
                  : '1px solid rgba(56, 189, 248, 0.3)',
              color:
                uploadStatus === 'success'
                  ? '#34d399'
                  : uploadStatus === 'failed'
                  ? '#fbbf24'
                  : '#38bdf8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {uploadStatus === 'uploading' && <CloudUpload size={16} className="pulse-dot" />}
              {uploadStatus === 'success' && <CheckCircle size={16} />}
              {uploadStatus === 'failed' && <HardDrive size={16} />}
              <span>
                {uploadStatus === 'uploading' && (lang === 'hi' ? 'क्लाउडफ्लेयर R2 पर वीडियो अपलोड हो रहा है...' : 'Uploading video to Cloudflare R2...')}
                {uploadStatus === 'success' && (lang === 'hi' ? 'क्लाउडफ्लेयर R2: वीडियो सफलतापूर्वक अपलोड हुआ' : 'Cloudflare R2: Video upload successful')}
                {uploadStatus === 'failed' && (uploadMessage || (lang === 'hi' ? 'स्थानीय स्तर पर सहेजा गया — क्लाउड अपलोड विफल' : 'Saved locally — cloud upload failed'))}
              </span>
            </div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.5px' }}>
              {uploadStatus === 'uploading' ? 'STREAMING' : uploadStatus === 'success' ? 'R2 CLOUD' : 'LOCAL IDB'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
