import React from 'react';
import { Volume2, HelpCircle } from 'lucide-react';
import { translations } from '../data/translations';
import type { Language } from '../data/translations';
import { playKioskClick } from '../utils/audioSystem';

interface HeaderProps {
  lang: Language;
  onLanguageChange: (newLang: Language) => void;
  onListenClick: () => void;
  isSpeaking: boolean;
  onHelpClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onLanguageChange,
  onListenClick,
  isSpeaking,
  onHelpClick,
}) => {
  const t = translations[lang];

  return (
    <header className="kiosk-header">
      <div className="header-left">
        {/* Emblem / Kiosk Logo */}
        <div className="emblem-box" title="Government Grievance Portal">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18"/>
            <path d="M3 10h18"/>
            <path d="M5 6l7-3 7 3"/>
            <path d="M4 10v11"/>
            <path d="M20 10v11"/>
            <path d="M8 14v4"/>
            <path d="M12 14v4"/>
            <path d="M16 14v4"/>
          </svg>
        </div>

        <div className="header-title-group">
          <div className="status-badges">
            <div className="kiosk-online-badge">
              <span className="online-dot" />
              <span>{t.kioskOnline}</span>
            </div>
            <div className="hardware-specs-badge">
              {t.hardwareSpec}
            </div>
          </div>

          <h1 className="header-main-title">
            <span>{t.kioskTitle}</span>
            <span className="title-separator">|</span>
            <span className="header-sub-title">{t.kioskSubtitle}</span>
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="header-actions">
        {/* Listen Audio Guide Button */}
        <button
          className={`btn-listen ${isSpeaking ? 'active' : ''}`}
          onClick={() => {
            playKioskClick();
            onListenClick();
          }}
          title="Listen to instructions (Keyboard: L)"
        >
          <Volume2 size={18} />
          <span>{isSpeaking ? t.listeningNow : t.listenBtn}</span>
        </button>

        {/* Bilingual Switcher */}
        <div className="lang-switcher">
          <button
            className={`lang-btn ${lang === 'hi' ? 'active' : ''}`}
            onClick={() => {
              playKioskClick();
              onLanguageChange('hi');
            }}
          >
            हिंदी
          </button>
          <button
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => {
              playKioskClick();
              onLanguageChange('en');
            }}
          >
            English
          </button>
        </div>

        {/* Help Circle Button */}
        <button
          className="btn-help"
          onClick={() => {
            playKioskClick();
            onHelpClick();
          }}
          title="Kiosk Guide / Help (Keyboard: H)"
        >
          <HelpCircle size={20} />
        </button>
      </div>
    </header>
  );
};
