import React, { useState } from 'react';
import { MapPin, Navigation, Compass, Layers } from 'lucide-react';
import { IncidentReport } from '../types';

interface MapProps {
  reports?: IncidentReport[];
  interactive?: boolean;
  onSelectReport?: (r: IncidentReport) => void;
  onSelectLocation?: (lat: number, lng: number) => void;
}

export const IncidentMapPicker: React.FC<MapProps> = ({
  reports = [],
  interactive = true,
  onSelectReport,
  onSelectLocation
}) => {
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPin({ x, y });

    const lat = 14.5995 + (y - 50) * 0.001;
    const lng = 120.9842 + (x - 50) * 0.001;
    if (onSelectLocation) onSelectLocation(lat, lng);
  };

  const getSeverityBadge = (sev: string) => {
    if (sev === 'Critical') return 'bg-rose-500 shadow-rose-500/50';
    if (sev === 'High') return 'bg-amber-500 shadow-amber-500/50';
    return 'bg-emerald-500 shadow-emerald-500/50';
  };

  return (
    <div
      onClick={handleMapClick}
      className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 cursor-crosshair group shadow-xl"
    >
      {/* Grid Pattern Simulation */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Simulated Map Topography */}
      <svg className="absolute inset-0 w-full h-full opacity-30 text-emerald-900 fill-current" viewBox="0 0 400 300">
        <path d="M 0,100 Q 100,60 200,120 T 400,100 L 400,300 L 0,300 Z" />
        <path d="M 0,200 Q 150,150 250,220 T 400,180 L 400,300 L 0,300 Z" className="text-teal-900" />
      </svg>

      {/* Map Control Badges */}
      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] font-extrabold text-emerald-400 flex items-center gap-1.5 shadow-lg">
        <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
        <span>Metro Verde Telemetry Grid • Active GPS Map</span>
      </div>

      <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-2.5 py-1 text-[10px] font-bold text-slate-300 flex items-center gap-1">
        <Layers className="w-3.5 h-3.5 text-emerald-400" />
        <span>Satellite Overlay</span>
      </div>

      {/* User Clicked Pin */}
      {pin && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-full transition-all duration-200"
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        >
          <div className="flex flex-col items-center">
            <div className="px-2 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-bold shadow-lg whitespace-nowrap mb-1">
              Selected Location Pin
            </div>
            <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-bounce">
              <MapPin className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Existing Incident Report Markers */}
      {reports.map((r, idx) => {
        const x = 20 + ((idx * 37) % 65);
        const y = 25 + ((idx * 29) % 55);

        return (
          <div
            key={r.id}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectReport) onSelectReport(r);
            }}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer group/pin"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className="relative flex items-center justify-center">
              <span className={`absolute w-8 h-8 rounded-full opacity-40 animate-ping ${getSeverityBadge(r.severity)}`} />
              <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center border-2 border-slate-900 shadow-lg ${getSeverityBadge(r.severity)}`}>
                <MapPin className="w-4 h-4" />
              </div>
            </div>

            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/pin:block bg-slate-900 text-white border border-slate-700 p-2 rounded-xl text-[10px] font-bold whitespace-nowrap shadow-xl z-30">
              <div className="text-emerald-400 font-extrabold">{r.title}</div>
              <div className="text-slate-400">{r.barangay} • Status: {r.status}</div>
            </div>
          </div>
        );
      })}

      {/* Prompt Overlay */}
      {!pin && reports.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-slate-300 flex items-center gap-2 shadow-2xl">
            <Navigation className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Click anywhere on map to pin precise hazard location</span>
          </div>
        </div>
      )}
    </div>
  );
};
