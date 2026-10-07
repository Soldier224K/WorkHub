import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, MapPin, Calendar, Clock, User, Building, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';

interface PublicGuestPassProps {
  token: string;
  onBackToApp?: () => void;
}

export const PublicGuestPass: React.FC<PublicGuestPassProps> = ({ token, onBackToApp }) => {
  const [passData, setPassData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPass = async () => {
      try {
        const data = await api.guests.getPublicPass(token);
        setPassData(data);
      } catch (err: any) {
        setError(err.message || 'Invalid or expired guest pass token');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPass();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-ink font-mono text-xs">
        <p className="animate-pulse">Loading verified WorkHub guest pass...</p>
      </div>
    );
  }

  if (error || !passData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-paper text-center">
        <h2 className="font-serif text-3xl text-accent mb-2">Guest Pass Not Found</h2>
        <p className="font-mono text-xs text-ink-muted max-w-sm mb-6">{error}</p>
        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="px-4 py-2 rounded bg-ink text-paper font-mono text-xs"
          >
            Return to WorkHub
          </button>
        )}
      </div>
    );
  }

  const { guest, host, booking } = passData;
  const startDate = new Date(booking.start);
  const endDate = new Date(booking.end);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `Hello ${guest.name}, here is your WorkHub guest pass for ${booking.spaceName} at ${booking.location}: ${window.location.href}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark selection:bg-accent selection:text-white">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <span className="font-serif text-2xl tracking-tight font-normal text-ink dark:text-ink-dark">
          WorkHub
        </span>
        <p className="text-[10px] font-mono tracking-widest uppercase text-ink-muted mt-0.5">
          Official Guest Access Pass
        </p>
      </div>

      {/* Boarding Pass Card */}
      <div className="w-full max-w-sm bg-surface dark:bg-surface-dark border border-ink-hairline dark:border-ink-dark-hairline rounded-xl shadow-xl overflow-hidden">
        {/* Card Header */}
        <div className="p-6 bg-paper dark:bg-paper-dark border-b border-ink-hairline dark:border-ink-dark-hairline">
          <span className="text-[10px] font-mono tracking-widest uppercase text-accent font-semibold">
            {booking.location} · Floor {booking.floor}
          </span>
          <h1 className="font-serif text-3xl font-normal mt-0.5 text-ink dark:text-ink-dark">
            {booking.spaceName}
          </h1>
          <p className="font-mono text-xs text-ink-muted mt-1">
            Invited by <strong className="text-ink dark:text-ink-dark font-medium">{host.name}</strong> ({host.company || 'Host'})
          </p>
        </div>

        {/* Perforation Line */}
        <div className="relative py-2 bg-surface dark:bg-surface-dark ticket-tear">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-paper dark:bg-paper-dark" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-paper dark:bg-paper-dark" />
        </div>

        {/* QR Section */}
        <div className="p-6 flex flex-col items-center text-center space-y-5">
          <div className="p-4 bg-white rounded-lg shadow-sm border border-ink-hairline">
            <QRCodeSVG
              value={passData.qrToken}
              size={190}
              level="H"
              includeMargin={false}
              fgColor="#17160F"
            />
          </div>

          <div className="space-y-1.5 w-full text-left bg-paper dark:bg-paper-dark p-3 rounded border border-ink-hairline dark:border-ink-dark-hairline text-xs font-mono">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-accent" />
              <span>Guest: <strong className="font-medium text-ink dark:text-ink-dark">{guest.name}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>{startDate.toISOString().slice(0, 10)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>{formatTime(startDate)} – {formatTime(endDate)}</span>
            </div>
          </div>

          <button
            onClick={handleShareWhatsApp}
            className="w-full py-2.5 rounded bg-accent hover:bg-accent-hover text-white font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4" />
            <span>Share via WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
