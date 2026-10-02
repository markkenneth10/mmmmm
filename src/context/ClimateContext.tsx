import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  Report,
  ReportUpdate,
  ClimateArticle,
  Activity,
  QuizQuestion,
  PointsLog,
  Notification,
  WeatherData,
  ReportSeverity,
  ReportStatus
} from '../types';
import {
  initialUsers,
  initialReports,
  initialReportUpdates,
  initialArticles,
  initialActivities,
  initialQuizzes,
  initialPointsLogs,
  initialNotifications,
  initialWeatherData
} from '../data/initialData';

interface ClimateContextType {
  currentUser: User | null;
  allUsers: User[];
  reports: Report[];
  reportUpdates: ReportUpdate[];
  articles: ClimateArticle[];
  activities: Activity[];
  quizzes: QuizQuestion[];
  pointsLogs: PointsLog[];
  notifications: Notification[];
  weather: WeatherData;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Modals & Selections
  selectedReport: Report | null;
  setSelectedReport: (r: Report | null) => void;
  selectedArticle: ClimateArticle | null;
  setSelectedArticle: (a: ClimateArticle | null) => void;
  selectedActivity: Activity | null;
  setSelectedActivity: (act: Activity | null) => void;
  showQuizModal: boolean;
  setShowQuizModal: (show: boolean) => void;
  showAuthModal: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  showKycModal: boolean;
  setShowKycModal: (show: boolean) => void;
  showNotificationsModal: boolean;
  setShowNotificationsModal: (show: boolean) => void;
  
  // Toast notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Actions
  loginCitizen: (email: string, pass: string) => boolean;
  registerCitizen: (data: { name: string; email: string; phone: string; barangay: string; address: string; password?: string }) => void;
  logout: () => void;
  switchUser: (userId: number) => void;
  submitKyc: (idType: string, idNumber: string) => void;
  submitReport: (reportData: {
    title: string;
    category: string;
    description: string;
    photoUri?: string;
    barangay: string;
    severity: ReportSeverity;
    latitude: number;
    longitude: number;
  }) => boolean;
  updateReportStatus: (
    reportId: number,
    newStatus: ReportStatus,
    remarks: string,
    assignedOfficer?: string,
    resolutionEvidence?: string
  ) => void;
  toggleActivityRegistration: (activityId: number) => void;
  submitActivityProof: (activityId: number, note: string, points: number) => void;
  completeQuiz: (score: number, total: number) => void;
  markNotificationRead: (id: number) => void;
  markAllNotificationsRead: () => void;
  updateWeather: (data: Partial<WeatherData>) => void;
  approveKycUser: (userId: number) => void;
  awardPointsToUser: (userId: number, points: number, reason: string) => void;
}

const ClimateContext = createContext<ClimateContextType | undefined>(undefined);

