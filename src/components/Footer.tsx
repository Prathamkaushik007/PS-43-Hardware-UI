import React from 'react';
import { Headphones } from 'lucide-react';
import { translations } from '../data/translations';
import type { Language } from '../data/translations';

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const t = translations[lang];

  return (
    <footer className="kiosk-footer">
      <div className="footer-left">
        <span className="online-dot" />
        <span>{t.hardwareStatus}</span>
      </div>

      <div className="footer-mid">
        <span>Physical Keys mapped: </span>
        <span className="footer-key-badge">V</span> - Video,&nbsp;
        <span className="footer-key-badge">A</span> - Audio,&nbsp;
        <span className="footer-key-badge">S</span> - Stop,&nbsp;
        <span className="footer-key-badge">C</span> - Cancel
      </div>

      <div className="footer-right">
        <div className="voice-engine-indicator">
          <Headphones size={15} />
          <span>{t.voiceActive}</span>
        </div>
        <span>•</span>
        <span>{t.helpline}</span>
      </div>
    </footer>
  );
};
