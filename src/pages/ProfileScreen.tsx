import React from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  LogOut,
  CreditCard,
  History,
  AlertCircle
} from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const ProfileScreen: React.FC = () => {
  const {
    currentUser,
    allUsers,
    pointsLogs,
    activities,
    openAuthModal,
    setShowKycModal,
    logout,
    switchUser,
    setActiveTab
  } = useClimate();

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-8 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Sign in to Citizen Portal</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Sign in to track your environmental reports, check accumulated Eco-Points, and participate in community restoration.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
        >
          Sign In or Register
        </button>
      </div>
    );
  }

  const userLogs = pointsLogs.filter(l => l.userId === currentUser.id);
  const myActivities = activities.filter(a => a.isRegistered);

  // Determine Level from points
  const getLevel = (pts: number) => {
    if (pts >= 500) return { name: 'Metro Verde Master Guardian', level: 5, progress: 100 };
    if (pts >= 300) return { name: 'Eco Champion', level: 4, progress: Math.min(100, Math.round(((pts - 300) / 200) * 100)) };
    if (pts >= 150) return { name: 'Senior Environmental Ranger', level: 3, progress: Math.min(100, Math.round(((pts - 150) / 150) * 100)) };
    if (pts >= 50) return { name: 'Active Citizen Steward', level: 2, progress: Math.min(100, Math.round(((pts - 50) / 100) * 100)) };
    return { name: 'Novice Citizen', level: 1, progress: Math.min(100, Math.round((pts / 50) * 100)) };
  };

  const levelInfo = getLevel(currentUser.points);

  const badges = [
    { title: 'First Responder', desc: 'Lodged verified incident report', earned: true },
    { title: 'Tree Planter', desc: 'Registered for mangrove restoration', earned: true },
    { title: 'Quiz Master', desc: 'Completed climate awareness quiz', earned: true },
    { title: 'Clean Air Champion', desc: 'Reported open burning hazard', earned: currentUser.points >= 200 }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* 1. Profile Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg border-2 border-white ring-4 ring-slate-100 shrink-0"
              style={{ backgroundColor: currentUser.avatarColorHex }}
            >
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {currentUser.name}
                </h1>
                {currentUser.isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Unverified
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1">
                {currentUser.email} • {currentUser.phone || '0917-000-0000'}
              </p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                {currentUser.barangay}, {currentUser.municipality}
              </p>
            </div>
          </div>

          {/* Points Pill & Action */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 rounded-2xl p-4 sm:p-5 text-right sm:min-w-[180px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
              Eco-Points Balance
            </span>
            <div className="text-3xl font-black text-emerald-700 flex items-center justify-end gap-1.5 mt-0.5">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
              <span>{currentUser.points}</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 block mt-1">
              Level {levelInfo.level}: {levelInfo.name}
            </span>
          </div>
        </div>

        {/* KYC Callout if not verified */}
        {!currentUser.isVerified && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold text-amber-900">Government ID Verification Required</p>
                <p className="text-amber-800">
                  Verify your citizen identity with PhilSys or Driver's License to unlock hazard reporting.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowKycModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition-colors shrink-0"
            >
              Submit ID (+25 pts)
            </button>
          </div>
        )}

        {/* Level Progression Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-700">Level Progression</span>
            <span className="text-slate-500 font-mono">{currentUser.points} pts / 500 pts</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Civic Badges & Certifications */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" /> Community Recognition Badges
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map(b => (
            <div
              key={b.title}
              className={`p-3.5 rounded-2xl border text-center space-y-1.5 transition-all ${
                b.earned
                  ? 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                  : 'bg-slate-50/40 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center font-bold text-xs ${
                  b.earned ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-400'
                }`}
              >
                ✓
              </div>
              <p className="font-extrabold text-xs">{b.title}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Registered Community Activities */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" /> My Volunteer Registrations
        </h3>

        {myActivities.length > 0 ? (
          <div className="space-y-3">
            {myActivities.map(act => (
              <div
                key={act.id}
                className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{act.title}</h4>
                  <p className="text-slate-500 mt-0.5">
                    {act.dateText} • {act.timeText} ({act.location})
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    +{act.rewardPoints} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs">
            No registered volunteer activities yet. Visit the Home tab to register for mangrove planting or coastal cleanups!
          </div>
        )}
      </div>

      {/* 4. Points Transaction History */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-slate-500" /> Eco-Points Audit History
        </h3>

        <div className="space-y-2">
          {userLogs.length > 0 ? (
            userLogs.map(log => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-800">{log.action}</p>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleDateString()} at{' '}
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className="font-bold text-emerald-700 font-mono text-sm">
                  +{log.points} pts
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No points transactions recorded yet.</p>
          )}
        </div>
      </div>

      {/* 5. Account Switcher & Sign Out */}
      <div className="bg-slate-100 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">
            Switch Demo Persona
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Test as Citizen, Environmental Field Officer, or CENRO Super Admin
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {allUsers.map(u => (
              <button
                key={u.id}
                onClick={() => switchUser(u.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
                  u.id === currentUser.id
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {u.name} ({u.role})
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={logout}
          className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
};
