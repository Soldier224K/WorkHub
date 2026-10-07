import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Moon, 
  Sun, 
  Ticket, 
  Shield, 
  User, 
  LogOut, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { FloorCanvas, SpaceData } from './components/floor/FloorCanvas';
import { TimeRail } from './components/floor/TimeRail';
import { BookSheet } from './components/booking/BookSheet';
import { TicketModal } from './components/ticket/TicketModal';
import { CommandBar } from './components/cmdk/CommandBar';
import { ManagerToday } from './components/manager/ManagerToday';
import { PublicGuestPass } from './components/guest/PublicGuestPass';
import { AuthModal } from './components/auth/AuthModal';
import { api, getSavedUser, clearAuthToken } from './lib/api';
import { getSocket, joinLocationRoom } from './lib/socket';

export const App: React.FC = () => {
  // Check if public guest pass URL e.g. /g/:token
  const path = window.location.pathname;
  if (path.startsWith('/g/')) {
    const token = path.replace('/g/', '');
    return <PublicGuestPass token={token} onBackToApp={() => { window.location.href = '/'; }} />;
  }

  // App State
  const [currentUser, setCurrentUser] = useState<any>(getSavedUser());
  const [spaces, setSpaces] = useState<SpaceData[]>([]);
  const [location, setLocation] = useState('Downtown');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [currentSlotIndex, setCurrentSlotIndex] = useState(8); // Default 12:00 PM (slot 8)
  const [totalSlots, setTotalSlots] = useState(24);
  const [openHour, setOpenHour] = useState(8);
  const [slotMinutes, setSlotMinutes] = useState(30);

  // Selected space & modals
  const [selectedSpace, setSelectedSpace] = useState<SpaceData | null>(null);
  const [activeTicketBooking, setActiveTicketBooking] = useState<any>(null);
  const [showCommandBar, setShowCommandBar] = useState(false);
  const [showManagerToday, setShowManagerToday] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [unlockedEvent, setUnlockedEvent] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Fetch Availability Data
  const loadAvailability = async () => {
    try {
      const data = await api.spaces.getAvailability(location, selectedDate);
      if (data) {
        setSpaces(data.spaces || []);
        if (data.operatingWindow) {
          setTotalSlots(data.operatingWindow.totalSlots);
          const [h] = data.operatingWindow.open.split(':').map(Number);
          setOpenHour(h);
          setSlotMinutes(data.operatingWindow.slotMinutes);
        }
      }
    } catch (err) {
      console.error('Error loading floor availability:', err);
    }
  };

  useEffect(() => {
    loadAvailability();
    joinLocationRoom(location);
  }, [location, selectedDate]);

  // Refresh user profile with active pass
  useEffect(() => {
    if (currentUser) {
      api.members.getMe()
        .then((profile) => setCurrentUser(profile))
        .catch(() => {});
    }
  }, []);

  // WebSockets real-time listener
  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    // Live presence: update floor state in real-time without refetch storms
    s.on('availability:update', ({ spaceId, slotKeys, held }: any) => {
      setSpaces((prevSpaces) =>
        prevSpaces.map((sp) => {
          if (sp.id !== spaceId) return sp;
          const updatedSlots = new Set(sp.bookedSlotKeys);
          slotKeys.forEach((key: string) => {
            if (held) updatedSlots.add(key);
            else updatedSlots.delete(key);
          });

          // Recompute booked slot indices
          const newIndices: number[] = [];
          updatedSlots.forEach((k) => {
            if (k.startsWith(selectedDate)) {
              const [h, m] = k.split('T')[1].split(':').map(Number);
              const idx = Math.floor(((h * 60 + m) - openHour * 60) / slotMinutes);
              if (idx >= 0 && idx < totalSlots) newIndices.push(idx);
            }
          });

          return {
            ...sp,
            bookedSlotKeys: Array.from(updatedSlots),
            bookedSlotIndices: newIndices,
          };
        })
      );
    });

    // Real-time Desk Unlocked Event
    s.on('desk:unlocked', (eventData: any) => {
      setUnlockedEvent(eventData);
    });

    return () => {
      s.off('availability:update');
      s.off('desk:unlocked');
    };
  }, [openHour, slotMinutes, totalSlots, selectedDate]);

  // Handle Instant Booking from ⌘K
  const handleInstantBook = async (space: SpaceData, start: Date, end: Date) => {
    try {
      const booking = await api.bookings.create({
        resource: space.id,
        start: start.toISOString(),
        end: end.toISOString(),
        notes: '⌘K Instant Command',
      });
      setActiveTicketBooking(booking);
      loadAvailability();
    } catch (err: any) {
      alert(`Booking conflict: ${err.message}`);
    }
  };

  // Open User's Latest Active Ticket
  const handleOpenTicket = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    try {
      const list = await api.bookings.list({ limit: 1 });
      if (list && list.length > 0) {
        setActiveTicketBooking(list[0]);
      } else {
        alert('No active bookings found. Book a desk on the floor to receive your ticket!');
      }
    } catch (err) {
      alert('Please sign in to view your access ticket.');
    }
  };

  // Compute free desks count at current scrub hour
  const freeSpacesCount = spaces.filter(
    (s) => !s.bookedSlotIndices.includes(currentSlotIndex)
  ).length;

  return (
    <div className={`min-h-screen bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark transition-colors duration-200 ${isDarkMode ? 'dark' : ''}`}>
      {/* Quiet Architectural Top Bar with Glassmorphism */}
      <header className="h-16 px-6 border-b border-ink-hairline/50 flex items-center justify-between bg-surface backdrop-blur-glass shadow-glass dark:shadow-glass-dark sticky top-0 z-30 transition-all">
        {/* Brand & Campus Switcher */}
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-bold text-2xl tracking-tight text-ink drop-shadow-sm">
              WorkHub
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-accent font-semibold px-2 py-0.5 rounded-full bg-accent/10">
              Live Floor
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-ink-hairline shadow-sm text-xs font-medium text-ink-muted transition-all hover:shadow-md hover:border-ink-muted/50 cursor-pointer backdrop-blur-sm">
            <Building2 className="w-3.5 h-3.5 text-accent" />
            <span>{location} Campus · Floor 1</span>
          </div>
        </div>

        {/* Center: ⌘K Command Bar Trigger */}
        <div className="flex-1 max-w-sm mx-4 hidden md:block">
          <button
            onClick={() => setShowCommandBar(true)}
            className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-surface border border-ink-hairline text-sm font-medium text-ink-muted hover:text-ink hover:border-accent/50 hover:shadow-glass dark:hover:shadow-glass-dark transition-all backdrop-blur-sm group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-ink-muted group-hover:text-accent transition-colors" />
              <span>Find or book workspace...</span>
            </div>
            <kbd className="px-2 py-1 text-[10px] font-mono rounded-md bg-paper border border-ink-hairline shadow-sm group-hover:border-accent/30">⌘K</kbd>
          </button>
        </div>

        {/* Right Utilities */}
        <div className="flex items-center gap-4">
          {/* Mobile Search Button */}
          <button
            onClick={() => setShowCommandBar(true)}
            className="md:hidden p-2.5 rounded-xl bg-surface border border-ink-hairline text-ink-muted hover:text-accent shadow-sm backdrop-blur-sm"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Ticket Button */}
          <button
            onClick={handleOpenTicket}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-ink-hairline hover:border-accent/50 hover:shadow-glass dark:hover:shadow-glass-dark text-sm font-medium text-ink transition-all backdrop-blur-sm group"
          >
            <Ticket className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">My Ticket</span>
          </button>

          {/* Manager Today Button (If manager) */}
          {currentUser?.role === 'manager' && (
            <button
              onClick={() => setShowManagerToday(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent-hover text-sm font-medium transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Manager</span>
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-xl bg-surface border border-ink-hairline hover:border-accent/50 hover:text-accent hover:shadow-glass dark:hover:shadow-glass-dark text-ink-muted transition-all backdrop-blur-sm"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Persona Profile */}
          {currentUser ? (
            <div className="flex items-center gap-3 pl-4 border-l border-ink-hairline">
              <div
                onClick={() => setShowAuthModal(true)}
                className="cursor-pointer text-right hidden sm:block group"
              >
                <span className="block text-sm font-semibold text-ink group-hover:text-accent transition-colors truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="block text-[10px] font-medium tracking-wide uppercase text-ink-muted group-hover:text-accent/80 transition-colors">
                  {currentUser.activePass?.plan ? currentUser.activePass.plan.replace('_', ' ') : currentUser.role}
                </span>
              </div>
              <button
                onClick={() => {
                  clearAuthToken();
                  setCurrentUser(null);
                }}
                className="p-2.5 rounded-xl bg-surface border border-ink-hairline hover:border-red-500/50 text-ink-muted hover:text-red-500 hover:shadow-sm transition-all backdrop-blur-sm"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-5 py-2 rounded-xl bg-ink text-paper text-sm font-semibold tracking-wide hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Floor Canvas Interface */}
      <main className="relative">
        <FloorCanvas
          spaces={spaces}
          currentSlotIndex={currentSlotIndex}
          selectedSpaceId={selectedSpace?.id || null}
          onSelectSpace={(space) => setSelectedSpace(space)}
        />

        {/* Time Rail Scrubber */}
        <TimeRail
          currentSlotIndex={currentSlotIndex}
          totalSlots={totalSlots}
          openHour={openHour}
          slotMinutes={slotMinutes}
          selectedDate={selectedDate}
          freeCount={freeSpacesCount}
          totalCount={spaces.length}
          onSlotChange={(idx) => setCurrentSlotIndex(idx)}
          onDateChange={(d) => setSelectedDate(d)}
        />
      </main>

      {/* Book Sheet Side Drawer */}
      {selectedSpace && (
        <BookSheet
          space={selectedSpace}
          selectedDate={selectedDate}
          user={currentUser}
          onClose={() => setSelectedSpace(null)}
          onSuccess={(booking) => {
            setSelectedSpace(null);
            setActiveTicketBooking(booking);
            loadAvailability();
          }}
        />
      )}

      {/* Ticket Boarding Pass Modal */}
      {activeTicketBooking && (
        <TicketModal
          booking={activeTicketBooking}
          unlockedEvent={unlockedEvent}
          onClose={() => {
            setActiveTicketBooking(null);
            setUnlockedEvent(null);
          }}
        />
      )}

      {/* ⌘K Command Palette */}
      <CommandBar
        isOpen={showCommandBar}
        spaces={spaces}
        onClose={() => setShowCommandBar(false)}
        onSelectSpace={(space) => setSelectedSpace(space)}
        onOpenTicket={handleOpenTicket}
        onOpenManager={() => setShowManagerToday(true)}
        onInstantBook={handleInstantBook}
      />

      {/* Manager Today Screen */}
      {showManagerToday && (
        <ManagerToday onClose={() => setShowManagerToday(false)} />
      )}

      {/* Auth Modal with 1-click Viva Personas */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          loadAvailability();
        }}
      />
    </div>
  );
};
