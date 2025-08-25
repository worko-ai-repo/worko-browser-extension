// Core type definitions for the Worko Browser Extension

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  profileImage?: string; // URL to profile image
  resumeUrl?: string; // URL to resume/CV
  skills: UserSkill[];
  experience: number; // in years
  education: UserEducation[];
  location?: string;
  preferences: JobPreferences;
}

export interface UserSkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
}

export interface UserEducation {
  degree: string;
  institution: string;
  year: number;
  field: string;
}

export interface JobPreferences {
  preferredLocations: string[];
  preferredIndustries: string[];
  preferredRoles: string[];
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface JobData {
  title: string;
  company: string;
  description: string;
  requirements: string;
  location: string;
  url: string;
  platform: 'naukri' | 'naukrigulf' | 'linkedin';
  extractedAt: number;
  salary?: string;
  experience?: string;
  jobType?: string;
}

export interface ScoreBreakdown {
  experienceScore: number;
  skillsScore: number;
  educationScore: number;
  locationScore: number;
  industryScore: number;
  roleScore: number;
  responsibilitiesScore: number;
}

export interface ScoreResponse {
  matchingScore: number; // 0-100 overall score
  breakdown: ScoreBreakdown;
  explanation: {
    experience: string;
    skills: string;
    education: string;
    location: string;
    industry: string;
    role: string;
    responsibilities: string;
  };
  overallExplanation: string;
  matchingKeywords: string[];
  missingSkills: string[];
}

export interface JobScore {
  id: string;
  jobData: JobData;
  score: number;
  breakdown: ScoreBreakdown;
  timestamp: number;
  applied: boolean;
  platform: 'naukri' | 'naukrigulf' | 'linkedin';
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  matchingScore: number;
  status: 'APPLIED' | 'REJECTED' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFERED' | 'HIRED';
  createdAt: string;
  updatedAt: string;
  jobUrl: string;
  rejectionFeedbackBySystem?: string;
  scoreDetails?: string;
}

export interface JobApplicationsResponse {
  data: JobApplication[];
  pagination: {
    count: number;
    pageSize: number;
    sortOrder: string;
    timesQueried: number;
    queriedCount: number;
  };
}

export interface ExtensionConfig {
  apiBaseURL: string;
  amplify: {
    userPoolId: string;
    userPoolClientId: string;
    cognitoDomain: string;
    region: string;
  };
  features: {
    debugLogging: boolean;
    performanceMonitoring: boolean;
    errorReporting: boolean;
  };
  jobMatching: {
    maxHistorySize: number;
    defaultScoreThreshold: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface ExtensionMessage {
  type: 'CHECK_AUTH' | 'AUTHENTICATE' | 'LOGOUT' | 'SCORE_JOB' | 'GET_HISTORY' | 'GET_JOB_APPLICATIONS' | 'REFRESH_JOB_APPLICATIONS' | 'APPLY_JOB' | 'GET_USER_PROFILE' | 'EXTRACT_JOB_DATA' | 'SAVE_JOB';
  payload?: any;
  tabId?: number;
  requestId?: string;
}

export interface ExtensionResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId?: string;
}

// Chrome extension specific types
export interface ChromeStorageData {
  authTokens?: AuthTokens;
  userProfile?: UserProfile;
  jobHistory?: JobScore[];
  extensionConfig?: ExtensionConfig;
}

// Job platform specific types
export interface NaukriJobData extends JobData {
  platform: 'naukri';
  jobId?: string;
  companyId?: string;
}

export interface NaukriGulfJobData extends JobData {
  platform: 'naukrigulf';
  jobId?: string;
  companyId?: string;
}

export interface LinkedInJobData extends JobData {
  platform: 'linkedin';
  jobId?: string;
  companyId?: string;
}