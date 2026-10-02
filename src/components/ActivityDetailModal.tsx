import React, { useState } from 'react';
import { X, Calendar, MapPin, Award, Upload, Camera, CheckCircle } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const ActivityDetailModal: React.FC = () => {
  const {
    selectedActivityModal, setSelectedActivityModal,
    currentUser, submitParticipationProof, setAuthModalOpen
  } = useClimate();

  const [proofPhoto, setProofPhoto] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!selectedActivityModal) return null;

  const act = selectedActivityModal;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setProofPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    if (!proofPhoto) return;

    submitParticipationProof({
      activityId: act.id,
      activityTitle: act.title,
      proofImageUrl: proofPhoto,
      proofDescription: description,
      pointsAwarded: act.points
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedActivityModal(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setSelectedActivityModal(null)}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Proof Submitted!</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Your participation proof photo has been sent to CENRO administration for review. You will receive +{act.points} Eco-Points upon approval.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800/60">
                  {act.category}
                </span>
                <span className="text-xs font-extrabold text-amber-400 bg-amber-950 px-2.5 py-1 rounded-full border border-amber-800/60">
                  +{act.points} Eco-Points
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-white">{act.title}</h3>
            </div>

            <div className="space-y-2 text-xs text-slate-300 mb-6 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{act.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{act.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Organized by {act.organizer}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              {act.description}
            </p>

            {/* Proof Upload Form */}
            <form onSubmit={handleSubmitProof} className="space-y-4 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                Submit Participation Photo Proof
              </h4>

              <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-800/30">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  required
                />
                {proofPhoto ? (
                  <div>
                    <img src={proofPhoto} alt="Proof" className="max-h-36 mx-auto rounded-lg border border-emerald-500" />
                    <span className="block text-[10px] text-emerald-400 font-bold mt-2">Click to change photo</span>
                  </div>
                ) : (
                  <div>
                    <Camera className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                    <div className="text-xs font-bold text-slate-200">Click to Select / Take Photo</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Attach photo showing your attendance at venue</div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Participation Remarks (Optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your role or what you accomplished..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-all"
              >
                Submit Proof for Admin Verification
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
