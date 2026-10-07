import React, { useState } from 'react';
import { X, Clock, Users, ShieldCheck, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { SpaceData } from '../floor/FloorCanvas';
import { api } from '../../lib/api';

interface BookSheetProps {
  space: SpaceData | null;
  selectedDate: string;
  user: any;
  onClose: () => void;
  onSuccess: (booking: any) => void;
}

export const BookSheet: React.FC<BookSheetProps> = ({
  space,
  selectedDate,
  user,
  onClose,
  onSuccess,
}) => {
  const [startHour, setStartHour] = useState(10);
  const [startMinute, setStartMinute] = useState(0);
  const [durationHours, setDurationHours] = useState(2);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!space) return null;

  // Calculate times
  const start = new Date(`${selectedDate}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00.000Z`);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

  // Check if member's pass covers this space
  const isPassCovered = user?.activePass && (
    (user.activePass.plan === 'hot_desk_monthly' && space.type === 'desk') ||
    (user.activePass.plan === 'day_pass' && space.type === 'desk') ||
    (user.activePass.plan === 'dedicated_desk')
  );

  const rawPrice = durationHours * space.hourlyRate;
  const finalPrice = isPassCovered ? 0 : rawPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const idempotencyKey = `idem_${user?.id || 'guest'}_${Date.now()}`;

    try {
      const booking = await api.bookings.create(
        {
          resource: space.id,
          start: start.toISOString(),
          end: end.toISOString(),
          notes: space.requiresApproval ? 'Approval requested' : 'Direct reservation',
        },
        idempotencyKey
      );

      // If guest invitation requested
      if (guestName.trim() && guestEmail.trim()) {
        try {
          await api.guests.invite({
            bookingId: booking._id,
            name: guestName.trim(),
            email: guestEmail.trim(),
          });
        } catch (gErr: any) {
          console.warn('Guest invite error:', gErr.message);
        }
      }

      onSuccess(booking);
    } catch (err: any) {
      if (err.code === 'SLOT_TAKEN') {
        setErrorMessage('This slot was just taken by another member. Please choose another time.');
      } else {
        setErrorMessage(err.message || 'Failed to complete booking');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-surface/80 border-l border-ink-hairline/50 shadow-glass-dark backdrop-blur-glass flex flex-col justify-between transition-all animate-in slide-in-from-right duration-300 ease-out">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between p-6 border-b border-ink-hairline/50 bg-surface/30 backdrop-blur-md">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-ink-muted px-2 py-0.5 rounded-md bg-ink-muted/10">
              {space.location} · Floor {space.floor}
            </span>
            <h2 className="font-sans font-bold text-3xl text-ink tracking-tight mt-2">
              {space.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-ink-muted/10 hover:text-accent transition-all group"
          >
            <X className="w-5 h-5 text-ink-muted group-hover:text-accent group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {errorMessage && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium shadow-sm backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Time Strip Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
              Reservation Window ({selectedDate})
            </label>

            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wide">Start Hour</span>
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                  className="w-full mt-1.5 p-3 rounded-xl bg-surface/50 border border-ink-hairline/50 font-medium text-sm text-ink backdrop-blur-sm transition-all focus:ring-2 focus:ring-accent/50 focus:border-accent/50 outline-none hover:shadow-sm"
                >
                  {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((h) => (
                    <option key={h} value={h}>
                      {h % 12 === 0 ? 12 : h % 12}:00 {h >= 12 ? 'PM' : 'AM'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="group">
                <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wide">Duration</span>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full mt-1.5 p-3 rounded-xl bg-surface/50 border border-ink-hairline/50 font-medium text-sm text-ink backdrop-blur-sm transition-all focus:ring-2 focus:ring-accent/50 focus:border-accent/50 outline-none hover:shadow-sm"
                >
                  <option value={0.5}>30 mins</option>
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={8}>Full Day</option>
                </select>
              </div>
            </div>
          </div>

          {/* Guest Invitation Section */}
          {space.capacity > 1 && (
            <div className="space-y-4 pt-4 border-t border-ink-hairline/30">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
                <Users className="w-4 h-4 text-accent" />
                Invite Guest
              </label>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Guest Full Name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl bg-surface/50 border border-ink-hairline/50 font-medium text-ink placeholder:text-ink-muted/50 backdrop-blur-sm transition-all focus:ring-2 focus:ring-accent/50 focus:border-accent/50 outline-none hover:shadow-sm"
                />
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl bg-surface/50 border border-ink-hairline/50 font-medium text-ink placeholder:text-ink-muted/50 backdrop-blur-sm transition-all focus:ring-2 focus:ring-accent/50 focus:border-accent/50 outline-none hover:shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Pricing & Benefit Summary */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-surface/60 to-surface/30 backdrop-blur-md border border-white/20 shadow-glass space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="flex items-center justify-between text-sm font-medium relative z-10">
              <span className="text-ink-muted">Hourly Rate</span>
              <span>₹{space.hourlyRate}/hr</span>
            </div>

            {isPassCovered && (
              <div className="flex items-center justify-between text-sm font-medium text-accent relative z-10">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Pass Benefit ({user.activePass.plan.replace('_', ' ')})
                </span>
                <span>-₹{rawPrice.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-ink-hairline/30 flex items-baseline justify-between relative z-10">
              <span className="font-bold text-xs uppercase tracking-wider text-ink-muted">Total Due</span>
              <span className="font-sans font-bold text-4xl text-ink tracking-tight">
                ₹{finalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </form>
      </div>

      {/* Footer Confirm Action */}
      <div className="p-6 border-t border-ink-hairline/50 bg-surface/80 backdrop-blur-glass">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl bg-accent hover:bg-indigo-500 text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {isSubmitting ? (
            <span className="animate-pulse">Reserving Slot...</span>
          ) : space.requiresApproval ? (
            <>Request Approval <ArrowRight className="w-4 h-4" /></>
          ) : (
            <>Confirm Reservation <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
};
