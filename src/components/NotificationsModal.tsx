import React from 'react';
import { X, Bell, AlertTriangle, CloudSun, Award } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const NotificationsModal: React.FC = () => {
  const { notificationsOpen, setNotificationsOpen, notifications, markNotificationRead } = useClimate();

  if (!notificationsOpen) return null;

  const getIcon = (type: string) => {
    if (type === 'weather') return <CloudSun className="w-5 h-5 text-amber-400" />;
    if (type === 'points') return <Award className="w-5 h-5 text-emerald-400" />;
    return <AlertTriangle className="w-5 h-5 text-sky-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={() => setNotificationsOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-extrabold text-white">System Notifications</h3>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                n.read ? 'bg-slate-900 border-slate-800 opacity-60' : 'bg-slate-800/80 border-slate-700/80'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white">{n.title}</span>
                    <span className="text-[10px] text-slate-400">{n.time}</span>
                  </div>
                  <p className="text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
