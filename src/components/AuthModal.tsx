import React, { useState } from 'react';
import { X, LogIn, UserPlus, Shield } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, setCurrentUser } = useClimate();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!authModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const userObj = {
      id: `USER-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name || email.split('@')[0],
      fullName: name || email.split('@')[0],
      email: email,
      role: 'citizen' as const,
      status: 'Active' as const,
      ecoPoints: 50,
      kycStatus: 'unverified' as const,
      barangay: 'Barangay Makilas'
    };

    setCurrentUser(userObj);
    setAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-white">
            {isRegister ? 'Create Citizen Account' : 'Sign In to Portal'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Access LGU CENRO reporting, track hazard dispatches, and earn Eco-Points.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Maria Santos"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="citizen@example.com"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all"
          >
            {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{isRegister ? 'Register Account' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-6 text-center pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-emerald-400 hover:underline font-bold"
          >
            {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register here'}
          </button>
        </div>
      </div>
    </div>
  );
};
