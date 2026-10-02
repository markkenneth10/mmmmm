import React from 'react';
import { Home, MapPin, PlusCircle, BookOpen, User, ShieldAlert } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useClimate();

  const navItems = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'report', label: 'Report', icon: PlusCircle, isPrimary: true },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'admin', label: 'Admin', icon: ShieldAlert }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2">
      <div className="flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-900/50 border-2 border-slate-900 active:scale-95 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 mt-0.5">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
