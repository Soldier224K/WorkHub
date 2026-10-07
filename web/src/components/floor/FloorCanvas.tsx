import React, { useState, useRef } from 'react';
import { Users, Wifi, Monitor, Info, Sparkles, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

export interface SpaceData {
  id: string;
  name: string;
  type: string;
  location: string;
  floor: number;
  capacity: number;
  hourlyRate: number;
  requiresApproval: boolean;
  features: string[];
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
    rot: number;
  };
  bookedSlotKeys: string[];
  bookedSlotIndices: number[];
  yourSlotKeys: string[];
  hasPending: boolean;
}

interface FloorCanvasProps {
  spaces: SpaceData[];
  currentSlotIndex: number;
  selectedSpaceId: string | null;
  onSelectSpace: (space: SpaceData) => void;
}

export const FloorCanvas: React.FC<FloorCanvasProps> = ({
  spaces,
  currentSlotIndex,
  selectedSpaceId,
  onSelectSpace,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [hoveredSpace, setHoveredSpace] = useState<SpaceData | null>(null);

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'floor-bg') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      className="relative w-full h-[calc(100vh-140px)] overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Zoom Controls */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-2 bg-surface/60 backdrop-blur-glass border border-white/20 dark:border-ink-hairline/20 rounded-2xl p-1.5 shadow-glass dark:shadow-glass-dark">
        <button
          onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
          className="p-2.5 rounded-xl hover:bg-surface/80 hover:shadow-sm text-ink transition-all active:scale-95"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
          className="p-2.5 rounded-xl hover:bg-surface/80 hover:shadow-sm text-ink transition-all active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <div className="h-px w-full bg-ink-hairline/30 my-0.5" />
        <button
          onClick={resetView}
          className="p-2.5 rounded-xl hover:bg-surface/80 hover:shadow-sm text-ink-muted hover:text-ink transition-all active:scale-95"
          title="Reset View"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Blueprint Legend */}
      <div className="absolute top-6 left-6 z-20 hidden md:flex items-center gap-5 bg-surface/60 backdrop-blur-glass border border-white/20 dark:border-ink-hairline/20 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted shadow-glass dark:shadow-glass-dark transition-all hover:shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-ink-muted/50 rounded-full bg-surface" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 border border-ink-hairline rounded-full hatch-pattern opacity-60" />
          <span>Taken</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-accent shadow-sm shadow-accent/50 rounded-full" />
          <span className="text-ink font-bold">Yours</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-dashed border-accent rounded-full animate-pulse" />
          <span>Pending</span>
        </div>
      </div>

      {/* SVG Architectural Canvas */}
      <svg
        id="floor-bg"
        className="w-full h-full"
        viewBox="0 0 1000 600"
      >
        <defs>
          {/* Diagonal architectural hatch pattern */}
          <pattern
            id="hatch-taken"
            width="8"
            height="8"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke="#17160F"
              strokeWidth="2.5"
              strokeOpacity="0.22"
            />
          </pattern>

          {/* Blueprint Background Grid Dots */}
          <pattern id="grid-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#77746A" fillOpacity="0.25" />
          </pattern>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Floor Canvas Boundary & Grid */}
          <rect
            x="20"
            y="20"
            width="960"
            height="560"
            rx="10"
            fill="url(#grid-dots)"
            stroke="#E3DFD5"
            strokeWidth="1.5"
          />

          {/* Architectural Zone Dividers */}
          <text x="60" y="55" className="fill-ink-muted font-mono text-[11px] tracking-widest uppercase">
            Zone A — Hot Desks & Focus Bays
          </text>
          <line x1="60" y1="62" x2="660" y2="62" stroke="#E3DFD5" strokeWidth="1" strokeDasharray="4 4" />

          <text x="60" y="315" className="fill-ink-muted font-mono text-[11px] tracking-widest uppercase">
            Zone B — Collaboration & Boardrooms
          </text>
          <line x1="60" y1="322" x2="900" y2="322" stroke="#E3DFD5" strokeWidth="1" strokeDasharray="4 4" />

          {/* Workspaces Rendering */}
          {spaces.map((space) => {
            const isSelected = selectedSpaceId === space.id;
            const isTaken = space.bookedSlotIndices.includes(currentSlotIndex);
            const isYours = space.yourSlotKeys.length > 0;
            const isPending = space.hasPending;

            // Determine desk appearance
            let fill = 'var(--surface)';
            let stroke = '#77746A';
            let strokeWidth = '1';
            let strokeDasharray = 'none';
            let textColor = 'fill-ink dark:fill-ink-dark';

            if (isYours) {
              fill = '#E8431E';
              stroke = '#CF3512';
              strokeWidth = '1.5';
              textColor = 'fill-white font-medium';
            } else if (isTaken) {
              fill = 'url(#hatch-taken)';
              stroke = '#77746A';
              strokeWidth = '1';
              textColor = 'fill-ink-muted';
            } else if (isPending) {
              fill = 'var(--surface)';
              stroke = '#E8431E';
              strokeWidth = '1.5';
              strokeDasharray = '4 3';
              textColor = 'fill-accent font-medium';
            }

            if (isSelected) {
              stroke = '#E8431E';
              strokeWidth = '2.5';
            }

            const { x, y, w, h } = space.layout || { x: 50, y: 50, w: 60, h: 40, rot: 0 };
            const isMeetingRoom = space.type !== 'desk';

            return (
              <g
                key={space.id}
                className="cursor-pointer transition-transform duration-150 hover:opacity-90"
                onClick={() => onSelectSpace(space)}
                onMouseEnter={() => setHoveredSpace(space)}
                onMouseLeave={() => setHoveredSpace(null)}
              >
                {/* Node Box */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={isMeetingRoom ? 6 : 4}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                />

                {/* Desk/Room Label */}
                <text
                  x={x + w / 2}
                  y={y + (isMeetingRoom ? 28 : h / 2 + 4)}
                  textAnchor="middle"
                  className={`text-xs font-mono select-none ${textColor}`}
                >
                  {space.name}
                </text>

                {/* Meeting Room Capacity Sub-label */}
                {isMeetingRoom && (
                  <text
                    x={x + w / 2}
                    y={y + 50}
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-ink-muted select-none"
                  >
                    Cap: {space.capacity} · ₹{space.hourlyRate}/h
                  </text>
                )}

                {/* Selection Accent Dot */}
                {isSelected && (
                  <circle cx={x + w - 8} cy={y + 8} r="3" fill="#E8431E" />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredSpace && (
        <div className="absolute top-16 left-4 z-20 pointer-events-none bg-surface/95 dark:bg-surface-dark/95 backdrop-blur border border-ink-hairline dark:border-ink-dark-hairline rounded-lg p-3 text-xs shadow-md max-w-xs transition-opacity animate-in fade-in duration-100">
          <div className="flex items-center justify-between gap-4 font-mono font-medium text-ink dark:text-ink-dark pb-1 border-b border-ink-hairline/60">
            <span>{hoveredSpace.name}</span>
            <span className="text-accent">₹{hoveredSpace.hourlyRate}/hr</span>
          </div>
          <div className="pt-2 text-ink-muted dark:text-ink-dark-muted space-y-1 font-mono text-[11px]">
            <p>Type: <span className="capitalize text-ink dark:text-ink-dark">{hoveredSpace.type.replace('_', ' ')}</span></p>
            <p>Capacity: <span className="text-ink dark:text-ink-dark">{hoveredSpace.capacity} person{hoveredSpace.capacity > 1 ? 's' : ''}</span></p>
            {hoveredSpace.features.length > 0 && (
              <p className="truncate">Amenities: {hoveredSpace.features.join(' · ')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
