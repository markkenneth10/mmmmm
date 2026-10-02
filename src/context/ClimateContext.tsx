import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User, IncidentReport, WeatherAdvisory, Announcement,
  CommunityActivity, ActivityParticipation, Article, QuizQuestion, NotificationItem
} from '../types';
import {
  initialReports, initialWeather, initialAnnouncements,
  initialActivities, initialArticles, initialQuizzes
} from '../data/initialData';

interface ClimateContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  reports: IncidentReport[];
  addReport: (reportData: Partial<IncidentReport>) => void;
  updateReportStatus: (id: string, status: IncidentReport['status'], notes?: string) => void;
  upvoteReport: (id: string) => void;

  weather: WeatherAdvisory;
  updateWeather: (data: Partial<WeatherAdvisory>) => void;

  announcements: Announcement[];
  addAnnouncement: (annData: Partial<Announcement>) => void;
  toggleHideAnnouncement: (id: string) => void;
  deleteAnnouncement: (id: string) => void;

  activities: CommunityActivity[];
  addActivity: (actData: Partial<CommunityActivity>) => void;
  toggleHideActivity: (id: string) => void;
  deleteActivity: (id: string) => void;

  participations: ActivityParticipation[];
  submitParticipationProof: (data: Partial<ActivityParticipation>) => void;
  reviewParticipationProof: (id: string, status: 'Approved' | 'Rejected', notes?: string) => void;

  articles: Article[];
  quizzes: QuizQuestion[];
  users: User[];
  updateUserKyc: (userId: string, kycData: Partial<User>) => void;
  toggleUserStatus: (userId: string) => void;

  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;

  // Modals Control
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  selectedReportModal: IncidentReport | null;
  setSelectedReportModal: (report: IncidentReport | null) => void;
  selectedActivityModal: CommunityActivity | null;
  setSelectedActivityModal: (act: CommunityActivity | null) => void;
  selectedArticleModal: Article | null;
  setSelectedArticleModal: (art: Article | null) => void;
  quizModalOpen: boolean;
  setQuizModalOpen: (open: boolean) => void;
  kycModalOpen: boolean;
  setKycModalOpen: (open: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
}

const ClimateContext = createContext<ClimateContextType | undefined>(undefined);

