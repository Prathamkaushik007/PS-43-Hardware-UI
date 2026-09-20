import React from 'react';
import { HelpCircle, X, Camera, Mic, Volume2, KeyRound } from 'lucide-react';
import type { Language } from '../data/translations';
import { playKioskClick } from '../utils/audioSystem';

interface HelpModalProps {
  lang: Language;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ lang, onClose }) => {
  const isHi = lang === 'hi';

  return (
    <div className="studio-overlay">
      <div className="help-card">
        <div className="help-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 800, fontSize: '18px' }}>
            <HelpCircle size={24} />
            <span>{isHi ? 'कियोस्क सहायता मार्गदर्शिका' : 'Kiosk Citizen Help Guide'}</span>
          </div>
          <button
            onClick={() => {
              playKioskClick();
              onClose();
            }}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        <div className="help-grid">
          <div className="help-step-box">
            <div className="step-num">{isHi ? 'कदम 1: चयन करें' : 'Step 1: Choose Option'}</div>
            <div className="step-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Camera size={16} color="#e11d48" />
              <span>{isHi ? 'वीडियो या ऑडियो' : 'Video or Voice'}</span>
            </div>
            <div className="step-desc">
              {isHi
                ? 'स्क्रीन पर बड़े लाल (वीडियो) या नीले (ऑडियो) बटन को दबाएं। किसी भी प्रकार की टाइपिंग आवश्यक नहीं है।'
                : 'Press either the large Red (Video) or Blue (Audio) card. No typing or literacy barrier required.'}
            </div>
          </div>

          <div className="help-step-box">
            <div className="step-num">{isHi ? 'कदम 2: बोलें' : 'Step 2: Speak Clearly'}</div>
            <div className="step-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mic size={16} color="#2563eb" />
              <span>{isHi ? 'अपनी समस्या बताएं' : 'Explain Your Problem'}</span>
            </div>
            <div className="step-desc">
              {isHi
                ? 'कैमरे या माइक के सामने स्पष्ट भाषा (हिंदी या अंग्रेजी) में समस्या, स्थान और मुख्य शिकायत बताएं (अधिकतम 5 मिनट)।'
                : 'State your issue, street/ward location, and details clearly in Hindi or English (maximum 5 minutes).'}
            </div>
          </div>

          <div className="help-step-box">
            <div className="step-num">{isHi ? 'कदम 3: एआई विश्लेषण' : 'Step 3: AI Processing'}</div>
            <div className="step-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={16} color="#10b981" />
              <span>{isHi ? 'स्वचालित वर्गीकरण' : 'Gemini AI Triage'}</span>
            </div>
            <div className="step-desc">
              {isHi
                ? 'जेमिनी एआई आपकी आवाज़ का विश्लेषण कर उचित विभाग और प्राथमिकता निर्धारित करता है।'
                : 'Smart Gemini AI categorizes your issue, determines urgency, and routes it to the designated department.'}
            </div>
          </div>

          <div className="help-step-box">
            <div className="step-num">{isHi ? 'कदम 4: रसीद' : 'Step 4: Ticket & Receipt'}</div>
            <div className="step-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={16} color="#f59e0b" />
              <span>{isHi ? 'ट्रैकिंग संख्या प्राप्त करें' : 'Get Tracking Token'}</span>
            </div>
            <div className="step-desc">
              {isHi
                ? 'अपनी शिकायत की पावती रसीद प्रिंट करें या मोबाइल से क्यूआर कोड स्कैन कर स्थिति जांचें।'
                : 'Collect your printed acknowledgement slip or scan the QR code to track resolution progress.'}
            </div>
          </div>
        </div>

        {/* Hardware Keypad Guide */}
        <div className="help-shortcuts-box" style={{ borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
            ⌨️ {isHi ? 'कियोस्क भौतिक कीपैड शॉर्टकट:' : 'Kiosk Hardware Keypad Shortcuts:'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#94a3b8' }}>
            <div><span className="footer-key-badge">V</span> or <span className="footer-key-badge">1</span> : Video</div>
            <div><span className="footer-key-badge">A</span> or <span className="footer-key-badge">2</span> : Audio</div>
            <div><span className="footer-key-badge">S</span> : Stop</div>
            <div><span className="footer-key-badge">C</span> or <span className="footer-key-badge">Esc</span> : Cancel</div>
            <div><span className="footer-key-badge">L</span> : Listen Guide</div>
            <div><span className="footer-key-badge">H</span> : Help</div>
            <div><span className="footer-key-badge">D</span> : Theme Toggle</div>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              playKioskClick();
              onClose();
            }}
            className="btn-ctrl btn-ctrl-submit"
            style={{ padding: '10px 24px', fontSize: '14px' }}
          >
            {isHi ? 'समझ गया / बंद करें' : 'Got it / Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
