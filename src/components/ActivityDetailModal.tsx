import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  CheckCircle2,
  Upload,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { Activity } from '../types';
import { useClimate } from '../context/ClimateContext';

interface ActivityDetailModalProps {
  activity: Activity;
  onClose: () => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ activity, onClose }) => {
  const { currentUser, toggleActivityRegistration, submitActivityProof, openAuthModal } = useClimate();
  const [proofNote, setProofNote] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  const percentFull = Math.min(100, Math.round((activity.currentParticipants / activity.maxParticipants) * 100));

  const handleRegister = () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    toggleActivityRegistration(activity.id);
  };

  const handleProofSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofNote.trim()) return;
    submitActivityProof(activity.id, proofNote, activity.rewardPoints);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              {activity.category}
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> +{activity.rewardPoints} Eco-Points
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {activity.title}
            </h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{activity.dateText}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{activity.timeText}</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{activity.location} ({activity.barangay})</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Activity Overview
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">{activity.description}</p>
          </div>

          {/* Capacity Progress */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" /> Volunteer Slots
              </span>
              <span className="font-bold text-emerald-800">
                {activity.currentParticipants} / {activity.maxParticipants} Registered ({percentFull}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-emerald-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${percentFull}%` }}
              />
            </div>
          </div>

          {/* Registration & Proof Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Volunteer Status</p>
                <p className="text-xs text-slate-500">
                  {activity.isRegistered
                    ? 'You are confirmed for this environmental activity.'
                    : 'Join your fellow citizens and earn community recognition.'}
                </p>
              </div>
              <button
                onClick={handleRegister}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  activity.isRegistered
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                {activity.isRegistered ? 'Cancel Registration' : 'Register Now'}
              </button>
            </div>

            {/* Proof submission form if registered */}
            {activity.isRegistered && !activity.isCompleted && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3 mt-4">
                <div className="flex items-start gap-2">
                  <FileCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-900">
                      Submit Proof of Attendance to Claim Reward
                    </h5>
                    <p className="text-[11px] text-amber-800">
                      Attended this activity? Enter your field note or photo confirmation to receive +{activity.rewardPoints} Eco-Points.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleProofSubmit} className="space-y-2">
                  <textarea
                    rows={2}
                    value={proofNote}
                    onChange={e => setProofNote(e.target.value)}
                    placeholder="e.g. Attended 06:30 AM planting brigade with Brgy Makilas youth group; planted 25 Rhizophora saplings."
                    required
                    className="w-full text-xs bg-white border border-amber-300 rounded-lg p-2.5 text-slate-800 focus:outline-emerald-600"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Submit Proof & Claim Points
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activity.isCompleted && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-900 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">Participation Verified!</span>
                  <span className="text-[11px] text-emerald-700">
                    +{activity.rewardPoints} Eco-Points have been credited to your citizen balance.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
