import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

const ID_TYPES = [
  'Philippine National ID (PhilSys)',
  "Driver's License (LTO)",
  'Unified Multi-Purpose ID (UMID)',
  "Voter's ID / Comelec Certificate",
  'Postal ID (Digital)',
  'Government / Civil Service ID',
  'Barangay Clearance ID'
];

export const KycModal: React.FC = () => {
  const { showKycModal, setShowKycModal, submitKyc, currentUser } = useClimate();

  const [idType, setIdType] = useState(ID_TYPES[0]);
  const [idNumber, setIdNumber] = useState('');

  if (!showKycModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumber.trim()) return;
    submitKyc(idType, idNumber);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-800 to-green-700 text-white relative">
          <button
            onClick={() => setShowKycModal(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2.5 border border-white/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-black tracking-tight">Citizen KYC Verification</h3>
          <p className="text-xs text-emerald-100/90 mt-0.5">
            LGU CENRO Citizen Identity Verification Gateway
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-emerald-950">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Why verify your identity?</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                To prevent spam and ensure genuine emergency dispatch, LGU CENRO requires a valid government ID before lodging incident tickets. You also earn <span className="font-bold text-emerald-700">+25 Eco-Points</span>.
              </p>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Select Official Identification Type *
            </label>
            <div className="relative">
              <select
                value={idType}
                onChange={e => setIdType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-emerald-600 font-medium"
              >
                {ID_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Government ID Serial Number *
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={idNumber}
                onChange={e => setIdNumber(e.target.value)}
                placeholder="e.g. 4819-2049-1823 or D02-18-091823"
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-emerald-600 font-medium font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Protected under Republic Act 10173 (Data Privacy Act of 2012).
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" /> Verify Identity & Unlock Reporting (+25 pts)
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={() => setShowKycModal(false)}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
