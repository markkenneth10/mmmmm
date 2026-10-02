import React, { useState } from 'react';
import { X, ShieldCheck, Upload, CheckCircle } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const KycModal: React.FC = () => {
  const { kycModalOpen, setKycModalOpen, currentUser, updateUserKyc } = useClimate();
  const [idType, setIdType] = useState('Philippine Passport');
  const [idNumber, setIdNumber] = useState('');
  const [docPhoto, setDocPhoto] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!kycModalOpen) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setDocPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !idNumber) return;

    updateUserKyc(currentUser.id, {
      kycStatus: 'pending',
      kycIdType: idType,
      kycIdNumber: idNumber,
      kycDocument: docPhoto
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setKycModalOpen(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={() => setKycModalOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-white">ID Documents Submitted!</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Your government ID has been placed in the CENRO verification queue. Review typically completes within 24 hours.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-800/60 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Citizen Identity Verification (KYC)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Verify your identity with a valid government ID to unlock authorized reporter badges.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Government ID Type *</label>
                <select
                  value={idType}
                  onChange={e => setIdType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Philippine Passport">Philippine Passport</option>
                  <option value="Driver's License">Driver's License</option>
                  <option value="SSS / UMID ID">SSS / UMID ID</option>
                  <option value="PhilHealth ID">PhilHealth ID</option>
                  <option value="Postal ID">Postal ID</option>
                  <option value="Voter's ID">Voter's ID / Certification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ID Card Number *</label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={e => setIdNumber(e.target.value)}
                  placeholder="e.g. N01-12-345678"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Attach Clear ID Photo *</label>
                <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-800/30">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    required
                  />
                  {docPhoto ? (
                    <div>
                      <img src={docPhoto} alt="ID Document" className="max-h-32 mx-auto rounded-lg border border-emerald-500" />
                      <span className="block text-[10px] text-emerald-400 font-bold mt-2">Click to replace photo</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                      <div className="text-xs font-bold text-slate-200">Upload Front Photo of ID</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Ensure text and photo are clearly readable</div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                Submit ID Documents for Admin Verification
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
