import React, { useState, useEffect } from 'react';
import { X, Check, XCircle, TrendingUp, Users, DollarSign, Calendar, Clock } from 'lucide-react';
import { api } from '../../lib/api';

interface ManagerTodayProps {
  onClose: () => void;
}

export const ManagerToday: React.FC<ManagerTodayProps> = ({ onClose }) => {
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [heat, rev, bookings] = await Promise.all([
        api.reports.getHeatmap('Downtown'),
        api.reports.getRevenue(),
        api.bookings.list({ status: 'pending' }),
      ]);
      setHeatmapData(heat);
      setRevenueData(rev);
      setPendingBookings(bookings || []);
    } catch (err) {
      console.error('Error fetching manager data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (bookingId: string, status: 'confirmed' | 'rejected') => {
    try {
      await api.bookings.updateStatus(bookingId, status);
      fetchData();
    } catch (err: any) {
      alert(`Error updating booking: ${err.message}`);
    }
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface dark:bg-surface-dark border border-ink-hairline dark:border-ink-dark-hairline rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-paper dark:bg-paper-dark border-b border-ink-hairline dark:border-ink-dark-hairline flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-accent font-semibold">
              Operations Control
            </span>
            <h2 className="font-serif text-3xl font-normal text-ink dark:text-ink-dark mt-0.5">
              Manager Today
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface dark:hover:bg-surface-dark text-ink-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-paper dark:bg-paper-dark border border-ink-hairline dark:border-ink-dark-hairline">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Floor Occupancy</span>
              <div className="font-serif text-4xl text-ink dark:text-ink-dark font-normal mt-1">
                <em className="italic text-accent">78%</em>
              </div>
              <span className="text-[11px] font-mono text-ink-muted">Downtown Campus</span>
            </div>

            <div className="p-4 rounded-lg bg-paper dark:bg-paper-dark border border-ink-hairline dark:border-ink-dark-hairline">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Net Revenue (Month)</span>
              <div className="font-serif text-4xl text-ink dark:text-ink-dark font-normal mt-1">
                ₹{revenueData?.summary?.netRevenue?.toLocaleString() || '1,420'}
              </div>
              <span className="text-[11px] font-mono text-ink-muted">Pass renewals & hourly</span>
            </div>

            <div className="p-4 rounded-lg bg-paper dark:bg-paper-dark border border-ink-hairline dark:border-ink-dark-hairline">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Pending Approvals</span>
              <div className="font-serif text-4xl text-ink dark:text-ink-dark font-normal mt-1">
                {pendingBookings.length}
              </div>
              <span className="text-[11px] font-mono text-ink-muted">Boardroom & team requests</span>
            </div>
          </div>

          {/* Pending Approvals Queue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-ink-hairline pb-2">
              <h3 className="font-serif text-xl text-ink dark:text-ink-dark">
                Booking Approvals Queue
              </h3>
              <span className="text-xs font-mono text-ink-muted">{pendingBookings.length} awaiting action</span>
            </div>

            {pendingBookings.length === 0 ? (
              <p className="text-xs font-mono text-ink-muted py-4">No pending bookings requiring approval.</p>
            ) : (
              <div className="space-y-2">
                {pendingBookings.map((b) => (
                  <div
                    key={b._id}
                    className="p-4 rounded-lg bg-paper dark:bg-paper-dark border border-ink-hairline dark:border-ink-dark-hairline flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-xs text-ink dark:text-ink-dark">{b.resource?.name}</strong>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border text-ink-muted">
                          {b.member?.name} ({b.member?.company || 'Member'})
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-ink-muted mt-1">
                        {new Date(b.start).toLocaleDateString()} · {new Date(b.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – {new Date(b.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(b._id, 'confirmed')}
                        className="px-3 py-1.5 rounded bg-accent hover:bg-accent-hover text-white text-xs font-mono flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(b._id, 'rejected')}
                        className="px-3 py-1.5 rounded border border-ink-hairline hover:bg-surface text-ink text-xs font-mono flex items-center gap-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5 text-ink-muted" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom SVG Weekday x Hour Density Heatmap */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-ink-hairline pb-2">
              <div>
                <h3 className="font-serif text-xl text-ink dark:text-ink-dark">
                  Density Heatmap
                </h3>
                <span className="text-[11px] font-mono text-ink-muted">Weekday × Hour booking concentration</span>
              </div>
              {hoveredCell && (
                <div className="text-xs font-mono text-accent">
                  {hoveredCell.dayName} at {hoveredCell.hour % 12 === 0 ? 12 : hoveredCell.hour % 12} {hoveredCell.hour >= 12 ? 'PM' : 'AM'}: {hoveredCell.count} reservations
                </div>
              )}
            </div>

            {/* SVG Matrix */}
            <div className="overflow-x-auto pt-2">
              <svg viewBox="0 0 620 180" className="w-full h-44 select-none">
                {/* Hour Labels */}
                {[0, 4, 8, 12, 16, 20].map((h) => (
                  <text
                    key={h}
                    x={60 + h * 22}
                    y={12}
                    className="text-[9px] font-mono fill-ink-muted"
                  >
                    {h}:00
                  </text>
                ))}

                {/* Days and Cells */}
                {days.map((day, dIdx) => (
                  <g key={day} transform={`translate(0, ${25 + dIdx * 20})`}>
                    <text x={0} y={14} className="text-[10px] font-mono fill-ink-muted">
                      {day}
                    </text>

                    {Array.from({ length: 24 }).map((_, hIdx) => {
                      const cell = heatmapData?.grid?.find(
                        (c: any) => c.dayOfWeek === dIdx + 1 && c.hour === hIdx
                      ) || { count: 0, intensity: 0, dayName: day, hour: hIdx };

                      // Compute vermilion opacity based on intensity
                      const opacity = Math.max(0.08, cell.intensity);
                      const fillColor = cell.count > 0 ? '#E8431E' : '#77746A';

                      return (
                        <rect
                          key={hIdx}
                          x={60 + hIdx * 22}
                          y={2}
                          width={18}
                          height={16}
                          rx={3}
                          fill={fillColor}
                          fillOpacity={cell.count > 0 ? opacity : 0.08}
                          className="cursor-pointer hover:stroke-accent hover:stroke-1 transition-all"
                          onMouseEnter={() => setHoveredCell(cell)}
                          onMouseLeave={() => setHoveredCell(null)}
                        />
                      );
                    })}
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
