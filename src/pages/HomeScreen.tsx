import React from 'react';
import { CloudSun, ShieldAlert, Users, Award, AlertTriangle, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const HomeScreen: React.FC = () => {
  const {
    weather, announcements, reports, activities,
    setActiveTab, setSelectedReportModal, setSelectedActivityModal
  } = useClimate();

  return (
    <div className="space-y-8 pb-20">
      
      {/* Hero & Emergency Weather Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800/40 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 grid lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>LGU CENRO Real-Time Telemetry Desk</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Metro Verde Climate Action & Environmental Command
            </h1>

            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Empowering citizens to report hazards, track response dispatches, join municipal reforestation drives, and build climate resilience.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('report')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Report Environmental Hazard</span>
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
              >
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>View Live Hazard Map</span>
              </button>
            </div>
          </div>

          {/* Weather Widget */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Weather Telemetry</div>
              <CloudSun className="w-6 h-6 text-amber-400" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{weather.temperature}°C</span>
              <span className="text-xs text-slate-400 font-bold">Heat Index {weather.heatIndex}°C</span>
            </div>

            <div className="text-xs font-bold text-emerald-300 bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-800/40">
              {weather.condition}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-300">
              <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
                <span className="block text-[9px] text-slate-400">Typhoon Signal</span>
                <span className="font-extrabold text-amber-400">{weather.typhoonSignal}</span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
                <span className="block text-[9px] text-slate-400">Air Quality</span>
                <span className="font-extrabold text-emerald-400">{weather.airQuality}</span>
              </div>
            </div>

            {weather.advisoryNotice && (
              <p className="text-[11px] text-emerald-200/90 leading-tight">
                {weather.advisoryNotice}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Feature Cards */}
      <div className="grid sm:grid-cols-3 gap-5">
        <div
          onClick={() => setActiveTab('report')}
          className="group cursor-pointer bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl transition-all shadow-lg hover:shadow-emerald-950/30"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-white group-hover:text-emerald-400 transition-colors">
            Hazard Incident Dispatch
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Report clogged drainage, river debris, or solid waste dumping to CENRO field units.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('learn')}
          className="group cursor-pointer bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl transition-all shadow-lg hover:shadow-emerald-950/30"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-white group-hover:text-teal-400 transition-colors">
            Earn Eco-Points & Rewards
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Join community drives, submit participation proofs, or complete climate quizzes to earn points.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('profile')}
          className="group cursor-pointer bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl transition-all shadow-lg hover:shadow-emerald-950/30"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-white group-hover:text-amber-400 transition-colors">
            Verified Citizen Badge
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Upload government ID (KYC) to earn verified reporter status and priority triage dispatch.
          </p>
        </div>
      </div>

      {/* Official Announcements */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-white">Official Municipal Climate Advisories</h2>
        </div>

        <div className="space-y-4">
          {announcements.filter(a => !a.hidden).map(a => (
            <div key={a.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  {a.category}
                </span>
                <span className="text-[10px] text-slate-400">{new Date(a.timestamp).toLocaleDateString()}</span>
              </div>
              <h3 className="text-base font-extrabold text-white">{a.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{a.content}</p>
              {a.imageUrl && (
                <img src={a.imageUrl} alt={a.title} className="w-full max-h-48 object-cover rounded-xl border border-slate-800 mt-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Community Drives */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-white">Active Community Action Drives</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {activities.filter(act => !act.hidden).map(act => (
            <div key={act.id} className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {act.category}
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-800/60">
                    +{act.points} Eco-Pts
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-white mb-1">{act.title}</h3>
                <div className="text-[11px] text-slate-400 space-y-0.5 mb-3">
                  <div>📅 {act.date}</div>
                  <div>📍 {act.location}</div>
                </div>
              </div>

              <button
                onClick={() => setSelectedActivityModal(act)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
              >
                Participate & Submit Proof
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
