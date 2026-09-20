import React, { useState, useEffect } from 'react';
import { Database, X, Trash2, Download, Video, Mic, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import type { Language } from '../data/translations';
import { playKioskClick } from '../utils/audioSystem';
import {
  getAllStoredGrievances,
  deleteStoredGrievance,
  clearAllStoredGrievances,
  exportGrievancesAsJSON,
  type StoredGrievance
} from '../utils/grievanceStorage';

interface RecordsModalProps {
  lang: Language;
  onClose: () => void;
}

export const RecordsModal: React.FC<RecordsModalProps> = ({
  lang,
  onClose,
}) => {
  const isHi = lang === 'hi';
  const [records, setRecords] = useState<StoredGrievance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activePlayback, setActivePlayback] = useState<{ id: string; url: string; type: 'VIDEO' | 'AUDIO' } | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await getAllStoredGrievances();
      setRecords(data);
    } catch (e) {
      console.error('Error loading grievances:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleDelete = async (ticketId: string) => {
    playKioskClick();
    if (confirm(isHi ? 'क्या आप इस शिकायत को हटाना चाहते हैं?' : 'Are you sure you want to delete this grievance record?')) {
      await deleteStoredGrievance(ticketId);
      if (activePlayback?.id === ticketId) setActivePlayback(null);
      await loadRecords();
    }
  };

  const handleClearAll = async () => {
    playKioskClick();
    if (confirm(isHi ? 'क्या आप सभी स्थानीय शिकायतों को हटाना चाहते हैं?' : 'Clear all local database grievance records?')) {
      await clearAllStoredGrievances();
      setActivePlayback(null);
      await loadRecords();
    }
  };

  const handleExport = async () => {
    playKioskClick();
    await exportGrievancesAsJSON();
  };

  return (
    <div className="studio-overlay">
      <div className="help-card" style={{ maxWidth: '820px', width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="help-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', fontWeight: 800, fontSize: '18px' }}>
            <Database size={24} />
            <span>{isHi ? 'स्थानीय डेटाबेस - शिकायत रिकॉर्ड' : 'Local Database - Grievance Records'}</span>
            <span style={{ fontSize: '12px', background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
              {records.length} {isHi ? 'दर्ज' : 'Stored'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {records.length > 0 && (
              <>
                <button
                  onClick={handleExport}
                  title="Export records as JSON"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                >
                  <Download size={14} />
                  <span>{isHi ? 'एक्सपोर्ट' : 'Export JSON'}</span>
                </button>

                <button
                  onClick={handleClearAll}
                  title="Clear all records"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(225, 29, 72, 0.15)', border: '1px solid rgba(225, 29, 72, 0.4)', color: '#fb7185', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                >
                  <Trash2 size={14} />
                  <span>{isHi ? 'साफ़ करें' : 'Clear All'}</span>
                </button>
              </>
            )}

            <button
              onClick={() => {
                playKioskClick();
                onClose();
              }}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', marginLeft: '6px' }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Media Preview Box (if user clicked to view/hear media) */}
        {activePlayback && (
          <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #38bdf8', borderRadius: '14px', padding: '14px', margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
              <span>▶️ {isHi ? 'रिकॉर्डिंग पूर्वावलोकन:' : 'Media Playback:'} {activePlayback.id}</span>
              <button
                onClick={() => setActivePlayback(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
              >
                ✕ {isHi ? 'बंद करें' : 'Close Player'}
              </button>
            </div>
            {activePlayback.type === 'VIDEO' ? (
              <video src={activePlayback.url} controls autoPlay style={{ width: '100%', maxHeight: '220px', borderRadius: '8px', background: '#000000' }} />
            ) : (
              <audio src={activePlayback.url} controls autoPlay style={{ width: '100%' }} />
            )}
          </div>
        )}

        {/* Records List Container */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <RefreshCw size={24} className="pulse-dot" style={{ margin: '0 auto 10px' }} />
              <p>{isHi ? 'स्थानीय डेटाबेस लोड हो रहा है...' : 'Loading local database records...'}</p>
            </div>
          ) : records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
              <AlertCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                {isHi ? 'कोई सहेजी गई शिकायत नहीं मिली' : 'No Local Grievances Found'}
              </p>
              <p style={{ fontSize: '13px', marginTop: '6px' }}>
                {isHi ? 'कियोस्क पर दर्ज की गई नई शिकायतें स्वचालित रूप से इस स्थानीय डेटाबेस (IndexedDB) में सुरक्षित रखी जाती हैं।' : 'New complaints submitted at this kiosk are automatically stored in this offline LocalDB (IndexedDB).'}
              </p>
            </div>
          ) : (
            records.map((rec) => (
              <div
                key={rec.ticketId}
                style={{
                  background: 'rgba(30, 41, 59, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Card Top Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#38bdf8', fontSize: '15px' }}>
                      {rec.ticketId}
                    </span>
                    <span className={`priority-badge-pill priority-${rec.priority}`}>
                      {rec.priority}
                    </span>
                    <span style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '12px', color: '#cbd5e1' }}>
                      {rec.mediaType === 'VIDEO' ? <Video size={12} color="#f43f5e" /> : <Mic size={12} color="#38bdf8" />}
                      <span>{rec.mediaType}</span>
                    </span>
                    {rec.mediaType === 'VIDEO' && (
                      rec.uploaded ? (
                        <span
                          title={`Cloudflare R2 Key: ${rec.r2Key || 'uploaded'}`}
                          style={{
                            fontSize: '11px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            color: '#34d399',
                            fontWeight: 600,
                          }}
                        >
                          ☁️ R2 Synced
                        </span>
                      ) : (
                        <span
                          title={rec.uploadError || 'Stored in local IndexedDB only'}
                          style={{
                            fontSize: '11px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            color: '#fbbf24',
                            fontWeight: 600,
                          }}
                        >
                          💾 Local Only
                        </span>
                      )
                    )}
                  </div>

                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {rec.createdAt}
                  </div>
                </div>

                {/* Category & Department */}
                <div style={{ fontSize: '13px' }}>
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>{rec.category}</span>
                  {rec.subcategory && <span style={{ color: '#94a3b8' }}> • {rec.subcategory}</span>}
                  <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '2px' }}>🏛️ {rec.department}</div>
                </div>

                {/* Citizen Transcript Snippet */}
                {rec.citizenTranscript && (
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>{isHi ? 'कथन:' : 'Statement:'} </span>
                    "{rec.citizenTranscript}"
                  </div>
                )}

                {/* Card Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    📍 {rec.kioskLocation}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {rec.mediaBlobUrl && (
                      <button
                        onClick={() => {
                          playKioskClick();
                          setActivePlayback({ id: rec.ticketId, url: rec.mediaBlobUrl!, type: rec.mediaType });
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                      >
                        <Eye size={12} />
                        <span>{isHi ? 'मीडिया देखें' : 'Play Media'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(rec.ticketId)}
                      title="Delete ticket"
                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
          <div>
            💾 {isHi ? 'डेटाबेस प्रकार:' : 'DB Type:'} <strong>IndexedDB (Offline & Persistent)</strong>
          </div>
          <button
            onClick={() => {
              playKioskClick();
              onClose();
            }}
            className="btn-ctrl btn-ctrl-cancel"
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            {isHi ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
