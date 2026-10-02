import React from 'react';
import { Shield, Bell, User as UserIcon, LogIn, Search, CloudSun } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const Header: React.FC = () => {
  const {
    currentUser, activeTab, setActiveTab,
    weather, setAuthModalOpen,
    notifications, setNotificationsOpen
  } = useClimate();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">
              Climate Action
            </span>
            <span className="block text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
              Metro Verde CENRO Portal
            </span>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
          {[
            { id: 'home', label: 'Command Overview' },
            { id: 'map', label: 'Hazard Map' },
            { id: 'report', label: 'Report Hazard' },
            { id: 'learn', label: 'Education & Quiz' },
            { id: 'profile', label: 'Citizen Profile' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2.5">
          {/* Weather Widget Chip */}
          <div
            onClick={() => setActiveTab('home')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-semibold cursor-pointer hover:bg-emerald-900/40 transition-all"
          >
            <CloudSun className="w-4 h-4 text-emerald-400" />
            <span>{weather.temperature}°C • {weather.condition.split(' ')[0]}</span>
          </div>

          {/* Notification Bell Button */}
          <button
            onClick={() => setNotificationsOpen(true)}
            className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-all"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Admin Console Quick Switch */}
          <button
            onClick={() => setActiveTab('admin')}
            className={`p-2 rounded-xl text-xs font-bold border transition-all ${
              activeTab === 'admin'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-slate-800/80 text-amber-400 hover:bg-amber-950/50 border-amber-800/40'
            }`}
            title="Admin Console"
          >
            <span className="hidden sm:inline">Admin Portal</span>
            <span className="sm:hidden">⚙️</span>
          </button>

          {/* Citizen Auth Button / Profile */}
          {currentUser ? (
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-emerald-900/30 border border-emerald-700/40 hover:border-emerald-600 text-slate-200 transition-all"
            >
              {currentUser.avatarUrl || currentUser.avatar ? (
                <img
                  src={currentUser.avatarUrl || currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-emerald-500"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div className="text-left hidden lg:block">
                <span className="block text-xs font-bold leading-none text-slate-200">{currentUser.name.split(' ')[0]}</span>
                <span className="text-[10px] text-emerald-400 font-extrabold">{currentUser.ecoPoints} Eco-Pts</span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
