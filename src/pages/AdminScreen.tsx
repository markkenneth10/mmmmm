import React, { useState } from 'react';
import {
  ShieldAlert,
  LayoutDashboard,
  ClipboardList,
  UserCheck,
  SunMedium,
  Users,
  Search,
  CheckCircle,
  AlertTriangle,
  Send,
  PlusCircle,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { Report, ReportStatus, User } from '../types';

export const AdminScreen: React.FC = () => {
  const {
    currentUser,
    allUsers,
    reports,
    weather,
    updateReportStatus,
    updateWeather,
    approveKycUser,
    awardPointsToUser,
    setSelectedReport
  } = useClimate();

  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'triage' | 'kyc' | 'weather' | 'users'>('overview');

  // Triage state
  const [triageSearch, setTriageSearch] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<number | null>(reports[0]?.id || null);
  const [statusVal, setStatusVal] = useState<ReportStatus>('In Progress');
  const [officerVal, setOfficerVal] = useState('Officer Ricardo Reyes');
  const [remarksVal, setRemarksVal] = useState('');
  const [evidenceVal, setEvidenceVal] = useState('');

  // Weather state
  const [weatherAlertLevel, setWeatherAlertLevel] = useState(weather.alertLevel);
  const [weatherTemp, setWeatherTemp] = useState(weather.temp);
  const [weatherHeatIndex, setWeatherHeatIndex] = useState(weather.heatIndex);
  const [weatherAdvisory, setWeatherAdvisory] = useState(weather.advisoryText);

  // Users bonus state
  const [bonusUserId, setBonusUserId] = useState<number>(allUsers[0]?.id || 1);
  const [bonusAmount, setBonusAmount] = useState<number>(25);
  const [bonusReason, setBonusReason] = useState('Community Environmental Volunteer Commendation');

  const selectedReportToEdit = reports.find(r => r.id === selectedReportId);

  const handleTriageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportId || !remarksVal.trim()) return;
    updateReportStatus(selectedReportId, statusVal, remarksVal, officerVal, evidenceVal);
    setRemarksVal('');
  };

  const handleWeatherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWeather({
      alertLevel: weatherAlertLevel as any,
      temp: weatherTemp,
      heatIndex: weatherHeatIndex,
      advisoryText: weatherAdvisory
    });
  };

  const handleGrantBonus = (e: React.FormEvent) => {
    e.preventDefault();
    awardPointsToUser(bonusUserId, bonusAmount, bonusReason);
  };

  const criticalCount = reports.filter(r => r.severity === 'Critical' && r.status !== 'Resolved').length;
  const resolvedCount = reports.filter(r => r.status === 'Resolved').length;
  const resolutionRate = reports.length > 0 ? Math.round((resolvedCount / reports.length) * 100) : 0;
  const pendingKycUsers = allUsers.filter(u => !u.isVerified || u.kycStatus === 'pending');

  const filteredTriageReports = reports.filter(r => {
    if (!triageSearch) return true;
    const q = triageSearch.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.barangay.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full">
              LGU CENRO Executive Directorate
            </span>
            <span className="text-xs text-slate-300">Logged in as {currentUser?.name} ({currentUser?.role})</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">
            Administrative Command Console
          </h1>
          <p className="text-xs text-slate-400">
            Central Ecological Governance, Dispatch Orchestration & Telemetry System
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-1 bg-white/10 backdrop-blur-md p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveAdminTab('overview')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeAdminTab === 'overview' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveAdminTab('triage')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeAdminTab === 'triage' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Triage & Dispatch
          </button>
          <button
            onClick={() => setActiveAdminTab('kyc')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeAdminTab === 'kyc' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Citizen KYC</span>
            {pendingKycUsers.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-amber-950 text-[10px] flex items-center justify-center font-bold">
                {pendingKycUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveAdminTab('weather')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeAdminTab === 'weather' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Advisories
          </button>
          <button
            onClick={() => setActiveAdminTab('users')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeAdminTab === 'users' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Citizens
          </button>
        </div>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-600">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reports</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{reports.length}</p>
              <p className="text-xs text-emerald-700 mt-2 font-semibold">Resolution rate: {resolutionRate}%</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-red-500">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical Hazards</span>
              <p className="text-3xl font-black text-red-600 mt-1">{criticalCount}</p>
              <p className="text-xs text-slate-500 mt-2">Active CENRO alerts</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-blue-500">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Citizens</span>
              <p className="text-3xl font-black text-blue-600 mt-1">{allUsers.length}</p>
              <p className="text-xs text-slate-500 mt-2">
                {allUsers.filter(u => u.isVerified).length} verified reporters
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-amber-500">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Municipal Weather</span>
              <p className="text-3xl font-black text-amber-600 mt-1">{weather.alertLevel} Alert</p>
              <p className="text-xs text-slate-500 mt-2">{weather.temp}°C (Heat index {weather.heatIndex}°C)</p>
            </div>
          </div>

          {/* Urgent Priority Tickets */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-base">Urgent Priority Incidents (Active)</h3>
                <p className="text-xs text-slate-500">Critical hazards requiring immediate dispatch coordination</p>
              </div>
              <button
                onClick={() => setActiveAdminTab('triage')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Go to Triage Console &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Ticket</th>
                    <th className="py-2.5 px-3">Incident Title</th>
                    <th className="py-2.5 px-3">Barangay</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Assigned Unit</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports
                    .filter(r => r.severity === 'Critical' || r.status === 'Submitted')
                    .map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-mono font-bold text-slate-500">#{r.id}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{r.title}</td>
                        <td className="py-3 px-3 text-slate-600">{r.barangay}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              r.severity === 'Critical'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-700">{r.status}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {r.assignedOfficer || <span className="text-slate-400 italic">Unassigned</span>}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => {
                              setSelectedReportId(r.id);
                              setActiveAdminTab('triage');
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-200"
                          >
                            Dispatch
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. TRIAGE & DISPATCH TAB */}
      {activeAdminTab === 'triage' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Table / Select List (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-black text-slate-900 text-base">Select Incident to Triage</h3>
              <input
                type="text"
                value={triageSearch}
                onChange={e => setTriageSearch(e.target.value)}
                placeholder="Filter by title or barangay..."
                className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>

            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {filteredTriageReports.map(rep => {
                const isSelected = rep.id === selectedReportId;
                return (
                  <div
                    key={rep.id}
                    onClick={() => {
                      setSelectedReportId(rep.id);
                      setStatusVal(rep.status);
                      setOfficerVal(rep.assignedOfficer || 'Officer Ricardo Reyes');
                      setRemarksVal(rep.adminRemarks || '');
                      setEvidenceVal(rep.resolutionEvidence || '');
                    }}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-400">#{rep.id}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {rep.severity}
                        </span>
                        <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {rep.status}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-extrabold text-slate-900 mt-1">{rep.title}</h4>
                    <p className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">{rep.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 mt-1 border-t border-slate-200/60">
                      <span>{rep.barangay}</span>
                      <span>{new Date(rep.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Dispatch Editor (1 col) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-black text-slate-900 text-base">CENRO Dispatch Action</h3>

            {selectedReportToEdit ? (
              <form onSubmit={handleTriageSubmit} className="space-y-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-mono font-bold text-slate-400 text-[10px]">
                    Editing Ticket #{selectedReportToEdit.id}
                  </span>
                  <p className="font-extrabold text-slate-900 text-sm leading-tight">
                    {selectedReportToEdit.title}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Location: {selectedReportToEdit.barangay} ({selectedReportToEdit.latitude.toFixed(4)}, {selectedReportToEdit.longitude.toFixed(4)})
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Update Status</label>
                  <select
                    value={statusVal}
                    onChange={e => setStatusVal(e.target.value as ReportStatus)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:bg-white"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Verified">Verified</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Field Officer</label>
                  <input
                    type="text"
                    value={officerVal}
                    onChange={e => setOfficerVal(e.target.value)}
                    placeholder="e.g. Officer Ricardo Reyes"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Official Administrative Remarks *
                  </label>
                  <textarea
                    rows={3}
                    value={remarksVal}
                    onChange={e => setRemarksVal(e.target.value)}
                    placeholder="Document validation observations, municipal equipment dispatched, or citations issued..."
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Resolution Evidence</label>
                  <input
                    type="text"
                    value={evidenceVal}
                    onChange={e => setEvidenceVal(e.target.value)}
                    placeholder="e.g. 4 truckloads collected; drain unclogged"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Save Dispatch & Notify Citizen
                </button>
              </form>
            ) : (
              <p className="text-slate-400 text-xs">Select an incident from the left list to begin triage.</p>
            )}
          </div>
        </div>
      )}

      {/* 3. CITIZEN KYC TAB */}
      {activeAdminTab === 'kyc' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-black text-slate-900 text-base">Citizen Government ID Verifications</h3>
            <p className="text-xs text-slate-500">
              Review citizen verification requests to unlock hazard reporting credentials
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Citizen Name</th>
                  <th className="py-2.5 px-3">Email & Contact</th>
                  <th className="py-2.5 px-3">Barangay</th>
                  <th className="py-2.5 px-3">ID Type & Number</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-3 text-slate-500">{u.email}</td>
                    <td className="py-3 px-3 text-slate-600">{u.barangay}</td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-700 block">
                        {u.kycIdType || 'PhilSys / National ID'}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {u.kycIdNumber || 'ID-SUBMITTED-491'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {u.isVerified ? (
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                          Verified ✓
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800">
                          Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {!u.isVerified ? (
                        <button
                          onClick={() => approveKycUser(u.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-xs shadow-xs"
                        >
                          Approve KYC
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Verified Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. WEATHER & ADVISORIES TAB */}
      {activeAdminTab === 'weather' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-xl space-y-4">
          <div>
            <h3 className="font-black text-slate-900 text-base">Municipal Hazard Advisory Controller</h3>
            <p className="text-xs text-slate-500">
              Update live municipal heat index alerts and climate warning bulletins
            </p>
          </div>

          <form onSubmit={handleWeatherSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Municipal Alert Level</label>
              <select
                value={weatherAlertLevel}
                onChange={e => setWeatherAlertLevel(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:bg-white"
              >
                <option value="Normal">Normal (Green)</option>
                <option value="Yellow">Yellow (Caution / Extreme Heat)</option>
                <option value="Orange">Orange (High Risk)</option>
                <option value="Red">Red (Emergency / Evacuation)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ambient Temperature (°C)</label>
                <input
                  type="number"
                  value={weatherTemp}
                  onChange={e => setWeatherTemp(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Heat Index (°C)</label>
                <input
                  type="number"
                  value={weatherHeatIndex}
                  onChange={e => setWeatherHeatIndex(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Advisory Bulletin</label>
              <textarea
                rows={3}
                value={weatherAdvisory}
                onChange={e => setWeatherAdvisory(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:bg-white leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl shadow-sm transition-colors"
            >
              Broadcast Updated Advisory
            </button>
          </form>
        </div>
      )}

      {/* 5. CITIZEN USERS & BONUS POINTS TAB */}
      {activeAdminTab === 'users' && (
        <div className="space-y-6">
          {/* Grant Bonus Points */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Award Eco-Points Commendation
            </h4>
            <form onSubmit={handleGrantBonus} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Citizen</label>
                <select
                  value={bonusUserId}
                  onChange={e => setBonusUserId(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                >
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.points} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Points Amount</label>
                <input
                  type="number"
                  value={bonusAmount}
                  onChange={e => setBonusAmount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Commendation</label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={e => setBonusReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-lg transition-colors shadow-xs"
                >
                  Award Points
                </button>
              </div>
            </form>
          </div>

          {/* Citizens Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-black text-slate-900 text-base">Registered Citizens Registry</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Role</th>
                    <th className="py-2 px-3">Barangay</th>
                    <th className="py-2 px-3">Address</th>
                    <th className="py-2 px-3">Eco-Points</th>
                    <th className="py-2 px-3">KYC Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3 px-3 text-slate-600">{u.role}</td>
                      <td className="py-3 px-3 text-slate-600">{u.barangay}</td>
                      <td className="py-3 px-3 text-slate-500">{u.address}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                        {u.points} pts
                      </td>
                      <td className="py-3 px-3">
                        {u.isVerified ? (
                          <span className="text-emerald-700 font-semibold">Verified ✓</span>
                        ) : (
                          <span className="text-amber-600 font-semibold">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
