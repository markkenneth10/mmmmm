import React from 'react';
import { Home, MapPin, Plus, ClipboardList, User } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useClimate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-3 py-1.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* 1. Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'home' ? 'text-[#059669]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[11px] mt-0.5 ${activeTab === 'home' ? 'font-bold' : 'font-medium'}`}>
            Home
          </span>
        </button>

        {/* 2. Map */}
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'map' ? 'text-[#059669]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className={`w-5 h-5 ${activeTab === 'map' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[11px] mt-0.5 ${activeTab === 'map' ? 'font-bold' : 'font-medium'}`}>
            Map
          </span>
        </button>

        {/* 3. Elevated Report Button */}
        <div className="flex-1 flex flex-col items-center justify-center relative -top-4">
          <button
            onClick={() => setActiveTab('report')}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 border-4 border-white active:scale-95 transition-all"
            title="Report Environmental Incident"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </button>
          <span className="text-[11px] font-bold text-[#059669] mt-0.5">
            Report
          </span>
        </div>

        {/* 4. Track */}
        <button
          onClick={() => setActiveTab('track')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'track' ? 'text-[#059669]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className={`w-5 h-5 ${activeTab === 'track' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[11px] mt-0.5 ${activeTab === 'track' ? 'font-bold' : 'font-medium'}`}>
            Track
          </span>
        </button>

        {/* 5. Profile */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'profile' ? 'text-[#059669]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[11px] mt-0.5 ${activeTab === 'profile' ? 'font-bold' : 'font-medium'}`}>
            Profile
          </span>
        </button>

      </div>
    </nav>
  );
};
