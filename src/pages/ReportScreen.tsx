import React, { useState } from 'react';
import {
  AlertTriangle,
  MapPin,
  Camera,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  PlusCircle,
  ListFilter
} from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { IncidentMapPicker } from '../components/IncidentMapPicker';
import { BARANGAYS, REPORT_CATEGORIES } from '../data/initialData';
import { ReportSeverity } from '../types';

export const ReportScreen: React.FC = () => {
  const {
    currentUser,
    reports,
    submitReport,
    setSelectedReport,
    openAuthModal,
    setShowKycModal
  } = useClimate();

  const [activeSubTab, setActiveSubTab] = useState<'submit' | 'list'>('submit');

  // New report form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(REPORT_CATEGORIES[0].label);
  const [severity, setSeverity] = useState<ReportSeverity>('High');
  const [barangay, setBarangay] = useState(currentUser?.barangay || BARANGAYS[0]);
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(14.5995);
  const [longitude, setLongitude] = useState(120.9842);
  const [photoUri, setPhotoUri] = useState('/assets/climate_hero_banner.jpg');

  // Filter state for report list
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('');
  const [onlyMyReports, setOnlyMyReports] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const ok = submitReport({
      title,
      category,
      severity,
      barangay,
      description,
      latitude,
      longitude,
      photoUri
    });

    if (ok) {
      setTitle('');
      setDescription('');
      setActiveSubTab('list');
    }
  };

  // Filtered reports
  const filteredReports = reports.filter(r => {
    if (onlyMyReports && currentUser && r.userId !== currentUser.id) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.barangay.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (categoryFilter && r.category !== categoryFilter) return false;
    if (severityFilter && r.severity !== severityFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (barangayFilter && r.barangay !== barangayFilter) return false;
    return true;
  });

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
      {/* Top Header & Sub-Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Environmental Incident Reporting
          </h1>
          <p className="text-xs text-slate-500">
            Submit verified municipal hazard reports or track resolution lifecycles
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveSubTab('submit')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'submit'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>File New Incident</span>
          </button>
          <button
            onClick={() => setActiveSubTab('list')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'list'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Incident Directory ({reports.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'submit' ? (
        /* SUB-TAB 1: FILE NEW REPORT */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            {/* KYC or Sign-in warning if unverified */}
            {!currentUser ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-amber-900">Sign in required to submit reports</h4>
                  <p className="text-amber-800 mt-0.5">
                    Official reports require verified citizen credentials to coordinate municipal dispatch.
                  </p>
                </div>
                <button
                  onClick={() => openAuthModal('login')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg shrink-0 shadow-xs"
                >
                  Sign In
                </button>
              </div>
            ) : !currentUser.isVerified || currentUser.kycStatus !== 'verified' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-amber-900">Government ID (KYC) Verification Required</h4>
                  <p className="text-amber-800 mt-0.5">
                    Please submit a valid PhilSys National ID or Driver's License number to enable emergency incident reporting.
                  </p>
                </div>
                <button
                  onClick={() => setShowKycModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg shrink-0 shadow-xs"
                >
                  Verify KYC (+25 pts)
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-950 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Verified Citizen Reporter: {currentUser.name} ({currentUser.barangay}) • Earn +10 Eco-Points upon submission
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Incident Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Uncollected plastic waste dump near creek bridge"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-emerald-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Environmental Category *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-emerald-600 font-medium"
                  >
                    {REPORT_CATEGORIES.map(cat => (
                      <option key={cat.label} value={cat.label}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Barangay Location *
                  </label>
                  <select
                    value={barangay}
                    onChange={e => setBarangay(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-emerald-600 font-medium"
                  >
                    {BARANGAYS.map(b => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Severity Level *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Critical', 'High', 'Moderate', 'Low'] as ReportSeverity[]).map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        severity === sev
                          ? sev === 'Critical'
                            ? 'bg-red-600 text-white border-red-600 shadow-sm'
                            : sev === 'High'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : sev === 'Moderate'
                            ? 'bg-yellow-500 text-white border-yellow-500 shadow-sm'
                            : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Detailed Incident Description *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the nature of the hazard, scope of impact, estimated duration, and landmarks to assist response units..."
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-emerald-600 font-medium leading-relaxed"
                />
              </div>

              {/* Geotagged GIS Map Location Picker */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" /> Precise GIS Geotag Location
                  </span>
                  <span className="text-[11px] text-slate-500">Click map or drag pin</span>
                </label>
                <IncidentMapPicker
                  latitude={latitude}
                  longitude={longitude}
                  onChangeLocation={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                  height="220px"
                />
              </div>

              {/* Photo Evidence */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" /> Photo Documentation
                  </span>
                  <span className="text-[11px] text-slate-500">Preset demonstration photo</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-300 shrink-0">
                    <img src={photoUri} alt="Evidence" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs space-y-1 text-slate-500">
                    <p className="font-semibold text-slate-700">Official Geo-evidence Tagged</p>
                    <p className="text-[11px]">Includes embedded timestamp and GPS signature.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!currentUser || !currentUser.isVerified}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold py-3 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Send className="w-4 h-4" /> Submit Report to CENRO (+10 pts)
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar Info (1 col) */}
          <div className="space-y-4">
            <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-md space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-700/60 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <h3 className="font-bold text-sm">Official CENRO Triage Protocol</h3>
              <ul className="text-xs text-emerald-100 space-y-2 list-disc list-inside">
                <li><span className="font-semibold text-white">Critical tickets</span> are dispatched within 2 hours.</li>
                <li><span className="font-semibold text-white">High severity</span> verified within 6 hours.</li>
                <li>Updates logged by CENRO officers with resolution evidence.</li>
              </ul>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3 text-xs text-slate-600">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Citizen Eco-Points Reward
              </h4>
              <p>Every genuine report with verified evidence earns <span className="font-bold text-emerald-700">+10 Eco-Points</span> for your citizen profile.</p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                <span className="font-bold text-slate-800 block">Rewards Exchange:</span>
                <p>• 100 pts: Fruit tree sapling at City Hall</p>
                <p>• 250 pts: Home composting starter kit</p>
                <p>• 500 pts: Mayor's Green Citizen Award</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SUB-TAB 2: INCIDENT DIRECTORY & SEARCH */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by keywords, incident title, or street..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-emerald-600 font-medium"
                />
              </div>

              {currentUser && (
                <button
                  type="button"
                  onClick={() => setOnlyMyReports(!onlyMyReports)}
                  className={`px-3 py-2 rounded-xl font-bold border transition-colors shrink-0 ${
                    onlyMyReports
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  My Submissions Only
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
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

          {/* Report Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.length > 0 ? (
              filteredReports.map(report => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
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

                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2">
                      {report.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{report.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {report.barangay}
                      </span>
                      <span className="text-[11px]">
                        {new Date(report.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    {report.assignedOfficer && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Officer: {report.assignedOfficer}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs space-y-2">
                <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-600">No incident reports found matching filters.</p>
                <p>Try resetting filters or search terms.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
