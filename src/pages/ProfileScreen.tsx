import React from 'react';
import { User as UserIcon, Shield, Award, Camera, CheckCircle, Clock, XCircle, LogOut } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const ProfileScreen: React.FC = () => {
  const {
    currentUser, setCurrentUser,
    participations, setKycModalOpen, setAuthModalOpen
  } = useClimate();

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-white">Citizen Sign In Required</h2>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Sign in to view your Eco-Points balance, track submitted activity proofs, and manage government ID verification.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-all"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  const userParticipations = participations.filter(p => p.userId === currentUser.id || p.userEmail === currentUser.email);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const photo = event.target?.result as string;
      setCurrentUser(prev => prev ? { ...prev, avatarUrl: photo, avatar: photo } : null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Profile Header Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 font-extrabold text-2xl overflow-hidden shadow-lg">
                {currentUser.avatarUrl || currentUser.avatar ? (
                  <img src={currentUser.avatarUrl || currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser.name.charAt(0)}</span>
                )}
              </div>
              <label
                htmlFor="avatar-input"
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md transition-transform active:scale-95"
                title="Upload Profile Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </label>
              <input type="file" id="avatar-input" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-xl font-extrabold text-white">{currentUser.fullName || currentUser.name}</h2>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  currentUser.kycStatus === 'verified'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border-amber-800'
                }`}>
                  {currentUser.kycStatus === 'verified' ? 'Verified Citizen' : 'KYC Unverified'}
                </span>
              </div>
              <div className="text-xs text-slate-400">{currentUser.email} • {currentUser.barangay || 'Barangay Makilas'}</div>
            </div>
          </div>

          <button
            onClick={() => setCurrentUser(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
          <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3 text-center">
            <div className="text-[10px] font-bold text-emerald-400 uppercase">Eco-Points Balance</div>
            <div className="text-2xl font-extrabold text-emerald-300 mt-0.5">{currentUser.ecoPoints}</div>
          </div>

          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Joined Movements</div>
            <div className="text-2xl font-extrabold text-white mt-0.5">{userParticipations.length}</div>
          </div>

          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase">KYC Verification</div>
            <button
              onClick={() => setKycModalOpen(true)}
              className="mt-1 text-xs font-bold text-emerald-400 hover:underline"
            >
              {currentUser.kycStatus === 'verified' ? 'ID Verified ✓' : 'Verify ID Now →'}
            </button>
          </div>
        </div>
      </div>

      {/* My Joined Movements & Submitted Proofs Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-extrabold text-white">My Joined Movements & Participation Proofs</h3>

        {userParticipations.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            You have not submitted participation proof photos for any community activities yet. Browse upcoming drives to claim Eco-Points!
          </div>
        ) : (
          <div className="space-y-3">
            {userParticipations.map(p => {
              let badgeStyle = 'bg-amber-950 text-amber-300 border-amber-800';
              let badgeText = 'Pending Admin Review';
              if (p.status === 'Approved') {
                badgeStyle = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                badgeText = `Approved (+${p.pointsAwarded} Pts)`;
              } else if (p.status === 'Rejected') {
                badgeStyle = 'bg-rose-950 text-rose-300 border-rose-800';
                badgeText = 'Rejected';
              }

              return (
                <div key={p.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                        {badgeText}
                      </span>
                      <h4 className="text-sm font-extrabold text-white">{p.activityTitle}</h4>
                    </div>
                    {p.proofDescription && (
                      <p className="text-xs text-slate-300">{p.proofDescription}</p>
                    )}
                    <div className="text-[10px] text-slate-400">Submitted {new Date(p.submittedAt).toLocaleDateString()}</div>
                  </div>

                  {p.proofImageUrl && (
                    <img src={p.proofImageUrl} alt="Proof" className="w-20 h-20 object-cover rounded-xl border border-slate-700 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
