import React, { useState } from 'react';
import { Search, Filter, Clock, CheckCircle2, AlertTriangle, ShieldCheck, MapPin, ThumbsUp } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const TrackScreen: React.FC = () => {
  const { reports, setSelectedReportModal, upvoteReport } = useClimate();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = reports.filter(r => {
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.barangay.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'Resolved') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (status === 'Action In Progress') return 'bg-sky-100 text-sky-800 border-sky-300';
    if (status === 'In Inspection') return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">
      
      {/* Track Header Card */}
      <div className="bg-white rounded-3xl p-6 text-slate-800 shadow-xl border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Real-time Remediation Intake
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">Incident Dispatch Tracker</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor environmental hazard inspections, field crew dispatches, and resolved municipal tickets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              {reports.length} Total Incidents
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by report ID, hazard keyword, or barangay..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['All', 'Submitted', 'In Inspection', 'Action In Progress', 'Resolved'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filterStatus === st
                    ? 'bg-[#059669] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center text-slate-500 shadow-sm border border-slate-100">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-700">No incident reports found</div>
            <div className="text-xs text-slate-400 mt-1">Try switching filters or submit a new hazard report.</div>
          </div>
        ) : (
          filtered.map(r => (
            <div
              key={r.id}
              onClick={() => setSelectedReportModal(r)}
              className="bg-white rounded-3xl p-5 shadow-md border border-slate-100 hover:border-emerald-300 hover:shadow-lg transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {r.id}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadge(r.status)}`}>
                    {r.status}
                  </span>
                  <span className="text-xs text-slate-400">• {new Date(r.createdAt).toLocaleDateString()}</span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                  {r.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {r.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1 font-semibold text-emerald-700">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{r.barangay}</span>
                  </div>
                  {r.assignedUnit && (
                    <div className="flex items-center gap-1 font-semibold text-slate-600">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{r.assignedUnit}</span>
                    </div>
                  )}
                </div>
              </div>

              {r.photoUrl && (
                <img
                  src={r.photoUrl}
                  alt={r.title}
                  className="w-24 h-24 object-cover rounded-2xl border border-slate-100 shrink-0"
                />
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};
