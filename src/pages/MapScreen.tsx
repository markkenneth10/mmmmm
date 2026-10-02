import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Filter,
  Layers,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { Report } from '../types';
import { BARANGAYS, REPORT_CATEGORIES } from '../data/initialData';

export const MapScreen: React.FC = () => {
  const { reports, setSelectedReport } = useClimate();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedIncident, setSelectedIncident] = useState<Report | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('');

  const filteredReports = reports.filter(r => {
    if (categoryFilter && r.category !== categoryFilter) return false;
    if (severityFilter && r.severity !== severityFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (barangayFilter && r.barangay !== barangayFilter) return false;
    return true;
  });

  const getPinColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return '#DC2626'; // Red
      case 'High':
        return '#EA580C'; // Orange
      case 'Moderate':
        return '#CA8A04'; // Yellow
      default:
        return '#16A34A'; // Green
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [14.5995, 120.9842],
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Metro Verde GIS'
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      // Don't destroy on regular renders
    };
  }, []);

  // Update Markers when filteredReports change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    filteredReports.forEach(report => {
      const color = getPinColor(report.severity);

      const icon = L.divIcon({
        className: 'custom-gis-pin',
        html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.35); cursor: pointer;"><div style="width: 10px; height: 10px; background-color: #FFFFFF; border-radius: 50%; transform: rotate(45deg);"></div></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      const marker = L.marker([report.latitude, report.longitude], { icon });

      marker.on('click', () => {
        setSelectedIncident(report);
        mapInstanceRef.current?.panTo([report.latitude, report.longitude]);
      });

      marker.addTo(layer);
    });
  }, [filteredReports]);

  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([14.5995, 120.9842], 13);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Title and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> Municipal GIS Hazard Map
            </h1>
            <p className="text-xs text-slate-500">
              Interactive spatial view of active reports across Metro Verde barangays
            </p>
          </div>

          <button
            onClick={handleResetCenter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset View</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
          >
            <option value="">All Categories</option>
            {REPORT_CATEGORIES.map(c => (
              <option key={c.label} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical (Red)</option>
            <option value="High">High (Orange)</option>
            <option value="Moderate">Moderate (Yellow)</option>
            <option value="Low">Low (Green)</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Verified">Verified</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={barangayFilter}
            onChange={e => setBarangayFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
          >
            <option value="">All Barangays</option>
            {BARANGAYS.map(b => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Canvas and Floating Drawer */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-[68vh] min-h-[480px] z-0" />

        {/* Map Legend */}
        <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-sm text-[11px] space-y-1.5">
          <span className="font-bold text-slate-800 block text-xs">Severity Legend</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 shadow-xs" />
            <span className="text-slate-600 font-medium">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-600 shadow-xs" />
            <span className="text-slate-600 font-medium">High</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-xs" />
            <span className="text-slate-600 font-medium">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600 shadow-xs" />
            <span className="text-slate-600 font-medium">Low</span>
          </div>
        </div>

        {/* Selected Incident Drawer / Bottom Floating Card */}
        {selectedIncident && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-20 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 animate-in slide-in-from-bottom-4 duration-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                {selectedIncident.category}
              </span>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1.5 py-0.5 rounded"
              >
                ✕
              </button>
            </div>

            <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
              {selectedIncident.title}
            </h3>

            <p className="text-xs text-slate-500 line-clamp-2">
              {selectedIncident.description}
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                {selectedIncident.barangay}
              </span>
              <span className="font-bold text-emerald-700">{selectedIncident.status}</span>
            </div>

            <button
              onClick={() => setSelectedReport(selectedIncident)}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <span>Inspect Full Incident Details</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