export const ClimateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Persistence state keys
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('climate_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [currentUserId, setCurrentUserId] = useState<number | null>(() => {
    const saved = localStorage.getItem('climate_logged_user_id');
    return saved ? Number(saved) : 1; // Default to John Santos for immediate interactive experience
  });

  const [reports, setReports] = useState<Report[]>(() => {
    const saved = localStorage.getItem('climate_reports');
    return saved ? JSON.parse(saved) : initialReports;
  });

  const [reportUpdates, setReportUpdates] = useState<ReportUpdate[]>(() => {
    const saved = localStorage.getItem('climate_report_updates');
    return saved ? JSON.parse(saved) : initialReportUpdates;
  });

  const [articles] = useState<ClimateArticle[]>(initialArticles);

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('climate_activities');
    return saved ? JSON.parse(saved) : initialActivities;
  });

  const [quizzes] = useState<QuizQuestion[]>(initialQuizzes);

  const [pointsLogs, setPointsLogs] = useState<PointsLog[]>(() => {
    const saved = localStorage.getItem('climate_points_logs');
    return saved ? JSON.parse(saved) : initialPointsLogs;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('climate_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [weather, setWeather] = useState<WeatherData>(() => {
    const saved = localStorage.getItem('climate_weather');
    return saved ? JSON.parse(saved) : initialWeatherData;
  });

  const [activeTab, setActiveTab] = useState<string>('Home');

  // Modal controls
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ClimateArticle | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showQuizModal, setShowQuizModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [showKycModal, setShowKycModal] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('climate_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUserId !== null) {
      localStorage.setItem('climate_logged_user_id', String(currentUserId));
    } else {
      localStorage.removeItem('climate_logged_user_id');
    }
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('climate_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('climate_report_updates', JSON.stringify(reportUpdates));
  }, [reportUpdates]);

  useEffect(() => {
    localStorage.setItem('climate_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('climate_points_logs', JSON.stringify(pointsLogs));
  }, [pointsLogs]);

  useEffect(() => {
    localStorage.setItem('climate_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('climate_weather', JSON.stringify(weather));
  }, [weather]);

  const currentUser = users.find(u => u.id === currentUserId) || null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 4500);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const loginCitizen = (email: string, pass: string): boolean => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      if (found.password && found.password !== pass) {
        showToast('Invalid password. Please try again.');
        return false;
      }
      setCurrentUserId(found.id);
      closeAuthModal();
      showToast(`Welcome back, ${found.name}!`);
      return true;
    }
    showToast('No citizen account found with this email.');
    return false;
  };

  const registerCitizen = (data: {
    name: string;
    email: string;
    phone: string;
    barangay: string;
    address: string;
    password?: string;
  }) => {
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const colors = ['#10B981', '#3B82F6', '#6366F1', '#EC4899', '#F59E0B', '#14B8A6'];
    const chosenColor = colors[Math.floor(Math.random() * colors.length)];

    const newUser: User = {
      id: newId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      barangay: data.barangay,
      municipality: 'Metro Verde',
      address: data.address,
      password: data.password || 'password123',
      role: 'Citizen',
      points: 50,
      isVerified: false,
      kycStatus: 'unverified',
      avatarColorHex: chosenColor
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUserId(newId);

    // Initial points log
    const newLog: PointsLog = {
      id: Date.now(),
      userId: newId,
      action: 'Account Registration Welcome Bonus',
      points: 50,
      timestamp: Date.now()
    };
    setPointsLogs(prev => [newLog, ...prev]);

    closeAuthModal();
    showToast(`Account created! Welcome, ${newUser.name} (+50 pts). Complete KYC to report.`);
    confetti({ particleCount: 60, spread: 60 });
  };

  const logout = () => {
    setCurrentUserId(null);
    showToast('Signed out of citizen account.');
  };

  const switchUser = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUserId(userId);
      showToast(`Switched active profile to ${user.name} (${user.role})`);
    }
  };

  const submitKyc = (idType: string, idNumber: string) => {
    if (!currentUser) {
      showToast('Please sign in first to submit KYC.');
      return;
    }

    setUsers(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            isVerified: true,
            kycStatus: 'verified',
            kycIdType: idType,
            kycIdNumber: idNumber,
            points: u.points + 25
          };
        }
        return u;
      })
    );

    const log: PointsLog = {
      id: Date.now(),
      userId: currentUser.id,
      action: `Government ID Verification (${idType})`,
      points: 25,
      timestamp: Date.now()
    };
    setPointsLogs(prev => [log, ...prev]);

    setShowKycModal(false);
    showToast('Identity Verified! Environmental incident reporting unlocked (+25 pts).');
    confetti({ particleCount: 75, spread: 70 });
  };

  const submitReport = (reportData: {
    title: string;
    category: string;
    description: string;
    photoUri?: string;
    barangay: string;
    severity: ReportSeverity;
    latitude: number;
    longitude: number;
  }): boolean => {
    if (!currentUser) {
      showToast('Please sign in or create an account to submit reports.');
      openAuthModal('login');
      return false;
    }

    if (!currentUser.isVerified || currentUser.kycStatus !== 'verified') {
      showToast('Government ID verification (KYC) required before submitting reports.');
      setShowKycModal(true);
      return false;
    }

    const newReportId = reports.length > 0 ? Math.max(...reports.map(r => r.id)) + 1 : 101;

    const newReport: Report = {
      id: newReportId,
      userId: currentUser.id,
      authorName: currentUser.name,
      title: reportData.title,
      category: reportData.category,
      categoryIcon: 'Flag',
      description: reportData.description,
      photoUri: reportData.photoUri || '/assets/climate_hero_banner.jpg',
      latitude: reportData.latitude,
      longitude: reportData.longitude,
      barangay: reportData.barangay,
      municipality: 'Metro Verde',
      province: 'Eco Province',
      severity: reportData.severity,
      status: 'Submitted',
      timestamp: Date.now()
    };

    const initialUpdate: ReportUpdate = {
      id: Date.now(),
      reportId: newReportId,
      status: 'Submitted',
      remarks: 'Report lodged by citizen with geotagged location coordinates.',
      updatedBy: currentUser.name,
      timestamp: Date.now()
    };

    setReports(prev => [newReport, ...prev]);
    setReportUpdates(prev => [initialUpdate, ...prev]);

    // Award +10 points to reporter
    setUsers(prev =>
      prev.map(u => (u.id === currentUser.id ? { ...u, points: u.points + 10 } : u))
    );

    const log: PointsLog = {
      id: Date.now() + 1,
      userId: currentUser.id,
      action: `Lodged environmental report #${newReportId} (${reportData.category})`,
      points: 10,
      timestamp: Date.now()
    };
    setPointsLogs(prev => [log, ...prev]);

    showToast('Report submitted successfully! +10 Climate Points earned.');
    confetti({ particleCount: 50, spread: 60 });
    return true;
  };

  const updateReportStatus = (
    reportId: number,
    newStatus: ReportStatus,
    remarks: string,
    assignedOfficer?: string,
    resolutionEvidence?: string
  ) => {
    const updaterName = currentUser?.name || 'CENRO Environmental Command';

    setReports(prev =>
      prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            status: newStatus,
            adminRemarks: remarks,
            assignedOfficer: assignedOfficer !== undefined ? assignedOfficer : r.assignedOfficer,
            resolutionEvidence: resolutionEvidence !== undefined ? resolutionEvidence : r.resolutionEvidence
          };
        }
        return r;
      })
    );

    const newUpdate: ReportUpdate = {
      id: Date.now(),
      reportId,
      status: newStatus,
      remarks,
      updatedBy: updaterName,
      timestamp: Date.now()
    };

    setReportUpdates(prev => [newUpdate, ...prev]);

    // Update selected report if open
    setSelectedReport(prev => {
      if (prev && prev.id === reportId) {
        return {
          ...prev,
          status: newStatus,
          adminRemarks: remarks,
          assignedOfficer: assignedOfficer !== undefined ? assignedOfficer : prev.assignedOfficer,
          resolutionEvidence: resolutionEvidence !== undefined ? resolutionEvidence : prev.resolutionEvidence
        };
      }
      return prev;
    });

    // Notify author
    const targetReport = reports.find(r => r.id === reportId);
    if (targetReport) {
      const notif: Notification = {
        id: Date.now() + 2,
        userId: targetReport.userId,
        title: `Report #${reportId} Status: ${newStatus}`,
        message: remarks || `Your report regarding "${targetReport.title}" has been updated to ${newStatus}.`,
        type: 'Report',
        isRead: false,
        timestamp: Date.now()
      };
      setNotifications(prev => [notif, ...prev]);
    }

    showToast(`Report #${reportId} updated to ${newStatus}`);
  };

  const toggleActivityRegistration = (activityId: number) => {
    if (!currentUser) {
      showToast('Please sign in to register for community climate activities.');
      openAuthModal('login');
      return;
    }

    setActivities(prev =>
      prev.map(act => {
        if (act.id === activityId) {
          const nextRegistered = !act.isRegistered;
          const updatedCount = nextRegistered
            ? act.currentParticipants + 1
            : Math.max(0, act.currentParticipants - 1);

          showToast(
            nextRegistered
              ? `Registered for "${act.title}"! We look forward to seeing you there.`
              : `Registration cancelled for "${act.title}".`
          );

          if (nextRegistered) {
            confetti({ particleCount: 40, spread: 50 });
          }

          return {
            ...act,
            isRegistered: nextRegistered,
            currentParticipants: updatedCount
          };
        }
        return act;
      })
    );
  };

  const submitActivityProof = (activityId: number, note: string, points: number) => {
    if (!currentUser) return;

    setActivities(prev =>
      prev.map(act => {
        if (act.id === activityId) {
          return {
            ...act,
            isCompleted: true,
            proofSubmitted: true,
            proofNote: note
          };
        }
        return act;
      })
    );

    // Award points
    setUsers(prev =>
      prev.map(u => (u.id === currentUser.id ? { ...u, points: u.points + points } : u))
    );

    const log: PointsLog = {
      id: Date.now(),
      userId: currentUser.id,
      action: `Participated in community activity (+${points} pts)`,
      points,
      timestamp: Date.now()
    };
    setPointsLogs(prev => [log, ...prev]);

    setSelectedActivity(null);
    showToast(`Proof verified! +${points} Climate Points awarded to your profile.`);
    confetti({ particleCount: 80, spread: 80 });
  };

  const completeQuiz = (score: number, total: number) => {
    if (!currentUser) return;

    const reward = 10;
    setUsers(prev =>
      prev.map(u => (u.id === currentUser.id ? { ...u, points: u.points + reward } : u))
    );

    const log: PointsLog = {
      id: Date.now(),
      userId: currentUser.id,
      action: `Completed Climate Awareness Quiz (${score}/${total})`,
      points: reward,
      timestamp: Date.now()
    };
    setPointsLogs(prev => [log, ...prev]);

    showToast(`Quiz Complete! Scored ${score}/${total}. Earned +${reward} Climate Points!`);
    confetti({ particleCount: 90, spread: 90 });
  };

  const markNotificationRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    showToast('All notifications marked as read.');
  };

  const updateWeather = (data: Partial<WeatherData>) => {
    setWeather(prev => ({ ...prev, ...data }));
    showToast('Municipal weather telemetry & advisories updated.');
  };

  const approveKycUser = (userId: number) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            isVerified: true,
            kycStatus: 'verified',
            points: u.points + 25
          };
        }
        return u;
      })
    );
    showToast('Citizen KYC approved and verified.');
  };

  const awardPointsToUser = (userId: number, points: number, reason: string) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, points: u.points + points } : u))
    );
    const log: PointsLog = {
      id: Date.now(),
      userId,
      action: reason,
      points,
      timestamp: Date.now()
    };
    setPointsLogs(prev => [log, ...prev]);
    showToast(`Awarded ${points} points to citizen.`);
  };

  return (
    <ClimateContext.Provider
      value={{
        currentUser,
        allUsers: users,
        reports,
        reportUpdates,
        articles,
        activities,
        quizzes,
        pointsLogs,
        notifications,
        weather,
        activeTab,
        setActiveTab,
        selectedReport,
        setSelectedReport,
        selectedArticle,
        setSelectedArticle,
        selectedActivity,
        setSelectedActivity,
        showQuizModal,
        setShowQuizModal,
        showAuthModal,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        showKycModal,
        setShowKycModal,
        showNotificationsModal,
        setShowNotificationsModal,
        toastMessage,
        showToast,
        loginCitizen,
        registerCitizen,
        logout,
        switchUser,
        submitKyc,
        submitReport,
        updateReportStatus,
        toggleActivityRegistration,
        submitActivityProof,
        completeQuiz,
        markNotificationRead,
        markAllNotificationsRead,
        updateWeather,
        approveKycUser,
        awardPointsToUser
      }}
    >
      {children}
    </ClimateContext.Provider>
  );
};

export const useClimate = () => {
  const context = useContext(ClimateContext);
  if (!context) {
    throw new Error('useClimate must be used within a ClimateProvider');
  }
  return context;
};
