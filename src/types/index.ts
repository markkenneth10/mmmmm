export type UserRole = 'citizen' | 'sub_admin' | 'super_admin';

export interface User {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  phone?: string;
  address?: string;
  barangay?: string;
  avatar?: string;
  avatarUrl?: string;
  role: UserRole;
  status: 'Active' | 'Suspended';
  ecoPoints: number;
  kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  kycIdType?: string;
  kycIdNumber?: string;
  kycDocument?: string;
  kycRejectReason?: string;
}

export interface IncidentReport {
  id: string;
  userId?: string;
  reporterName: string;
  reporterPhone?: string;
  title: string;
  category: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  description: string;
  barangay: string;
  locationText?: string;
  latitude: number;
  longitude: number;
  photoUrl?: string;
  status: 'Submitted' | 'In Inspection' | 'Action In Progress' | 'Resolved';
  assignedUnit?: string;
  inspectionNotes?: string;
  resolutionSummary?: string;
  upvotes: number;
  createdAt: number;
  updatedAt: number;
}

export interface WeatherAdvisory {
  temperature: number;
  heatIndex: number;
  condition: string;
  conditionIcon: string;
  alertLevel: 'Green' | 'Yellow' | 'Orange' | 'Red';
  airQuality: string;
  typhoonSignal: string;
  advisoryNotice: string;
  safetyTip: string;
  updatedAt: number;
}

export interface Announcement {
  id: string;
  title: string;
  category: string;
  priority: 'Normal' | 'High' | 'Critical';
  content: string;
  imageUrl?: string;
  hidden?: boolean;
  author: string;
  timestamp: number;
}

export interface CommunityActivity {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  description: string;
  organizer: string;
  points: number;
  registered: number;
  max: number;
  hidden?: boolean;
  imageUrl?: string;
}

export interface ActivityParticipation {
  id: string;
  activityId: string;
  activityTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  proofImageUrl: string;
  proofDescription?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  pointsAwarded: number;
  submittedAt: number;
  reviewNotes?: string;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  content: string;
  imageUrl: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'incident' | 'weather' | 'points' | 'announcement';
}
