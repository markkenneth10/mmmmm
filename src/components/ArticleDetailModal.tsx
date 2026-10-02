import React from 'react';
import { X, BookOpen, Clock } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const ArticleDetailModal: React.FC = () => {
  const { selectedArticleModal, setSelectedArticleModal } = useClimate();

  if (!selectedArticleModal) return null;

  const art = selectedArticleModal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setSelectedArticleModal(null)}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <img
          src={art.imageUrl}
          alt={art.title}
          className="w-full h-56 object-cover rounded-xl border border-slate-800 mb-4"
        />

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800/60">
            {art.category}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {art.readTime}
          </span>
        </div>

        <h3 className="text-2xl font-extrabold text-white mb-4">{art.title}</h3>

        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p className="font-semibold text-slate-200">{art.summary}</p>
          <p>{art.content}</p>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => setSelectedArticleModal(null)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
          >
            Close Article
          </button>
        </div>
      </div>
    </div>
  );
};
