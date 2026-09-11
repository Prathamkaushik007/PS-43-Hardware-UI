import React from 'react';
import { translations } from '../data/translations';
import type { Language } from '../data/translations';

interface FeaturesBarProps {
  lang: Language;
}

export const FeaturesBar: React.FC<FeaturesBarProps> = ({ lang }) => {
  const t = translations[lang];

  return (
    <div className="features-bar-container">
      <div className="features-bar">
        <div className="feature-item">
          <span>✅</span>
          <span>{t.noTyping}</span>
        </div>

        <span className="feature-divider">•</span>

        <div className="feature-item highlight">
          <span>🗣️</span>
          <span>{t.speakComplaint}</span>
        </div>

        <span className="feature-divider">•</span>

        <div className="feature-item">
          <span>⏱️</span>
          <span>{t.maxDuration}</span>
        </div>
      </div>
    </div>
  );
};
