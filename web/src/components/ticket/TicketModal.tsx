import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, CheckCircle2, Sparkles, Share2, Copy, Unlock } from 'lucide-react';
import { api } from '../../lib/api';

interface TicketModalProps {
  booking: any;
  onClose: () => void;
  unlockedEvent?: any;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  booking,
  onClose,
  unlockedEvent,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(
    booking?.status === 'checked_in' || unlockedEvent?.bookingId === booking?._id
  );
  const [isScanning, setIsScanning] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (unlockedEvent && unlockedEvent.bookingId === booking?._id) {
      setIsUnlocked(true);
    }
  }, [unlockedEvent, booking]);

  if (!booking) return null;

  const spaceName = booking.resource?.name || 'Workspace';
  const location = booking.resource?.location || 'Downtown';
  const floor = booking.resource?.floor || 1;
  const qrData = booking.qrToken || `workhub_${booking._id}`;

  const startDate = new Date(booking.start);
  const endDate = new Date(booking.end);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Simulate scanning at turnstile / scanner hardware
  const handleSimulateScan = async () => {
    setIsScanning(true);
    try {
      await api.qr.checkIn(booking._id, booking.qrToken);
      setIsUnlocked(true);
    } catch (err: any) {
      console.warn('Scan trigger error:', err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const publicUrl = `${window.location.origin}/g/${booking.qrToken}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-surface dark:bg-surface-dark border border-ink-hairline dark:border-ink-dark-hairline rounded-xl overflow-hidden shadow-2xl">
        {/* Full-bleed Vermilion Wipe When Unlocked */}
        {isUnlocked && (
          <div className="absolute inset-0 z-30 bg-accent flex flex-col items-center justify-center text-white p-6 animate-in fade-in zoom-in-95 duration-300">
            <CheckCircle2 className="w-16 h-16 mb-4 animate-bounce" />
            <h2 className="font-serif text-4xl text-center font-normal italic">
              {spaceName} Unlocked.
            </h2>
            <p className="font-mono text-xs text-white/90 mt-2 tracking-widest uppercase">
              Turnstile access verified · Welcome to WorkHub
            </p>
            <button
              onClick={() => setIsUnlocked(false)}
              className="mt-8 px-6 py-2.5 rounded bg-white text-accent font-mono text-xs uppercase tracking-wider font-semibold shadow hover:bg-white/90 transition-all"
            >
              View Ticket Details
            </button>
          </div>
        )}

        {/* Boarding Pass Header */}
        <div className="p-6 bg-paper dark:bg-paper-dark border-b border-ink-hairline dark:border-ink-dark-hairline flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-accent font-semibold">
              WorkHub Access Ticket
            </span>
            <h3 className="font-serif text-2xl font-normal text-ink dark:text-ink-dark mt-0.5">
              {spaceName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-surface dark:hover:bg-surface-dark text-ink-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Perforation Tear Effect */}
        <div className="relative py-2 bg-surface dark:bg-surface-dark ticket-tear">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-ink/60" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-ink/60" />
        </div>

        {/* High-Contrast QR Code Area */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-white rounded-lg shadow-sm border border-ink-hairline">
            <QRCodeSVG
              value={qrData}
              size={180}
              level="H"
              includeMargin={false}
              fgColor="#17160F"
            />
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-mono text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider">
              {location} · Floor {floor}
            </p>
            <p className="font-mono text-xs font-semibold text-ink dark:text-ink-dark">
              {startDate.toISOString().slice(0, 10)} · {formatTime(startDate)} – {formatTime(endDate)}
            </p>
          </div>

          {/* Quick Scanner Action Demo Button */}
          <div className="w-full pt-2 flex flex-col gap-2">
            <button
              onClick={handleSimulateScan}
              disabled={isScanning}
              className="w-full py-2.5 rounded bg-accent hover:bg-accent-hover text-white font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Simulate Reception Scan</span>
            </button>

            <button
              onClick={copyShareLink}
              className="w-full py-2 rounded bg-paper dark:bg-paper-dark border border-ink-hairline dark:border-ink-dark-hairline text-ink dark:text-ink-dark font-mono text-xs flex items-center justify-center gap-1.5 hover:bg-surface dark:hover:bg-surface-dark transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied' : 'Share Guest Pass Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
