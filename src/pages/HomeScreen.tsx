import React, { useState } from 'react';
import {
  AlertTriangle, X, RefreshCw, Sun, CloudRain,
  Clock, RotateCw, CheckCircle2, ChevronRight,
  Shield, Calendar, MapPin, ArrowRight
} from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const HomeScreen: React.FC = () => {
  const {
    weather, reports, activities,
    setActiveTab, setSelectedReportModal, setSelectedActivityModal,
    currentUser
  } = useClimate();

  const [advisoryDismissed, setAdvisoryDismissed] = useState(false);

  // Statistics calculation for user or public community mode
  const userReports = currentUser
    ? reports.filter(r => r.userId === currentUser.id || r.reporterName === currentUser.name)
    : reports;

  const awaitingTriage = reports.filter(r => r.status === 'Submitted').length;
  const dispatched = reports.filter(r => r.status === 'In Inspection' || r.status === 'Action In Progress').length;
  const remediated = reports.filter(r => r.status === 'Resolved').length;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-28">

      {/* 1. Emergency PAGASA Advisory Banner */}
      {!advisoryDismissed && (
        <div className="bg-[#fff1f2] border border-[#fecdd3] text-[#9f1239] rounded-2xl p-3.5 shadow-sm flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-xs sm:text-sm leading-snug">
              <span className="font-extrabold text-rose-950">Emergency PAGASA Advisory:</span>{' '}
              <span className="text-rose-900 font-medium">
                Low Pressure Area approaching Eastern Seaboard. Heavy precipitation expected.
              </span>
            </div>
          </div>
          <button
            onClick={() => setAdvisoryDismissed(true)}
            className="text-rose-400 hover:text-rose-700 p-1 shrink-0"
            title="Dismiss Advisory"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. TODAY'S CLIMATE STATUS Card */}
      <div className="bg-[#15803d] border border-[#22c55e]/50 rounded-3xl p-6 text-white shadow-xl space-y-5">
        
        {/* Top Card Header */}
        <div className="flex items-center justify-between">
          <span className="bg-[#166534] border border-[#22c55e]/40 text-emerald-100 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">
            TODAY'S CLIMATE STATUS
          </span>

          <button
            onClick={() => window.location.reload()}
            className="text-emerald-100 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Live Telemetry</span>
          </button>
        </div>

        {/* Temperature & Conditions Row */}
        <div className="flex items-center gap-4">
          {/* Weather Icon (Sun with dashed ray styling) */}
          <div className="relative shrink-0">
            <Sun className="w-14 h-14 text-white stroke-[1.8]" />
          </div>

          <div className="space-y-0.5">
            <div className="text-5xl font-black tracking-tight text-white leading-none">
              {weather.temperature}°C
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {weather.condition}
            </div>
            <div className="text-xs text-emerald-100 font-medium">
              Feels like {weather.heatIndex - 2}°C
            </div>
          </div>
        </div>

        {/* 3 Metric Cards Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Metric 1: Heat Index */}
          <div className="bg-[#166534]/70 border border-[#22c55e]/30 rounded-2xl p-3 text-center space-y-0.5">
            <div className="text-[11px] text-emerald-100 font-medium">Heat Index</div>
            <div className="text-base sm:text-lg font-black text-white">{weather.heatIndex}°C</div>
            <div className="text-[10px] text-emerald-200 font-bold">(High)</div>
          </div>

          {/* Metric 2: Air Quality */}
          <div className="bg-[#166534]/70 border border-[#22c55e]/30 rounded-2xl p-3 text-center space-y-0.5">
            <div className="text-[11px] text-emerald-100 font-medium">Air Quality</div>
            <div className="text-xs sm:text-sm font-black text-white leading-tight">Moderate (AQI 68)</div>
            <div className="text-[10px] text-emerald-200 font-bold">Moderate</div>
          </div>

          {/* Metric 3: Rain Risk */}
          <div className="bg-[#166534]/70 border border-[#22c55e]/30 rounded-2xl p-3 text-center space-y-0.5">
            <div className="text-[11px] text-emerald-100 font-medium">Rain Risk</div>
            <div className="text-base sm:text-lg font-black text-white">45%</div>
            <div className="text-[10px] text-emerald-200 font-bold">Possible</div>
          </div>
        </div>

        {/* Yellow Alert Bottom Notice Bar */}
        <div className="bg-[#054b2b] border border-[#0d6940] rounded-2xl p-3.5 space-y-1.5 shadow-inner">
          <div>
            <span className="bg-[#f59e0b] text-[#1e293b] font-black text-[11px] px-2.5 py-0.5 rounded-full inline-block shadow-sm">
              PAGASA Status: Yellow Alert
            </span>
          </div>
          <p className="text-xs text-emerald-100 font-medium leading-relaxed">
            {weather.advisoryNotice || 'PAGASA Advisory: Low Pressure Area approaching Eastern Seaboard. Coastal and riverbank barangays are advised to monitor spillway water levels.'} &gt;
          </p>
        </div>

      </div>

      {/* 3. MY CITIZEN ACTIVITY & REPORTS Card */}
      <div className="bg-white rounded-3xl p-6 text-slate-800 shadow-xl border border-slate-100 space-y-4">
        
        {/* Card Header with Mode Badge */}
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
            MY CITIZEN ACTIVITY & REPORTS
          </h2>
          <span className="bg-[#1e293b] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
            PUBLIC COMMUNITY MODE
          </span>
        </div>

        {/* 2x2 Grid of 4 Stat Boxes */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Box 1: Filed by Me */}
          <div
            onClick={() => setActiveTab('track')}
            className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-rose-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                FILED BY ME
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none mb-1">
                {currentUser ? userReports.length : 0}
              </div>
              <div className="text-xs font-bold text-slate-700">My Submissions</div>
              <div className="text-[10px] font-semibold text-emerald-600">Metro Verde Municipality</div>
            </div>
          </div>

          {/* Box 2: Awaiting Triage */}
          <div
            onClick={() => setActiveTab('track')}
            className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">
                AWAITING TRIAGE
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none mb-1">
                {awaitingTriage}
              </div>
              <div className="text-xs font-bold text-slate-700">Pending Review</div>
              <div className="text-[10px] font-semibold text-emerald-600">Under CENRO intake</div>
            </div>
          </div>

          {/* Box 3: Dispatched */}
          <div
            onClick={() => setActiveTab('track')}
            className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-sky-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <RotateCw className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider">
                DISPATCHED
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none mb-1">
                {dispatched}
              </div>
              <div className="text-xs font-bold text-slate-700">In Progress</div>
              <div className="text-[10px] font-semibold text-emerald-600">Field unit deployed</div>
            </div>
          </div>

          {/* Box 4: Remediated */}
          <div
            onClick={() => setActiveTab('track')}
            className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">
                REMEDIATED
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none mb-1">
                {remediated}
              </div>
              <div className="text-xs font-bold text-slate-700">Resolved Incidents</div>
              <div className="text-[10px] font-semibold text-emerald-600">Remediated & Closed</div>
            </div>
          </div>

        </div>

      </div>

      {/* 4. REPORT AN ENVIRONMENTAL INCIDENT Card */}
      <div className="bg-[#0d6f42] border border-[#168551] rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-md">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
              REPORT AN ENVIRONMENTAL INCIDENT
            </h3>
            <p className="text-xs text-emerald-100 leading-relaxed max-w-md">
              See flooding, illegal dumping, pollution or another environmental problem? Report it to the municipality and help make our community safer and cleaner.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('report')}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-[#065f46] hover:bg-emerald-50 font-black text-xs uppercase tracking-wider shrink-0 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>Report Hazard Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 5. Community Climate Action Movements Preview */}
      <div className="bg-white rounded-3xl p-6 text-slate-800 shadow-xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Community Climate Movements</h3>
            <p className="text-xs text-slate-500">Participate and upload proof to claim municipal Eco-Points.</p>
          </div>
          <button
            onClick={() => setActiveTab('learn')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {activities.filter(a => !a.hidden).slice(0, 2).map(act => (
            <div
              key={act.id}
              onClick={() => setSelectedActivityModal(act)}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 hover:border-emerald-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    +{act.points} Eco-Points
                  </span>
                  <span className="text-xs font-bold text-slate-500">{act.category}</span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">{act.title}</h4>
                <div className="text-[11px] text-slate-500">📍 {act.location} • 📅 {act.date}</div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedActivityModal(act);
                }}
                className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl shrink-0 shadow-sm"
              >
                Join & Submit Proof
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
