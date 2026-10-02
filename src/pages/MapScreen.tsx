import React, { useState } from 'react';
import { Filter, Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { IncidentMapPicker } from '../components/IncidentMapPicker';

export const MapScreen: React.FC = () => {
  const { reports, setSelectedReportModal } = useClimate();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('All');

  const filteredReports = reports.filter(r => {
    if (selectedCategory !== 'All' && r.category !== selectedCategory) return false;
    if (selectedBarangay !== 'All' && r.barangay !== selectedBarangay) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Interactive Environmental Hazard Map</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time GPS telemetry of reported hazards across Metro Verde barangays.</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span>Filters:</span>
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
        >
          <option value="All">All Categories</option>
          <option value="Flood & Clogged Drainage">Flood & Clogged Drainage</option>
          <option value="Illegal Solid Waste Dumping">Illegal Solid Waste Dumping</option>
          <option value="Fallen Trees & Erosion">Fallen Trees & Erosion</option>
        </select>

        <select
          value={selectedBarangay}
          onChange={e => setSelectedBarangay(e.target.value)}
          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
        >
          <option value="All">All Barangays</option>
          <option value="Barangay Makilas">Barangay Makilas</option>
          <option value="Barangay San Isidro">Barangay San Isidro</option>
          <option value="Barangay Verde Coast">Barangay Verde Coast</option>
        </select>
      </div>

      {/* Map Picker Component */}
      <IncidentMapPicker
        reports={filteredReports}
        onSelectReport={setSelectedReportModal}
      />

      {/* Report Summary Cards below Map */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map(r => (
          <div
            key={r.id}
            onClick={() => setSelectedReportModal(r)}
            className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                {r.id}
              </span>
              <span className="text-[10px] font-bold text-slate-400">{r.status}</span>
            </div>
            <h3 className="text-sm font-extrabold text-white">{r.title}</h3>
            <p className="text-xs text-slate-400 line-clamp-2">{r.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
