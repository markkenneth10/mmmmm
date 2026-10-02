import React from 'react';
import { X, MapPin, ThumbsUp, Calendar, AlertTriangle, Shield, CheckCircle2, Clock } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const ReportDetailModal: React.FC = () => {
  const { selectedReportModal, setSelectedReportModal, upvoteReport } = useClimate();

  if (!selectedReportModal) return null;

  const r = selectedReportModal;

  const getStatusStepClass = (step: string) => {
    const statuses = ['Submitted', 'In Inspection', 'Action In Progress', 'Resolved'];
    const currentIndex = statuses.indexOf(r.status);
    const stepIndex = statuses.indexOf(step);

    if (stepIndex < currentIndex) return 'bg-emerald-600 text-white';
    if (stepIndex === currentIndex) return 'bg-emerald-500 text-white ring-4 ring-emerald-500/20';
    return 'bg-slate-800 text-slate-500 border border-slate-700';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <button
          onClick={() => setSelectedReportModal(null)}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800/60">
            {r.id}
          </span>
          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
            {r.category}
          </span>
        </div>

        <h3 className="text-2xl font-extrabold text-white mb-2">{r.title}</h3>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mb-6">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>{r.barangay} • {r.locationText || 'Location Recorded'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Reported {new Date(r.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 mb-6">
          <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-4">
            CENRO Dispatch Status Timeline
          </h4>

          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { id: 'Submitted', label: 'Reported' },
              { id: 'In Inspection', label: 'Inspecting' },
              { id: 'Action In Progress', label: 'Action' },
              { id: 'Resolved', label: 'Resolved' }
            ].map(step => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${getStatusStepClass(step.id)}`}>
                  {step.id === 'Resolved' && r.status === 'Resolved' ? <CheckCircle2 className="w-4 h-4" /> : step.id.charAt(0)}
                </div>
                <span className="text-[10px] font-bold text-slate-300">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inspection Remark Banner */}
        {r.inspectionNotes && (
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 mb-6 flex gap-3">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-emerald-400">CENRO Field Remark</div>
              <p className="text-xs text-slate-200 mt-0.5">{r.inspectionNotes}</p>
            </div>
          </div>
        )}

        {/* Description & Photo */}
        <div className="space-y-4 mb-6">
          <div>
            <h4 className="text-xs font-bold text-slate-400 mb-1">Hazard Description</h4>
            <p className="text-sm text-slate-200 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              {r.description}
            </p>
          </div>

          {r.photoUrl && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 mb-1">Uploaded Evidence Photo</h4>
              <img
                src={r.photoUrl}
                alt={r.title}
                className="w-full max-h-72 object-cover rounded-xl border border-slate-800"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => upvoteReport(r.id)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all"
          >
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
            <span>Upvote Priority ({r.upvotes})</span>
          </button>

          <button
            onClick={() => setSelectedReportModal(null)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