export const ClimateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('climate_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<string>('home');

  const [reports, setReports] = useState<IncidentReport[]>(() => {
    const saved = localStorage.getItem('climate_reports');
    return saved ? JSON.parse(saved) : initialReports;
  });

  const [weather, setWeather] = useState<WeatherAdvisory>(() => {
    const saved = localStorage.getItem('climate_weather');
    return saved ? JSON.parse(saved) : initialWeather;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('climate_announcements');
    return saved ? JSON.parse(saved) : initialAnnouncements;
  });

  const [activities, setActivities] = useState<CommunityActivity[]>(() => {
    const saved = localStorage.getItem('climate_activities');
    return saved ? JSON.parse(saved) : initialActivities;
  });

  const [participations, setParticipations] = useState<ActivityParticipation[]>(() => {
    const saved = localStorage.getItem('climate_participations');
    return saved ? JSON.parse(saved) : [];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('climate_users');
    return saved ? JSON.parse(saved) : [
      {
        id: 'USER-101',
        name: 'Juan Santos',
        fullName: 'Juan Santos',
        email: 'juan@example.com',
        role: 'citizen',
        status: 'Active',
        ecoPoints: 120,
        kycStatus: 'verified',
        barangay: 'Barangay Makilas'
      }
    ];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'NOTIF-1',
      title: 'Yellow Rainfall Advisory',
      message: 'Scattered thunderstorms forecasted for Metro Verde coastal barangays.',
      time: '10m ago',
      read: false,
      type: 'weather'
    },
    {
      id: 'NOTIF-2',
      title: 'Report Update: REP-1089',
      message: 'CENRO Quick Response Team B dispatched to inspect drainage canal.',
      time: '1h ago',
      read: false,
      type: 'incident'
    }
  ]);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedReportModal, setSelectedReportModal] = useState<IncidentReport | null>(null);
  const [selectedActivityModal, setSelectedActivityModal] = useState<CommunityActivity | null>(null);
  const [selectedArticleModal, setSelectedArticleModal] = useState<Article | null>(null);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('climate_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('climate_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('climate_weather', JSON.stringify(weather));
  }, [weather]);

  useEffect(() => {
    localStorage.setItem('climate_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('climate_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('climate_participations', JSON.stringify(participations));
  }, [participations]);

  useEffect(() => {
    localStorage.setItem('climate_users', JSON.stringify(users));
  }, [users]);

  // Actions
  const addReport = (reportData: Partial<IncidentReport>) => {
    const newReport: IncidentReport = {
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: currentUser?.id,
      reporterName: currentUser ? (currentUser.fullName || currentUser.name) : 'Citizen',
      reporterPhone: currentUser?.phone || '',
      title: reportData.title || 'Environmental Hazard',
      category: reportData.category || 'General Hazard',
      severity: reportData.severity || 'Moderate',
      description: reportData.description || '',
      barangay: reportData.barangay || 'Barangay Makilas',
      locationText: reportData.locationText || '',
      latitude: reportData.latitude || 14.5995,
      longitude: reportData.longitude || 120.9842,
      photoUrl: reportData.photoUrl || '',
      status: 'Submitted',
      upvotes: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setReports(prev => [newReport, ...prev]);

    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, ecoPoints: prev.ecoPoints + 25 } : null);
    }
  };

  const updateReportStatus = (id: string, status: IncidentReport['status'], notes?: string) => {
    setReports(prev => prev.map(r => r.id === id ? {
      ...r,
      status,
      inspectionNotes: notes !== undefined ? notes : r.inspectionNotes,
      updatedAt: Date.now()
    } : r));
  };

  const upvoteReport = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r));
  };

  const updateWeather = (data: Partial<WeatherAdvisory>) => {
    setWeather(prev => ({ ...prev, ...data, updatedAt: Date.now() }));
  };

  const addAnnouncement = (annData: Partial<Announcement>) => {
    const newAnn: Announcement = {
      id: `ANN-${Date.now().toString().slice(-4)}`,
      title: annData.title || 'Public Notice',
      category: annData.category || 'Advisory',
      priority: annData.priority || 'Normal',
      content: annData.content || '',
      imageUrl: annData.imageUrl,
      hidden: false,
      author: 'CENRO Administration',
      timestamp: Date.now()
    };
    setAnnouncements(prev => [newAnn, ...prev]);
  };

  const toggleHideAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, hidden: !a.hidden } : a));
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const addActivity = (actData: Partial<CommunityActivity>) => {
    const newAct: CommunityActivity = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      title: actData.title || 'Community Movement',
      category: actData.category || 'Tree Planting',
      date: actData.date || 'TBA',
      location: actData.location || 'Metro Verde',
      description: actData.description || '',
      organizer: actData.organizer || 'LGU CENRO',
      points: Number(actData.points) || 100,
      registered: 0,
      max: Number(actData.max) || 100,
      hidden: false,
      imageUrl: actData.imageUrl
    };
    setActivities(prev => [newAct, ...prev]);
  };

  const toggleHideActivity = (id: string) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, hidden: !a.hidden } : a));
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const submitParticipationProof = (data: Partial<ActivityParticipation>) => {
    const newPart: ActivityParticipation = {
      id: `PART-${Date.now().toString().slice(-6)}`,
      activityId: data.activityId || '',
      activityTitle: data.activityTitle || 'Community Drive',
      userId: currentUser?.id || 'GUEST',
      userName: currentUser ? (currentUser.fullName || currentUser.name) : 'Citizen',
      userEmail: currentUser?.email || '',
      proofImageUrl: data.proofImageUrl || '',
      proofDescription: data.proofDescription || '',
      status: 'Pending',
      pointsAwarded: data.pointsAwarded || 100,
      submittedAt: Date.now()
    };
    setParticipations(prev => [newPart, ...prev]);
  };

  const reviewParticipationProof = (id: string, status: 'Approved' | 'Rejected', notes?: string) => {
    setParticipations(prev => prev.map(p => {
      if (p.id === id) {
        if (status === 'Approved' && p.status !== 'Approved') {
          // Award points to user
          setUsers(uList => uList.map(u => (u.id === p.userId || u.email === p.userEmail) ? { ...u, ecoPoints: u.ecoPoints + p.pointsAwarded } : u));
          if (currentUser && (currentUser.id === p.userId || currentUser.email === p.userEmail)) {
            setCurrentUser(u => u ? { ...u, ecoPoints: u.ecoPoints + p.pointsAwarded } : null);
          }
        }
        return { ...p, status, reviewNotes: notes };
      }
      return p;
    }));
  };

  const updateUserKyc = (userId: string, kycData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...kycData } : u));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...kycData } : null);
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <ClimateContext.Provider value={{
      currentUser, setCurrentUser,
      activeTab, setActiveTab,
      reports, addReport, updateReportStatus, upvoteReport,
      weather, updateWeather,
      announcements, addAnnouncement, toggleHideAnnouncement, deleteAnnouncement,
      activities, addActivity, toggleHideActivity, deleteActivity,
      participations, submitParticipationProof, reviewParticipationProof,
      articles: initialArticles,
      quizzes: initialQuizzes,
      users, updateUserKyc, toggleUserStatus,
      notifications, markNotificationRead,
      authModalOpen, setAuthModalOpen,
      selectedReportModal, setSelectedReportModal,
      selectedActivityModal, setSelectedActivityModal,
      selectedArticleModal, setSelectedArticleModal,
      quizModalOpen, setQuizModalOpen,
      kycModalOpen, setKycModalOpen,
      notificationsOpen, setNotificationsOpen
    }}>
      {children}
    </ClimateContext.Provider>
  );
};

export const useClimate = () => {
  const ctx = useContext(ClimateContext);
  if (!ctx) throw new Error('useClimate must be used within ClimateProvider');
  return ctx;
};
