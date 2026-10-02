import React from 'react';
import { ClimateProvider, useClimate } from './context/ClimateContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './pages/HomeScreen';
import { ReportScreen } from './pages/ReportScreen';
import { MapScreen } from './pages/MapScreen';
import { LearnScreen } from './pages/LearnScreen';
import { ProfileScreen } from './pages/ProfileScreen';
import { AdminScreen } from './pages/AdminScreen';

// Modals
import { ReportDetailModal } from './components/ReportDetailModal';
import { ArticleDetailModal } from './components/ArticleDetailModal';
import { ActivityDetailModal } from './components/ActivityDetailModal';
import { QuizModal } from './components/QuizModal';
import { AuthModal } from './components/AuthModal';
import { KycModal } from './components/KycModal';
import { NotificationsModal } from './components/NotificationsModal';
import { Sparkles } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    selectedReport,
    setSelectedReport,
    selectedArticle,
    setSelectedArticle,
    selectedActivity,
    setSelectedActivity,
    showQuizModal,
    toastMessage
  } = useClimate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-sm bg-slate-900 text-white text-xs py-3 px-4 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-top-4 duration-200 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-ping" />
          <span className="font-semibold leading-relaxed">{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header />

      {/* Main Screen Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-10">
        {activeTab === 'Home' && <HomeScreen />}
        {activeTab === 'Report' && <ReportScreen />}
        {activeTab === 'Map' && <MapScreen />}
        {activeTab === 'Learn' && <LearnScreen />}
        {activeTab === 'Profile' && <ProfileScreen />}
        {activeTab === 'Admin' && <AdminScreen />}
      </main>

      {/* Bottom Nav for Mobile / Tablet */}
      <BottomNav />

      {/* Modals */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}

      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}

      {showQuizModal && <QuizModal />}
      <AuthModal />
      <KycModal />
      <NotificationsModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ClimateProvider>
      <MainLayout />
    </ClimateProvider>
  );
};

export default App;
