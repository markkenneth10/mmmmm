import React, { useState } from 'react';
import {
  ShieldAlert, CloudSun, Megaphone, Calendar, Users, Settings,
  CheckCircle2, XCircle, Eye, EyeOff, Trash2, Award, Download
} from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const AdminScreen: React.FC = () => {
  const {
    reports, updateReportStatus,
    weather, updateWeather,
    announcements, addAnnouncement, toggleHideAnnouncement, deleteAnnouncement,
    activities, addActivity, toggleHideActivity, deleteActivity,
    participations, reviewParticipationProof,
    users, toggleUserStatus
  } = useClimate();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'overview' | 'triage' | 'weather' | 'announcements' | 'activities' | 'users' | 'settings'>('overview');
  const [actSubTab, setActSubTab] = useState<'manage' | 'proofs'>('manage');

  // New Announcement Form
  const [annTitle, setAnnTitle] = useState('');
  const [annCategory, setAnnCategory] = useState('Advisory');
  const [annPriority, setAnnPriority] = useState<'Normal' | 'High' | 'Critical'>('Normal');
  const [annContent, setAnnContent] = useState('');

  // New Activity Form
  const [actTitle, setActTitle] = useState('');
  const [actCategory, setActCategory] = useState('Tree Planting');
  const [actDate, setActDate] = useState('');
  const [actLocation, setActLocation] = useState('');
  const [actPoints, setActPoints] = useState(100);
  const [actDescription, setActDescription] = useState('');

  // Weather Form
  const [temp, setTemp] = useState(weather.temperature);
  const [heat, setHeat] = useState(weather.heatIndex);
  const [condition, setCondition] = useState(weather.condition);
  const [typhoon, setTyphoon] = useState(weather.typhoonSignal);
  const [notice, setNotice] = useState(weather.advisoryNotice);

  const pendingParticipations = participations.filter(p => p.status === 'Pending');

  const handleSaveWeather = (e: React.FormEvent) => {
    e.preventDefault();
    updateWeather({
      temperature: Number(temp),
      heatIndex: Number(heat),
      condition,
      typhoonSignal: typhoon,
      advisoryNotice: notice
    });
    alert('Weather & Climate Telemetry Updated!');
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    addAnnouncement({ title: annTitle, category: annCategory, priority: annPriority, content: annContent });
    setAnnTitle('');
    setAnnContent('');
    alert('Announcement published to citizen portal!');
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle) return;
    addActivity({ title: actTitle, category: actCategory, date: actDate, location: actLocation, points: actPoints, description: actDescription });
    setActTitle('');
    setActDescription('');
    alert('Community drive published!');
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-800/60">
              Administrative Control
            </span>
            <h1 className="text-2xl font-extrabold text-white">LGU CENRO Command Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Metro Verde Environmental Governance & Telemetry Management</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { id: 'overview', label: 'Command Center', icon: ShieldAlert },
          { id: 'triage', label: `Incident Triage (${reports.filter(r=>r.status!=='Resolved').length})`, icon: ShieldAlert },
          { id: 'weather', label: 'Weather Telemetry', icon: CloudSun },
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
          { id: 'activities', label: `Activities & Proofs (${pendingParticipations.length})`, icon: Calendar },
          { id: 'users', label: 'Citizen Roster', icon: Users },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeAdminSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: OVERVIEW */}
      {activeAdminSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-emerald-500">
              <div className="text-xs font-bold text-slate-400 uppercase">Total Incident Reports</div>
              <div className="text-3xl font-extrabold text-emerald-400 mt-1">{reports.length}</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-amber-500">
              <div className="text-xs font-bold text-slate-400 uppercase">Pending Proof Reviews</div>
              <div className="text-3xl font-extrabold text-amber-400 mt-1">{pendingParticipations.length}</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-sky-500">
              <div className="text-xs font-bold text-slate-400 uppercase">Registered Citizens</div>
              <div className="text-3xl font-extrabold text-sky-400 mt-1">{users.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TRIAGE */}
      {activeAdminSubTab === 'triage' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-extrabold text-white">Incident Triage & Field Unit Dispatch</h2>

          <div className="space-y-4">
            {reports.map(r => (
              <div key={r.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-sky-400">{r.id}</span>
                    <h3 className="text-base font-extrabold text-white">{r.title}</h3>
                  </div>

                  <select
                    value={r.status}
                    onChange={e => updateReportStatus(r.id, e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold focus:outline-none"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="In Inspection">In Inspection</option>
                    <option value="Action In Progress">Action In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <p className="text-xs text-slate-300">{r.description}</p>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    defaultValue={r.inspectionNotes || ''}
                    onBlur={e => updateReportStatus(r.id, r.status, e.target.value)}
                    placeholder="Add inspection remark or response unit assignment..."
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: WEATHER */}
      {activeAdminSubTab === 'weather' && (
        <div className="max-w-xl bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-extrabold text-white">Weather Telemetry & Emergency Advisories</h2>

          <form onSubmit={handleSaveWeather} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  value={temp}
                  onChange={e => setTemp(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Heat Index (°C)</label>
                <input
                  type="number"
                  value={heat}
                  onChange={e => setHeat(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Condition</label>
              <input
                type="text"
                value={condition}
                onChange={e => setCondition(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Typhoon Signal</label>
              <select
                value={typhoon}
                onChange={e => setTyphoon(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="None">None (Normal)</option>
                <option value="Signal 1">Signal #1</option>
                <option value="Signal 2">Signal #2</option>
                <option value="Signal 3">Signal #3</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Public Advisory Notice</label>
              <textarea
                value={notice}
                onChange={e => setNotice(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl">
              Broadcast Weather Update
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB 4: ANNOUNCEMENTS */}
      {activeAdminSubTab === 'announcements' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-white">Publish New Announcement</h2>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Title *</label>
                  <input
                    type="text"
                    value={annTitle}
                    onChange={e => setAnnTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Priority</label>
                  <select
                    value={annPriority}
                    onChange={e => setAnnPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Content *</label>
                <textarea
                  value={annContent}
                  onChange={e => setAnnContent(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <button type="submit" className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl">
                Publish Announcement
              </button>
            </form>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-white">Published Announcements List</h2>

            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-white">{a.title}</span>
                      {a.hidden && <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded-full">Hidden</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{a.content}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleHideAnnouncement(a.id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title={a.hidden ? 'Unhide' : 'Hide'}
                    >
                      {a.hidden ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-amber-400" />}
                    </button>
                    <button
                      onClick={() => deleteAnnouncement(a.id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: ACTIVITIES & PROOFS */}
      {activeAdminSubTab === 'activities' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActSubTab('manage')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold ${actSubTab === 'manage' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              Manage Activities
            </button>
            <button
              onClick={() => setActSubTab('proofs')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold ${actSubTab === 'proofs' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              Review Proofs Queue ({pendingParticipations.length})
            </button>
          </div>

          {actSubTab === 'manage' ? (
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-extrabold text-white">Add New Community Activity</h2>

                <form onSubmit={handleSaveActivity} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Title *</label>
                      <input
                        type="text"
                        value={actTitle}
                        onChange={e => setActTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                      <select
                        value={actCategory}
                        onChange={e => setActCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                      >
                        <option value="Tree Planting">Tree Planting</option>
                        <option value="River Cleanup">River Cleanup</option>
                        <option value="Zero Waste Workshop">Zero Waste Workshop</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Date & Time *</label>
                      <input
                        type="text"
                        value={actDate}
                        onChange={e => setActDate(e.target.value)}
                        placeholder="Saturday, Oct 24 • 7:00 AM"
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Location *</label>
                      <input
                        type="text"
                        value={actLocation}
                        onChange={e => setActLocation(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Points Awarded *</label>
                      <input
                        type="number"
                        value={actPoints}
                        onChange={e => setActPoints(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                    <textarea
                      value={actDescription}
                      onChange={e => setActDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <button type="submit" className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl">
                    Publish Community Activity
                  </button>
                </form>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-extrabold text-white">Published Activities List</h2>

                <div className="space-y-3">
                  {activities.map(act => (
                    <div key={act.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-white">{act.title}</span>
                          <span className="text-[10px] text-amber-400 font-bold">+{act.points} Pts</span>
                          {act.hidden && <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded-full">Hidden</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{act.date} • {act.location}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleHideActivity(act.id)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          {act.hidden ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-amber-400" />}
                        </button>
                        <button
                          onClick={() => deleteActivity(act.id)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-extrabold text-white">Citizen Participation Proof Verification Queue</h2>

              {participations.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">No participation proof submissions in queue.</div>
              ) : (
                <div className="space-y-4">
                  {participations.map(p => (
                    <div key={p.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-white">{p.activityTitle}</span>
                          <span className="text-xs font-extrabold text-amber-400">+{p.pointsAwarded} Pts</span>
                        </div>
                        <div className="text-xs text-slate-300 font-bold">{p.userName} ({p.userEmail})</div>
                        {p.proofDescription && <p className="text-xs text-slate-400">{p.proofDescription}</p>}

                        {p.status === 'Pending' ? (
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() => reviewParticipationProof(p.id, 'Approved')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg"
                            >
                              Approve & Grant +{p.pointsAwarded} Pts
                            </button>
                            <button
                              onClick={() => reviewParticipationProof(p.id, 'Rejected')}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg"
                            >
                              Reject Proof
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-emerald-400">Status: {p.status}</div>
                        )}
                      </div>

                      {p.proofImageUrl && (
                        <img src={p.proofImageUrl} alt="Proof" className="w-28 h-28 object-cover rounded-xl border border-slate-700 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 6: USERS */}
      {activeAdminSubTab === 'users' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-extrabold text-white">Citizen Roster & KYC Verification Queue</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Citizen</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Barangay</th>
                  <th className="p-3">KYC Status</th>
                  <th className="p-3">Eco-Points</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      {u.avatarUrl || u.avatar ? (
                        <img src={u.avatarUrl || u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                          {u.name.charAt(0)}
                        </div>
                      )}
                      <span>{u.name}</span>
                    </td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.barangay || 'Barangay Makilas'}</td>
                    <td className="p-3 font-bold text-amber-400">{u.kycStatus}</td>
                    <td className="p-3 font-extrabold text-emerald-400">{u.ecoPoints} Pts</td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg"
                      >
                        {u.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 7: SETTINGS & BACKUP */}
      {activeAdminSubTab === 'settings' && (
        <div className="max-w-md bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-extrabold text-white">Database Backup & Export</h2>
          <p className="text-xs text-slate-400">Export system JSON / SQLite database backup snapshot.</p>

          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `climate_database_${Date.now()}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Full System Backup (.json / .sqlite)</span>
          </button>
        </div>
      )}

    </div>
  );
};
