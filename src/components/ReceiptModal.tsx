import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Printer, RotateCcw, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { translations } from '../data/translations';
import type { Language } from '../data/translations';
import type { GrievanceTicket } from '../utils/aiClassifier';
import { playKioskClick, playSuccessChime, speakText } from '../utils/audioSystem';

import type { CloudStorageMeta } from '../utils/grievanceStorage';

interface ReceiptModalProps {
  lang: Language;
  ticket: GrievanceTicket;
  onClose: () => void;
  uploadMeta?: CloudStorageMeta;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  lang,
  ticket,
  onClose,
  uploadMeta,
}) => {
  const t = translations[lang];
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [secondsToReturn, setSecondsToReturn] = useState<number>(20);

  // Trigger celebration chime, confetti, and spoken announcement
  useEffect(() => {
    playSuccessChime();

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    // Audio announcement
    speakText(t.submittedTTS, lang);

    // Auto-return timer
    const interval = setInterval(() => {
      setSecondsToReturn(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Draw clean QR code representation on Canvas
  useEffect(() => {
    if (!qrCanvasRef.current) return;
    const canvas = qrCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 96;
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Draw stylized QR pattern based on ticket ID
    ctx.fillStyle = '#0f172a';
    const grid = 12;
    const cellSize = size / grid;

    // Corner finder patterns
    function drawFinder(r: number, c: number) {
      if (!ctx) return;
      ctx.fillRect(c * cellSize, r * cellSize, cellSize * 3, cellSize * 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect((c + 0.5) * cellSize, (r + 0.5) * cellSize, cellSize * 2, cellSize * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect((c + 1) * cellSize, (r + 1) * cellSize, cellSize, cellSize);
    }

    drawFinder(0, 0);
    drawFinder(0, grid - 3);
    drawFinder(grid - 3, 0);

    // Random pseudo-deterministic dots based on ticket numbers
    const seed = ticket.ticketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        if (
          (r < 4 && c < 4) ||
          (r < 4 && c >= grid - 4) ||
          (r >= grid - 4 && c < 4)
        ) {
          continue;
        }
        if (((r * 7 + c * 13 + seed) % 5) === 0) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize - 1, cellSize - 1);
        }
      }
    }
  }, [ticket]);

  const handlePrint = () => {
    playKioskClick();
    window.print();
  };

  return (
    <div className="studio-overlay">
      <div className="receipt-container">
        {/* Header */}
        <div className="receipt-header">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 800, fontSize: '15px' }}>
            <CheckCircle2 size={20} />
            <span>{t.ticketSuccess}</span>
          </div>
          <h2 className="receipt-title">Public Grievance Acknowledgement</h2>
          <p style={{ fontSize: '12px', color: '#64748b' }}>
            {ticket.kioskLocation} • {ticket.createdAt}
          </p>

          <div className="receipt-ticket-id">
            {ticket.ticketId}
          </div>
        </div>

        {/* Structured Grievance Data */}
        <div className="receipt-grid">
          <div>
            <div className="receipt-label">{t.categoryLabel}</div>
            <div className="receipt-val">{ticket.category}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>{ticket.subcategory}</div>
          </div>

          <div>
            <div className="receipt-label">{t.urgencyLabel}</div>
            <div>
              <span className={`priority-badge-pill priority-${ticket.priority}`}>
                {ticket.priority} URGENCY
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Est. Resolution: ~{ticket.estimatedResolutionDays} days
            </div>
          </div>

          <div className="receipt-item-full">
            <div className="receipt-label">{t.departmentLabel}</div>
            <div className="receipt-val" style={{ color: '#1e293b' }}>
              {ticket.department}
            </div>
          </div>

          <div className="receipt-item-full">
            <div className="receipt-label">{t.summaryLabel}</div>
            <div style={{ fontSize: '13px', color: '#334155', fontStyle: 'italic', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px' }}>
              "{ticket.summary}"
            </div>
          </div>

          {ticket.mediaType === 'VIDEO' && (
            <div className="receipt-item-full" style={{ marginTop: '2px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                background: uploadMeta?.uploaded ? '#ecfdf5' : '#fffbeb',
                border: `1px solid ${uploadMeta?.uploaded ? '#a7f3d0' : '#fde68a'}`,
                color: uploadMeta?.uploaded ? '#065f46' : '#92400e'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{uploadMeta?.uploaded ? '☁️ Cloudflare R2' : '💾 Local Storage'}</span>
                  <span style={{ fontWeight: 700 }}>
                    {uploadMeta?.uploaded ? 'Cloud Video Synced' : 'Saved Locally (Offline fallback)'}
                  </span>
                </div>
                {uploadMeta?.r2Key && (
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', opacity: 0.85, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {uploadMeta.r2Key}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* QR Code and verification bar */}
        <div className="receipt-qr-section">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
              <ShieldCheck size={16} color="#2563eb" />
              <span>Digital Grievance Token</span>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', maxWidth: '280px', marginTop: '4px' }}>
              {t.scanTrackQR}
            </p>
          </div>

          <canvas ref={qrCanvasRef} style={{ width: '84px', height: '84px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '3px', background: '#ffffff' }} />
        </div>

        {/* Action Buttons */}
        <div className="receipt-actions">
          <button className="btn-receipt-print" onClick={handlePrint}>
            <Printer size={18} />
            <span>{t.printReceipt}</span>
          </button>

          <button
            className="btn-receipt-close"
            onClick={() => {
              playKioskClick();
              onClose();
            }}
          >
            <RotateCcw size={18} />
            <span>{t.newComplaint}</span>
          </button>
        </div>

        <div className="auto-timer-pill">
          {t.autoReturnNotice} {secondsToReturn}s
        </div>
      </div>
    </div>
  );
};
