import React, { useState } from 'react';
import { Bell, Menu, X, Shield, BookOpen, Calendar, HelpCircle, PhoneCall, AlertTriangle, LogIn, LogOut, Award } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const Header: React.FC = () => {
  const {
    currentUser, setCurrentUser, activeTab, setActiveTab,
    setAuthModalOpen, notifications, setNotificationsOpen,
    setQuizModalOpen
  } = useClimate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#075333] border-b border-[#0a633c] shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          
          {/* Brand Logo & Citizen Portal Pill */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => setActiveTab('home')}
          >
            {/* Globe / Earth Logo */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-300 to-sky-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#075333] flex items-center justify-center text-emerald-300 font-black text-sm">
                🌱
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                Climate Action
              </span>
              <span className="bg-[#0f6e40] text-[#a7f3d0] border border-[#198750] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                Citizen Portal
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            
            {/* Notification Bell Button */}
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative w-9 h-9 rounded-full bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center shadow-md transition-all active:scale-95"
              title="Notifications"
            >
              <Bell className="w-4 h-4 fill-current" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Auth / Profile Pill Button */}
            {currentUser ? (
              <button
                onClick={() => setActiveTab('profile')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d6b3e] border border-[#17854e] text-white text-xs font-bold hover:bg-[#127d49] transition-all"
              >
                {currentUser.avatarUrl || currentUser.avatar ? (
                  <img src={currentUser.avatarUrl || currentUser.avatar} alt="Avatar" className="w-5 h-5 rounded-full object-cover border border-emerald-300" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center text-[10px] font-black">
                    {currentUser.name.charAt(0)}
                  </span>
                )}
                <span>{currentUser.name.split(' ')[0]}</span>
                <span className="text-emerald-300 font-extrabold">({currentUser.ecoPoints} pts)</span>
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white text-white text-xs font-bold hover:bg-white/10 transition-all"
              >
                <span>Create Account / Sign In</span>
              </button>
            )}

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-9 h-9 rounded-xl bg-[#0d6b3e] border border-[#17854e] text-white flex items-center justify-center hover:bg-[#127d49] transition-all"
              title="Portal Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

          </div>
        </div>
      </header>

      {/* Slide-over Drawer Menu */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xs bg-[#064228] border-l border-[#0a633c] text-white p-6 flex flex-col justify-between shadow-2xl h-full overflow-y-auto">
            
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#0d6b3e]">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-white">Portal Navigation</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-[#0d6b3e]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-2">
                {[
                  { id: 'home', label: 'Overview & Climate Telemetry', icon: Shield },
                  { id: 'map', label: 'Interactive Hazard Map', icon: Shield },
                  { id: 'report', label: 'Report Environmental Incident', icon: AlertTriangle },
                  { id: 'track', label: 'Incident Dispatch Tracker', icon: Shield },
                  { id: 'learn', label: 'Climate Education & Articles', icon: BookOpen },
                  { id: 'profile', label: 'Citizen Profile & Eco-Points', icon: Award },
                  { id: 'admin', label: 'LGU CENRO Admin Portal', icon: Shield }
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setDrawerOpen(false);
                      }}
                      className={`w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#10b981] text-slate-950 font-extrabold shadow-md'
                          : 'text-emerald-100 hover:bg-[#0d6b3e]'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Eco Quiz Trigger */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setQuizModalOpen(true);
                  }}
                  className="w-full py-2.5 px-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>Interactive Eco Quiz (+50 Pts)</span>
                </button>
              </div>
            </div>

            {/* Bottom Drawer Actions */}
            <div className="pt-6 border-t border-[#0d6b3e] space-y-3">
              {currentUser ? (
                <div className="space-y-2">
                  <div className="text-xs text-emerald-200">
                    Signed in as <span className="font-bold text-white">{currentUser.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      setDrawerOpen(false);
                    }}
                    className="w-full py-2 rounded-xl bg-[#093520] hover:bg-rose-950/60 text-rose-300 border border-rose-900/50 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white text-[#075333] hover:bg-emerald-50 text-xs font-extrabold flex items-center justify-center gap-2 shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Create Account / Sign In</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};
