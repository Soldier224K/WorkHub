import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Calendar, ArrowRight, CornerDownLeft, Shield, Ticket } from 'lucide-react';
import { parseCommand } from '../../lib/parseCommand';
import { SpaceData } from '../floor/FloorCanvas';

interface CommandBarProps {
  isOpen: boolean;
  spaces: SpaceData[];
  onClose: () => void;
  onSelectSpace: (space: SpaceData) => void;
  onOpenTicket: () => void;
  onOpenManager: () => void;
  onInstantBook: (space: SpaceData, start: Date, end: Date) => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  spaces,
  onClose,
  onSelectSpace,
  onOpenTicket,
  onOpenManager,
  onInstantBook,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const parsed = parseCommand(query);

  // Match target space
  const matchedSpace = parsed.spaceQuery
    ? spaces.find((s) => s.name.toLowerCase().replace(/\s+/g, '') === parsed.spaceQuery?.toLowerCase().replace(/\s+/g, '')) ||
      spaces.find((s) => s.name.toLowerCase().includes(parsed.spaceQuery?.toLowerCase() || ''))
    : null;

  const handleExecute = () => {
    if (parsed.action === 'checkin') {
      onOpenTicket();
      onClose();
      return;
    }
    if (parsed.action === 'pass') {
      onOpenTicket();
      onClose();
      return;
    }
    if (matchedSpace && parsed.start && parsed.end) {
      onInstantBook(matchedSpace, parsed.start, parsed.end);
      onClose();
      return;
    }
    if (matchedSpace) {
      onSelectSpace(matchedSpace);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-ink/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-surface dark:bg-surface-dark border border-ink-hairline dark:border-ink-dark-hairline rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-ink-hairline dark:border-ink-dark-hairline">
          <Search className="w-4 h-4 text-ink-muted mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type 'A12 tomorrow 2-5' or search desks, check-in, pass..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleExecute();
              }
            }}
            className="w-full bg-transparent text-sm font-mono text-ink dark:text-ink-dark placeholder:text-ink-muted focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-ink-muted bg-paper dark:bg-paper-dark border border-ink-hairline rounded">
            ESC
          </kbd>
        </div>

        {/* Live Parsed Natural Booking Preview */}
        {matchedSpace && parsed.start && parsed.end && (
          <div className="p-4 bg-paper dark:bg-paper-dark border-b border-ink-hairline dark:border-ink-dark-hairline flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Natural Booking Preview
              </span>
              <p className="font-mono text-xs text-ink dark:text-ink-dark">
                Reserve <strong>{matchedSpace.name}</strong> on {parsed.start.toLocaleDateString([], { month: 'short', day: 'numeric' })} from {parsed.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} to {parsed.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
            <button
              onClick={handleExecute}
              className="px-3 py-1.5 rounded bg-accent hover:bg-accent-hover text-white font-mono text-xs flex items-center gap-1.5 shadow-sm"
            >
              <span>Book Now</span>
              <CornerDownLeft className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Suggestion Commands List */}
        <div className="p-2 space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
          <div
            onClick={() => { onOpenTicket(); onClose(); }}
            className="flex items-center justify-between px-3 py-2 rounded hover:bg-paper dark:hover:bg-paper-dark cursor-pointer text-ink dark:text-ink-dark transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Ticket className="w-4 h-4 text-accent" />
              <span>Show My Access Ticket (QR Check-in)</span>
            </div>
            <span className="text-[10px] text-ink-muted">check-in</span>
          </div>

          <div
            onClick={() => { onOpenManager(); onClose(); }}
            className="flex items-center justify-between px-3 py-2 rounded hover:bg-paper dark:hover:bg-paper-dark cursor-pointer text-ink dark:text-ink-dark transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-ink-muted" />
              <span>Manager Today Dashboard</span>
            </div>
            <span className="text-[10px] text-ink-muted">manager</span>
          </div>

          {spaces.slice(0, 5).map((space) => (
            <div
              key={space.id}
              onClick={() => { onSelectSpace(space); onClose(); }}
              className="flex items-center justify-between px-3 py-2 rounded hover:bg-paper dark:hover:bg-paper-dark cursor-pointer text-ink dark:text-ink-dark transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-accent/60" />
                <span>Jump to {space.name}</span>
              </div>
              <span className="text-[10px] text-ink-muted">₹{space.hourlyRate}/h</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
