import React from 'react';
import { X, Bell, CheckCheck, AlertCircle, Award, Calendar, ShieldCheck } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const NotificationsModal: React.FC = () => {
  const {
    showNotificationsModal,
    setShowNotificationsModal,
    notifications,
    markNotificationRead,
    markAllNotificationsRead
  } = useClimate();

  if (!showNotificationsModal) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Report':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'Advisory':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'Activity':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'Quiz':
        return <Award className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-700" />
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              Municipal Advisories & Updates
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={markAllNotificationsRead}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
            </button>
            <button
              onClick={() => setShowNotificationsModal(false)}
              className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto space-y-3">
          {notifications.length > 0 ? (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  n.isRead
                    ? 'bg-slate-50/60 border-slate-200 text-slate-600'
                    : 'bg-emerald-50/40 border-emerald-300 text-slate-900 ring-1 ring-emerald-400/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
                      {getTypeIcon(n.type)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{n.title}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(n.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1" />
                  )}
                </div>
                <p className="mt-2 text-slate-700 leading-relaxed pl-9">{n.message}</p>
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-xs text-slate-400">No notifications available.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={() => setShowNotificationsModal(false)}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
