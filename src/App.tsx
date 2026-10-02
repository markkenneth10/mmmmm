import React from 'react';
import { ClimateProvider, useClimate } from './context/ClimateContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { AuthModal } from './components/AuthModal';
import { ReportDetailModal } from './components/ReportDetailModal';
import { ActivityDetailModal } from './components/ActivityDetailModal';
import { ArticleDetailModal } from './components/ArticleDetailModal';
import { QuizModal } from './components/QuizModal';
import { KycModal } from './components/KycModal';
import { NotificationsModal } from './components/NotificationsModal';

import { HomeScreen } from './pages/HomeScreen';
import { MapScreen } from './pages/MapScreen';
import { ReportScreen } from './pages/ReportScreen';
import { LearnScreen } from './pages/LearnScreen';
import { ProfileScreen } from './pages/ProfileScreen';
import { AdminScreen } from './pages/AdminScreen';

const MainContent: React.FC = () => {
  const { activeTab } = useClimate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'map' && <MapScreen />}
        {activeTab === 'report' && <ReportScreen />}
        {activeTab === 'learn' && <LearnScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
        {activeTab === 'admin' && <AdminScreen />}
      </main>

      <BottomNav />

      {/* Global Modals */}
      <AuthModal />
      <ReportDetailModal />
      <ActivityDetailModal />
      <ArticleDetailModal />
      <QuizModal />
      <KycModal />
      <NotificationsModal />
    </div>
  );
};

export default function App() {
  return (
    <ClimateProvider>
      <MainContent />
    </ClimateProvider>
  );
}
