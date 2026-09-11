import React from 'react';
import { Camera, Mic } from 'lucide-react';
import { translations } from '../data/translations';
import type { Language } from '../data/translations';
import { playKioskClick } from '../utils/audioSystem';

interface ActionCardsProps {
  lang: Language;
  onSelectVideo: () => void;
  onSelectAudio: () => void;
}

export const ActionCards: React.FC<ActionCardsProps> = ({
  lang,
  onSelectVideo,
  onSelectAudio,
}) => {
  const t = translations[lang];

  return (
    <div className="cards-container">
      {/* VIDEO CARD (RED) */}
      <div
        className="kiosk-card kiosk-card-video"
        onClick={() => {
          playKioskClick();
          onSelectVideo();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            playKioskClick();
            onSelectVideo();
          }
        }}
        aria-label="Start Video Grievance Recording"
      >
        <div className="card-top-pill">
          {t.videoBadge}
        </div>

        <div className="card-icon-wrapper">
          <Camera size={58} color="#ffffff" strokeWidth={2} />
        </div>

        <h2 className="card-title">{t.videoTitle}</h2>
        <p className="card-subtitle">{t.videoSubtitle}</p>

        <div className="card-action-pill">
          <span>{t.videoActionBtn}</span>
        </div>

        <div className="card-keypad-hint">
          {t.videoKeyHint}
        </div>
      </div>

      {/* AUDIO CARD (BLUE) */}
      <div
        className="kiosk-card kiosk-card-audio"
        onClick={() => {
          playKioskClick();
          onSelectAudio();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            playKioskClick();
            onSelectAudio();
          }
        }}
        aria-label="Start Audio Grievance Recording"
      >
        <div className="card-top-pill">
          {t.audioBadge}
        </div>

        <div className="card-icon-wrapper">
          <Mic size={58} color="#ffffff" strokeWidth={2} />
        </div>

        <h2 className="card-title">{t.audioTitle}</h2>
        <p className="card-subtitle">{t.audioSubtitle}</p>

        <div className="card-action-pill">
          <span>{t.audioActionBtn}</span>
        </div>

        <div className="card-keypad-hint">
          {t.audioKeyHint}
        </div>
      </div>
    </div>
  );
};
