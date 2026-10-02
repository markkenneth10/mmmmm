import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { BARANGAYS } from '../data/initialData';

export const AuthModal: React.FC = () => {
  const {
    showAuthModal,
    closeAuthModal,
    authModalMode,
    loginCitizen,
    registerCitizen,
    openAuthModal,
    switchUser,
    allUsers
  } = useClimate();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('john.santos@climateaction.org');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBarangay, setRegBarangay] = useState(BARANGAYS[0]);
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');

  if (!showAuthModal) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginCitizen(loginEmail, loginPassword);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerCitizen({
      name: regName,
      email: regEmail,
      phone: regPhone,
      barangay: regBarangay,
      address: regAddress,
      password: regPassword
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-emerald-800 to-green-700 text-white relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 border border-white/20">
            <User className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-black tracking-tight">Citizen Action Gateway</h3>
          <p className="text-xs text-emerald-100/90 mt-0.5">
            City of Metro Verde • Environmental Reporting & Governance
          </p>

          {/* Mode Switch Tabs */}
          <div className="mt-4 flex bg-emerald-950/40 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-200 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'register' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-200 hover:text-white'
              }`}
            >
              Create Account (+50 pts)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-emerald-600 font-medium"
                    placeholder="citizen@example.ph"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-emerald-600 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm mt-2 flex items-center justify-center gap-1.5"
              >
                Sign In to Portal <ArrowRight className="w-4 h-4" />
              </button>

              {/* Demo Quick Logins */}
              <div className="border-t border-slate-100 pt-3 mt-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                  Quick Demo Accounts
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('john.santos@climateaction.org');
                      setLoginPassword('password123');
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left"
                  >
                    <p className="font-bold text-slate-800 truncate">John Santos</p>
                    <p className="text-[10px] text-slate-400">Citizen (Verified)</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('markkennethulgasan@gmail.com');
                      setLoginPassword('kenmark10');
                    }}
                    className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-left"
                  >
                    <p className="font-bold text-emerald-900 truncate">Mark Kenneth</p>
                    <p className="text-[10px] text-emerald-600">Super Admin</p>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="e.g. Juan dela Cruz"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="juan@example.ph"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-emerald-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="09171234567"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Barangay *</label>
                  <select
                    value={regBarangay}
                    onChange={e => setRegBarangay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-emerald-600 font-medium"
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
                <label className="block font-bold text-slate-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  value={regAddress}
                  onChange={e => setRegAddress(e.target.value)}
                  placeholder="Purok / Street / Subdivision"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Create Password *</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-emerald-600 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm mt-3 flex items-center justify-center gap-1.5"
              >
                Complete Registration (+50 pts) <CheckCircle className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
          <button
            onClick={closeAuthModal}
            className="text-slate-500 hover:text-slate-800 font-medium"
          >
            Explore as Guest
          </button>
          <span className="text-slate-400 text-[11px]">Metro Verde CENRO Portal</span>
        </div>
      </div>
    </div>
  );
};
