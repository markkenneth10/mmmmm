import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  AlertTriangle,
  User,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileCheck,
  Send,
  MessageSquare
} from 'lucide-react';
import { Report, ReportStatus } from '../types';
import { useClimate } from '../context/ClimateContext';

interface ReportDetailModalProps {
  report: Report;
  onClose: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, onClose }) => {
  const { reportUpdates, currentUser, updateReportStatus } = useClimate();

  const [newStatus, setNewStatus] = useState<ReportStatus>(report.status);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [assignedOfficer, setAssignedOfficer] = useState(report.assignedOfficer || 'Officer Ricardo Reyes');
  const [resolutionEvidence, setResolutionEvidence] = useState(report.resolutionEvidence || '');

  const isStaff = currentUser?.role === 'Administrator' || currentUser?.role === 'Environmental Officer';

  const updatesForThisReport = reportUpdates.filter(u => u.reportId === report.id);

  const steps: ReportStatus[] = ['Submitted', 'Under Review', 'Verified', 'In Progress', 'Resolved'];

  const getStepIndex = (status: ReportStatus) => {
    switch (status) {
      case 'Submitted':
        return 0;
      case 'Under Review':
        return 1;
      case 'Verified':
        return 2;
      case 'In Progress':
        return 3;
      case 'Resolved':
      case 'Closed':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(report.status);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminRemarks.trim()) return;
    updateReportStatus(report.id, newStatus, adminRemarks, assignedOfficer, resolutionEvidence);
    setAdminRemarks('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
              Ticket #{report.id}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getSeverityBadge(
                report.severity
              )}`}
            >
              {report.severity} Severity
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Title & Category */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              {report.category}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-2">{report.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {report.barangay}, {report.municipality}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(report.timestamp).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Reported by {report.authorName}
              </span>
            </div>
          </div>

          {/* Photo Evidence */}
          {report.photoUri && (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-64 flex items-center justify-center">
              <img
                src={report.photoUri}
                alt={report.title}
                className="w-full h-full object-cover"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Incident Description */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Incident Description
            </h4>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {report.description}
            </p>
          </div>

          {/* Location Coordinates */}
          <div className="flex items-center justify-between text-xs bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
            <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" /> Geotagged Coordinates
            </span>
            <span className="font-mono text-emerald-800 font-bold">
              {report.latitude.toFixed(5)}° N, {report.longitude.toFixed(5)}° E
            </span>
          </div>

          {/* Lifecycle Progress Stepper */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Resolution Lifecycle
            </h4>
            <div className="relative flex items-center justify-between px-2">
              <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-200 -translate-y-1/2 -z-0" />
              <div
                className="absolute top-1/2 left-4 h-1 bg-emerald-500 -translate-y-1/2 -z-0 transition-all duration-300"
                style={{
                  width: `${(currentStepIdx / (steps.length - 1)) * 92}%`
                }}
              />
              {steps.map((st, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={st} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white text-slate-400 border-2 border-slate-300'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 font-semibold text-center ${
                        isCurrent ? 'text-emerald-700 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {st}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assigned Officer & Resolution Evidence */}
          {(report.assignedOfficer || report.resolutionEvidence) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {report.assignedOfficer && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-500 block">Assigned Officer</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    {report.assignedOfficer}
                  </span>
                </div>
              )}
              {report.resolutionEvidence && (
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                  <span className="font-semibold text-emerald-700 block">Resolution Evidence</span>
                  <span className="font-medium text-emerald-900 mt-0.5 block flex items-center gap-1">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    {report.resolutionEvidence}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Timeline of Updates */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Official CENRO Timeline & Logs
            </h4>
            <div className="space-y-3">
              {updatesForThisReport.length > 0 ? (
                updatesForThisReport.map(u => (
                  <div
                    key={u.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        Status changed to: <span className="text-emerald-700">{u.status}</span>
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(u.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600">{u.remarks}</p>
                    <p className="text-[11px] text-slate-400 italic">Logged by: {u.updatedBy}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No updates logged yet.</p>
              )}
            </div>
          </div>

          {/* Staff Triage Control Panel (If Admin or Environmental Officer) */}
          {isStaff && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" /> CENRO Staff Dispatch & Triage
              </h4>
              <form onSubmit={handleUpdate} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Update Incident Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value as ReportStatus)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-emerald-600"
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
                    <label className="block font-semibold text-slate-700 mb-1">
                      Assigned Field Officer
                    </label>
                    <input
                      type="text"
                      value={assignedOfficer}
                      onChange={e => setAssignedOfficer(e.target.value)}
                      placeholder="e.g. Officer Ricardo Reyes"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Administrative Remarks *
                  </label>
                  <textarea
                    rows={2}
                    value={adminRemarks}
                    onChange={e => setAdminRemarks(e.target.value)}
                    placeholder="Enter dispatch notes, validation results, or municipal actions taken..."
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Resolution Evidence (if resolving)
                  </label>
                  <input
                    type="text"
                    value={resolutionEvidence}
                    onChange={e => setResolutionEvidence(e.target.value)}
                    placeholder="e.g. Drainage declogged, illegal dump cleared with 2 truckloads"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-emerald-600"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Status Update
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
