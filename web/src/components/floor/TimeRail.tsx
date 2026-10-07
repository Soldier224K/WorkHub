import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface TimeRailProps {
  currentSlotIndex: number;
  totalSlots: number;
  openHour: number;
  slotMinutes: number;
  selectedDate: string;
  freeCount: number;
  totalCount: number;
  onSlotChange: (index: number) => void;
  onDateChange: (date: string) => void;
}

export const TimeRail: React.FC<TimeRailProps> = ({
  currentSlotIndex,
  totalSlots,
  openHour,
  slotMinutes,
  selectedDate,
  freeCount,
  totalCount,
  onSlotChange,
  onDateChange,
}) => {
  // Format current scrub time
  const currentMinutesFromOpen = currentSlotIndex * slotMinutes;
  const currentHour = openHour + Math.floor(currentMinutesFromOpen / 60);
  const currentMinute = currentMinutesFromOpen % 60;

  const period = currentHour >= 12 ? 'PM' : 'AM';
  const displayHour = currentHour % 12 === 0 ? 12 : currentHour % 12;
  const formattedTime = `${displayHour}:${String(currentMinute).padStart(2, '0')} ${period}`;

  // Date helpers
  const handleShiftDay = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    onDateChange(d.toISOString().slice(0, 10));
  };

  const isToday = new Date().toISOString().slice(0, 10) === selectedDate;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-6">
      <div className="bg-surface/70 backdrop-blur-glass border border-white/20 dark:border-ink-hairline/20 rounded-3xl p-5 shadow-glass-dark transition-all">
        {/* Editorial Headline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink-hairline/30">
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-bold text-3xl sm:text-4xl text-ink tracking-tight drop-shadow-sm">
              <span className="text-accent pr-1">{freeCount}</span>
              <span className="text-ink-muted text-2xl font-medium">/ {totalCount}</span>
            </span>
            <span className="text-ink-muted text-sm font-medium pl-2">
              workspaces free at <span className="font-mono text-ink font-bold px-2 py-1 rounded-md bg-surface/50 border border-ink-hairline/50 ml-1 shadow-sm">{formattedTime}</span>
            </span>
          </div>

          {/* Date Selector Navigation */}
          <div className="flex items-center gap-2 self-end sm:self-auto bg-surface/50 rounded-xl p-1 border border-ink-hairline/50 shadow-sm backdrop-blur-sm">
            <button
              onClick={() => handleShiftDay(-1)}
              className="p-1.5 rounded-lg hover:bg-surface hover:shadow-sm text-ink-muted hover:text-ink transition-all"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-ink">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>{isToday ? 'Today, ' : ''}{selectedDate}</span>
            </div>

            <button
              onClick={() => handleShiftDay(1)}
              className="p-1.5 rounded-lg hover:bg-surface hover:shadow-sm text-ink-muted hover:text-ink transition-all"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Scrub Slider Rail */}
        <div className="pt-5 px-2">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={Math.max(0, totalSlots - 1)}
              value={currentSlotIndex}
              onChange={(e) => onSlotChange(Number(e.target.value))}
              className="w-full h-2 bg-ink-hairline/50 rounded-full appearance-none cursor-pointer accent-accent shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          {/* Hour Marks */}
          <div className="flex justify-between text-[10px] font-bold tracking-wider uppercase text-ink-muted/80 mt-3 select-none">
            <span>8:00 AM</span>
            <span>10:00 AM</span>
            <span>12:00 PM</span>
            <span>2:00 PM</span>
            <span>4:00 PM</span>
            <span>6:00 PM</span>
            <span>8:00 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
