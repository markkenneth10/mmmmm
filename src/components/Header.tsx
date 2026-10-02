import React, { useState } from 'react';
import {
  ShieldAlert,
  Bell,
  SunMedium,
  User as UserIcon,
  ChevronDown,
  LogOut,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Flame,
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const Header: React.FC = () => {
  const {
    currentUser,
    allUsers,
    weather,
    notifications,
    activeTab,
    setActiveTab,
    openAuthModal,
    logout,
    switchUser,
    setShowNotificationsModal,
    setShowKycModal
  } = useClimate();

  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'Red':
        return 'bg-red-500 text-white animate-pulse';
      case 'Orange':
        return 'bg-amber-500 text-white';
      case 'Yellow':
        return 'bg-amber-400 text-amber-950 font-bold';
      default:
        return 'bg-emerald-500 text-white';
    }
  };

  const isStaff = currentUser?.role === 'Administrator' || currentUser?.role === 'Environmental Officer';

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('Home')}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600/60 p-1 flex items-center justify-center border border-white/20 shadow-inner group-hover:scale-105 transition-transform">
              <img
                src="/assets/ic_climate_app_icon.jpg"
                alt="Climate Action Logo"
                className="w-full h-full object-cover rounded-lg"
                onError={e => {
                  // Fallback to svg icon if image not available
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white drop-shadow-sm">
                  Climate Action
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Metro Verde
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 hidden sm:block">
                Environmental Reporting & Ecological Governance
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 font-medium text-sm">
            <button
              onClick={() => setActiveTab('Home')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'Home'
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-emerald-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('Report')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'Report'
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-emerald-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              Report Incident
            </button>
            <button
              onClick={() => setActiveTab('Map')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'Map'
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-emerald-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              GIS Map
            </button>
            <button
              onClick={() => setActiveTab('Learn')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'Learn'
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-emerald-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              Learn & Quiz
            </button>
            <button
              onClick={() => setActiveTab('Profile')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'Profile'
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-emerald-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              Citizen Profile
            </button>
            {isStaff && (
              <button
                onClick={() => setActiveTab('Admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'Admin'
                    ? 'bg-amber-400 text-amber-950 font-bold shadow-sm'
                    : 'bg-emerald-900/50 text-amber-300 hover:bg-emerald-900 hover:text-amber-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                CENRO Console
              </button>
            )}
          </nav>

          {/* Right Action Icons: Weather, Notification Bell, User profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Weather Pill */}
            <div
              onClick={() => setActiveTab('Home')}
              className="flex items-center gap-2 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-600/40 rounded-full px-3 py-1 text-xs cursor-pointer transition-colors shadow-sm"
              title="Current Weather & Municipal Hazard Telemetry"
            >
              <SunMedium className="w-4 h-4 text-amber-300" />
              <span className="font-bold text-white">{weather.temp}°C</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${getAlertColor(weather.alertLevel)}`}>
                {weather.alertLevel}
              </span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotificationsModal(true)}
              className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-white"
              aria-label="Official Advisories & Updates"
              title="Official Advisories & Updates"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-emerald-800">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile / Auth Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 bg-emerald-900/50 hover:bg-emerald-900/80 border border-white/20 rounded-full pl-2 pr-3 py-1 transition-all"
                >
                  <div
                    className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shadow"
                    style={{ backgroundColor: currentUser.avatarColorHex }}
                  >
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-white leading-tight">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-emerald-200">
                      {currentUser.points} pts • {currentUser.role}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-200" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 border border-slate-200 text-slate-800 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-400">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3" />
                          {currentUser.points} Eco-Points
                        </span>
                        {currentUser.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              setShowKycModal(true);
                            }}
                            className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200"
                          >
                            Verify KYC
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveTab('Profile');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        My Profile & Eco-Points
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveTab('Report');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <AlertTriangle className="w-4 h-4 text-slate-400" />
                        Submit New Incident Report
                      </button>
                      {isStaff && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setActiveTab('Admin');
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          CENRO Admin Console
                        </button>
                      )}
                    </div>

                    {/* Switch Persona for Demo / Testing */}
                    <div className="border-t border-slate-100 pt-2 px-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Switch Demo Persona
                      </p>
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {allUsers.map(user => (
                          <button
                            key={user.id}
                            onClick={() => {
                              switchUser(user.id);
                              setShowUserMenu(false);
                            }}
                            className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between ${
                              user.id === currentUser.id
                                ? 'bg-emerald-50 text-emerald-800 font-bold'
                                : 'hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span className="truncate">{user.name}</span>
                            <span className="text-[10px] px-1 rounded bg-slate-200/70 text-slate-700">
                              {user.role === 'Citizen' ? 'Citizen' : user.role === 'Administrator' ? 'Admin' : 'Officer'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 mt-2 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-3.5 py-1.5 rounded-full text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
