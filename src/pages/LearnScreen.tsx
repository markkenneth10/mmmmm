import React, { useState } from 'react';
import { BookOpen, Award, Clock, ArrowRight, HelpCircle, Sparkles } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';

export const LearnScreen: React.FC = () => {
  const { articles, setSelectedArticleModal, setQuizModalOpen } = useClimate();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredArticles = articles.filter(a => {
    if (selectedCategory !== 'All' && a.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Climate Education & Eco Knowledge Center</h1>
          <p className="text-xs text-slate-400 mt-1">Explore verified Philippine climate research, flood mitigation science, and claim Eco-Points.</p>
        </div>

        <button
          onClick={() => setQuizModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all shrink-0"
        >
          <Award className="w-4 h-4" />
          <span>Start Interactive Eco Quiz (+50 Pts)</span>
        </button>
      </div>

      {/* Interactive Quiz Promo Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800/60 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Sparkles className="w-4 h-4" />
            <span>Bonus Citizen Eco-Points Reward</span>
          </div>
          <h2 className="text-lg font-extrabold text-white">Test Your Climate Adaptation Knowledge</h2>
          <p className="text-xs text-slate-400">Answer 5 questions regarding mangrove belts and flood safety to claim +50 Eco-Points.</p>
        </div>
        <button
          onClick={() => setQuizModalOpen(true)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shrink-0"
        >
          Take Quiz Now
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['All', 'Climate Science', 'Heat & Adaptation', 'Solid Waste'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid sm:grid-cols-2 gap-6">
        {filteredArticles.map(art => (
          <div
            key={art.id}
            onClick={() => setSelectedArticleModal(art)}
            className="group cursor-pointer bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden transition-all shadow-lg flex flex-col justify-between"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={art.imageUrl}
                alt={art.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/90 text-emerald-400 text-[10px] font-extrabold border border-slate-800">
                {art.category}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
                  <Clock className="w-3 h-3" />
                  <span>{art.readTime}</span>
                </div>
                <h3 className="text-base font-extrabold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {art.summary}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 pt-2">
                <span>Read Full Verified Article</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
