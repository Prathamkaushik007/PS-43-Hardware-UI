import { Volume2, HelpCircle, Sun, Moon, Database } from 'lucide-react';
import { translations } from '../data/translations';
import type { Language } from '../data/translations';
import { playKioskClick } from '../utils/audioSystem';

export type Theme = 'dark' | 'light';

interface HeaderProps {
  lang: Language;
  onLanguageChange: (newLang: Language) => void;
  onListenClick: () => void;
  isSpeaking: boolean;
  onHelpClick: () => void;
  theme: Theme;
  onThemeToggle: () => void;
  onRecordsClick: () => void;
  recordsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onLanguageChange,
  onListenClick,
  isSpeaking,
  onHelpClick,
  theme,
  onThemeToggle,
  onRecordsClick,
  recordsCount = 0,
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

        {/* Theme Switcher Button (Black / White mode with smooth Moon/Sun transition) */}
        <button
          className={`btn-theme-toggle ${theme}`}
          onClick={() => {
            playKioskClick();
            onThemeToggle();
          }}
          title={theme === 'dark' ? 'Switch to White Theme (Light Mode) [Key: D]' : 'Switch to Black Theme (Dark Mode) [Key: D]'}
          aria-label={theme === 'dark' ? 'Switch to White Theme' : 'Switch to Black Theme'}
        >
          <div className="theme-icon-box">
            <Sun className="theme-svg sun-svg" size={20} />
            <Moon className="theme-svg moon-svg" size={20} />
          </div>
        </button>

        {/* Local Database Records Button */}
        <button
          className="btn-records"
          onClick={() => {
            playKioskClick();
            onRecordsClick();
          }}
          title={lang === 'hi' ? 'स्थानीय डेटाबेस - दर्ज शिकायतें [Key: R]' : 'Local Database - Stored Grievances [Key: R]'}
        >
          <Database size={16} />
          <span>{recordsCount > 0 ? `${recordsCount}` : 'DB'}</span>
        </button>

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
