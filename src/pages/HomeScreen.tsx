import React from 'react';
import {
  SunMedium,
  AlertTriangle,
  MapPin,
  BookOpen,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  ChevronRight,
  Flame,
  FileText
} from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const HomeScreen: React.FC = () => {
  const {
    weather,
    reports,
    activities,
    articles,
    setActiveTab,
    setSelectedReport,
    setSelectedActivity,
    setSelectedArticle,
    setShowQuizModal,
    currentUser,
    openAuthModal,
    setShowKycModal
  } = useClimate();

  const activeHazardsCount = reports.filter(r => r.status !== 'Resolved' && r.status !== 'Closed').length;
  const criticalCount = reports.filter(r => r.severity === 'Critical' && r.status !== 'Resolved').length;
  const resolvedCount = reports.filter(r => r.status === 'Resolved').length;
  const resolutionRate = reports.length > 0 ? Math.round((resolvedCount / reports.length) * 100) : 0;

  const handleStartReport = () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    if (!currentUser.isVerified || currentUser.kycStatus !== 'verified') {
      setActiveTab('Report');
      setShowKycModal(true);
      return;
    }
    setActiveTab('Report');
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'Verified':
        return 'bg-purple-50 text-purple-700 border-purple-300';
      case 'Under Review':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Official Weather & Climate Alert Hero Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 text-white shadow-xl p-6 sm:p-8">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 border border-emerald-500/40">
              <SunMedium className="w-4 h-4 text-amber-300" />
              <span>PAGASA & CENRO Environmental Bulletin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Metro Verde Climate Action Portal
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Empowering citizens to report hazards, track municipal triage lifecycles, and build a climate-resilient future together.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                onClick={handleStartReport}
                className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" /> Report Environmental Problem
              </button>
              <button
                onClick={() => setShowQuizModal(true)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm border border-white/20 backdrop-blur-sm transition-all flex items-center gap-2"
              >
                <Award className="w-4 h-4 text-amber-300" /> Take Climate Quiz (+10 pts)
              </button>
            </div>
          </div>

          {/* Weather Widget */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 shrink-0 min-w-[240px] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                Current Conditions
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-400 text-amber-950">
                {weather.alertLevel} Alert
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{weather.temp}°C</span>
              <span className="text-xs text-emerald-200">
                Heat Index: <span className="font-bold text-amber-300">{weather.heatIndex}°C</span>
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 leading-snug">{weather.advisoryText}</p>
            <div className="pt-2 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-[10px]">
              <div>
                <span className="text-emerald-300 block">Humidity</span>
                <span className="font-bold text-white">{weather.humidity}%</span>
              </div>
              <div>
                <span className="text-emerald-300 block">Wind</span>
                <span className="font-bold text-white">{weather.windSpeed} km/h</span>
              </div>
              <div>
                <span className="text-emerald-300 block">AQI</span>
                <span className="font-bold text-white">{weather.airQualityIndex} (Good)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Hub (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={handleStartReport}
          className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Report Incident</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Submit geotagged hazard photos</p>
          </div>
          <div className="mt-3 flex items-center text-xs font-bold text-red-600">
            <span>File ticket</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('Map')}
          className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Interactive GIS Map</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Live municipal incident pins</p>
          </div>
          <div className="mt-3 flex items-center text-xs font-bold text-emerald-700">
            <span>Explore sectors</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('Learn')}
          className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Verified Knowledge</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Expert guides & action tips</p>
          </div>
          <div className="mt-3 flex items-center text-xs font-bold text-blue-700">
            <span>Browse articles</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </button>

        <button
          onClick={() => setShowQuizModal(true)}
          className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Climate Action Quiz</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Test knowledge & earn points</p>
          </div>
          <div className="mt-3 flex items-center text-xs font-bold text-purple-700">
            <span>Start quiz</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </button>
      </div>

      {/* 3. Municipal Telemetry Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-600">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Citizen Reports</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{reports.length}</span>
            <span className="text-xs font-bold text-emerald-600">{resolutionRate}% resolved</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${resolutionRate}%` }} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-red-500">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Critical Hazards Active</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-red-600">{criticalCount}</span>
            <span className="text-xs text-slate-500">{activeHazardsCount} active tickets</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Requires CENRO field dispatch</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-blue-500">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Community Eco-Points</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-blue-600">
              {currentUser ? currentUser.points : 290}
            </span>
            <span className="text-xs font-bold text-emerald-600">+10 per report</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Redeemable for saplings & seeds</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-amber-500">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Hazard Advisory Level</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-600">{weather.alertLevel} Alert</span>
            <span className="text-xs text-slate-500">Heat index 38°C</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Active across Metro Verde</p>
        </div>
      </div>

      {/* 4. Priority Urgent Incident Reports */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Recent Environmental Incident Reports
            </h2>
            <p className="text-xs text-slate-500">
              Real-time community reports undergoing validation and municipal mitigation
            </p>
          </div>
          <button
            onClick={() => setActiveTab('Report')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reports.slice(0, 4).map(report => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50/70 transition-all cursor-pointer space-y-2.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-400 font-mono">
                    #{report.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getSeverityBadge(
                        report.severity
                      )}`}
                    >
                      {report.severity}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(
                        report.status
                      )}`}
                    >
                      {report.status}
                    </span>
                  </div>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 mt-1 line-clamp-1">
                  {report.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                  {report.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  {report.barangay}
                </span>
                <span>{new Date(report.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Community Climate Activities & Volunteer Drives */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Upcoming Community Restoration Activities
            </h2>
            <p className="text-xs text-slate-500">
              Join local mangrove planting, beach cleanups, and earn certified eco-rewards
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activities.map(act => (
            <div
              key={act.id}
              onClick={() => setSelectedActivity(act)}
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50/50 transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    {act.category}
                  </span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> +{act.rewardPoints} pts
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 mt-2">{act.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-2 mt-1">{act.description}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> {act.dateText}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {act.timeText}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-600">{act.currentParticipants} volunteers joined</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      act.isRegistered ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {act.isRegistered ? 'Confirmed ✓' : 'Register →'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Featured Climate Articles */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Verified Climate Intelligence
            </h2>
            <p className="text-xs text-slate-500">
              Science-backed educational briefs for households and schools
            </p>
          </div>
          <button
            onClick={() => setActiveTab('Learn')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>All Articles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {articles.slice(0, 3).map(art => (
            <div
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50/70 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {art.category}
                </span>
                <h4 className="font-extrabold text-sm text-slate-900 mt-2 line-clamp-2">
                  {art.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{art.summary}</p>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-400 text-[11px]">{art.readTimeMinutes} min read</span>
                <span className="font-bold text-emerald-700 hover:underline">Read Guide &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
