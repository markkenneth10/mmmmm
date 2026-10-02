import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  Sparkles,
  Search,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Compass
} from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { ClimateArticle } from '../types';

export const LearnScreen: React.FC = () => {
  const { articles, setSelectedArticle, setShowQuizModal } = useClimate();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    'All',
    'Climate Change',
    'Waste Management',
    'Disaster Preparedness',
    'Tree Planting',
    'Renewable Energy',
    'Coastal Protection'
  ];

  const filteredArticles = articles.filter(art => {
    if (activeCategory !== 'All' && art.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        art.title.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.content.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Climate Quiz Hero Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-emerald-900 text-white shadow-xl p-6 sm:p-8">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-purple-200 border border-white/20">
              <Award className="w-4 h-4 text-amber-300" />
              <span>Interactive Knowledge Check</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Test Your Climate Action Knowledge
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
              Complete the quiz questions on waste segregation, mangrove conservation, and urban heat mitigation. Earn <span className="font-bold text-amber-300">+10 Eco-Points</span> upon completion!
            </p>
          </div>

          <button
            onClick={() => setShowQuizModal(true)}
            className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center gap-2 self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" /> Start Climate Quiz
          </button>
        </div>
      </div>

      {/* 2. Search & Category Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search guides by title, keywords, or topics..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-emerald-600"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredArticles.length > 0 ? (
          filteredArticles.map(article => (
            <div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    {article.category}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {article.readTimeMinutes} min
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 leading-snug group-hover:text-emerald-800 transition-colors">
                  {article.title}
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                  {article.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  Read Article & Action Tips <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {article.actionTips.length} citizen actions
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-600">No guides found matching your query.</p>
            <p>Try searching with different terms or selecting another category.</p>
          </div>
        )}
      </div>

      {/* 4. Bottom Community Action Pledge */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-extrabold text-base text-emerald-950">
            Have Verified Ecological Insights or Research?
          </h4>
          <p className="text-xs text-emerald-800">
            CENRO welcomes contributions from academic partners, environmental science students, and community organizers.
          </p>
        </div>
        <button
          onClick={() => setSelectedArticle(articles[0])}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors shrink-0"
        >
          Explore First Guide
        </button>
      </div>
    </div>
  );
};
