export type UserRole = 'Citizen' | 'Administrator' | 'Environmental Officer';
export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type ReportSeverity = 'Critical' | 'High' | 'Moderate' | 'Low';
export type ReportStatus = 'Submitted' | 'Under Review' | 'Verified' | 'In Progress' | 'Resolved' | 'Closed';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: UserRole;
  points: number;
  barangay: string;
  municipality: string;
  address: string;
  isVerified: boolean;
  kycStatus: KycStatus;
  kycIdType?: string;
  kycIdNumber?: string;
  avatarColorHex: string;
}

export interface Report {
  id: number;
  userId: number;
  authorName: string;
  title: string;
  category: string;
  categoryIcon: string;
  description: string;
  photoUri?: string;
  samplePhotoDrawable?: string;
  latitude: number;
  longitude: number;
  barangay: string;
  municipality: string;
  province: string;
  severity: ReportSeverity;
  status: ReportStatus;
  adminRemarks?: string;
  assignedOfficer?: string;
  resolutionEvidence?: string;
  timestamp: number;
}

export interface ReportUpdate {
  id: number;
  reportId: number;
  status: ReportStatus;
  remarks: string;
  updatedBy: string;
  timestamp: number;
}

export interface ClimateArticle {
  id: number;
  title: string;
  category: string;
  icon: string;
  summary: string;
  content: string;
  actionTips: string[];
  references: string;
  readTimeMinutes: number;
}

export interface Activity {
  id: number;
  title: string;
  category: string;
  icon: string;
  description: string;
  location: string;
  barangay: string;
  dateText: string;
  timeText: string;
  rewardPoints: number;
  maxParticipants: number;
  currentParticipants: number;
  isRegistered: boolean;
  isCompleted: boolean;
  proofSubmitted?: boolean;
  proofNote?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswerIndex: number;
  explanation: string;
  category: string;
}

export interface PointsLog {
  id: number;
  userId: number;
  action: string;
  points: number;
  timestamp: number;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'Report' | 'Activity' | 'Advisory' | 'Quiz';
  isRead: boolean;
  timestamp: number;
}

export interface WeatherData {
  temp: number;
  heatIndex: number;
  condition: string;
  alertLevel: 'Normal' | 'Yellow' | 'Orange' | 'Red';
  alertTitle: string;
  advisoryText: string;
  humidity: number;
  windSpeed: number;
  airQualityIndex: number;
  updatedAt: string;
}
