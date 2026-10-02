import React from 'react';
import { Home, AlertTriangle, Map, BookOpen, User, Camera } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, openAuthModal, setShowKycModal } = useClimate();

  const handleQuickReport = () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    if (!currentUser.isVerified || currentUser.kycStatus !== 'verified') {
      setActiveTab('Report');
      setShowKycModal(true);
      return;
    }
    setActiveTab('Report');
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
      <div className="flex items-center justify-around h-16 relative px-2">
        <button
          onClick={() => setActiveTab('Home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'Home' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('Report')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'Report' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="text-[10px] mt-1">Report</span>
        </button>

        {/* Center Floating Quick Action Action Button */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={handleQuickReport}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-700 to-green-500 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all border-2 border-white"
            aria-label="Quick Report Environmental Incident"
            title="Quick Report"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => setActiveTab('Map')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'Map' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[10px] mt-1">GIS Map</span>
        </button>

        <button
          onClick={() => setActiveTab('Learn')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'Learn' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] mt-1">Learn</span>
        </button>

        <button
          onClick={() => setActiveTab('Profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'Profile' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-1">Profile</span>
        </button>
      </div>
    </div>
  );
};
