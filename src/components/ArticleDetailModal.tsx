import React from 'react';
import { X, BookOpen, Clock, CheckCircle2, Bookmark, Share2 } from 'lucide-react';
import { ClimateArticle } from '../types';
import { useClimate } from '../context/ClimateContext';

interface ArticleDetailModalProps {
  article: ClimateArticle;
  onClose: () => void;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({ article, onClose }) => {
  const { showToast } = useClimate();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href
      }).catch(() => {});
    } else {
      showToast('Article link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
              {article.category}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.readTimeMinutes} min read
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
            {article.title}
          </h2>

          <p className="text-base text-emerald-950/80 font-medium bg-emerald-50/80 p-4 rounded-xl border border-emerald-100 leading-relaxed">
            {article.summary}
          </p>

          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-4">
            {article.content}
          </div>

          {/* Actionable Tips */}
          {article.actionTips && article.actionTips.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600" /> Actionable Citizen Steps
              </h4>
              <ul className="space-y-1.5">
                {article.actionTips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-amber-950 flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-200/70 text-amber-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Scientific References */}
          {article.references && (
            <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
              <span className="font-semibold text-slate-700 block mb-0.5">Authoritative References:</span>
              <p className="italic">{article.references}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <Share2 className="w-4 h-4" /> Share Article
          </button>
          <button
            onClick={onClose}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Done Reading
          </button>
        </div>
      </div>
    </div>
  );
};
