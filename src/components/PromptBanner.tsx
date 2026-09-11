import React from 'react';
import { Megaphone } from 'lucide-react';

interface PromptBannerProps {
  text: string;
}

export const PromptBanner: React.FC<PromptBannerProps> = ({ text }) => {
  return (
    <div className="prompt-container">
      <div className="prompt-pill">
        <Megaphone size={20} color="#f59e0b" />
        <span>{text}</span>
      </div>
    </div>
  );
};
