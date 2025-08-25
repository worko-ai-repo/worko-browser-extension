import { ExtensionConfig } from '@/types';

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';

// Base configuration
export const CONFIG: ExtensionConfig = {
  apiBaseURL: isDevelopment 
    ? 'https://api.dev.worko.work' 
    : 'https://api.worko.ai',
    
  amplify: {
    userPoolId: isDevelopment 
      ? 'ap-south-1_xGreJKkNc' 
      : process.env.WORKO_COGNITO_USER_POOL_ID || 'PROD_USER_POOL_ID_PLACEHOLDER',
    userPoolClientId: isDevelopment 
      ? '16sh5s2bo3169886fdm8gtp0e4' 
      : process.env.WORKO_COGNITO_CLIENT_ID || 'PROD_CLIENT_ID_PLACEHOLDER',
    cognitoDomain: isDevelopment 
      ? 'https://worko-dev.auth.ap-south-1.amazoncognito.com' 
      : 'https://worko-prod.auth.ap-south-1.amazoncognito.com',
    region: 'ap-south-1'
  },
  
  features: {
    debugLogging: isDevelopment,
    performanceMonitoring: true,
    errorReporting: true
  },
  
  jobMatching: {
    maxHistorySize: 50,
    defaultScoreThreshold: 30
  }
};

// Worko brand colors and theme
export const WORKO_THEME = {
  colors: {
    brand: '#170155',
    brandBright: '#22019c',
    primary: '#316bff',
    secondary: '#38a1d6',
    gradientFrom: '#316bff',
    gradientTo: '#38a1d6',
    
    // Score colors
    success: '#16a34a',    // Green - >75%
    warning: '#eab308',    // Yellow - 50-74%
    amber: '#f59e0b',      // Amber - 30-49%
    danger: '#dc2626',     // Red - <30%
    
    // Background & Text
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#213547',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    
    // Dark theme
    darkBg: '#121212',
    darkSurface: '#181818',
    darkText: '#ffffff',
    darkTextSecondary: '#a0a0a0',
    darkBorder: '#333333'
  },
  
  typography: {
    fontFamily: 'Poppins, system-ui, Avenir, Helvetica, Arial, sans-serif',
    sizes: {
      xs: '10px',
      sm: '12px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px'
    }
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px'
  },
  
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px'
  }
};

// Extension dimensions
export const EXTENSION_DIMENSIONS = {
  popup: {
    width: 320,
    height: 480,
    minHeight: 200
  }
};

// Job platform configurations
export const PLATFORM_CONFIG = {
  naukri: {
    baseUrl: 'https://www.naukri.com',
    selectors: {
      jobTitle: '.jd-header-title',
      company: '.jd-header-comp-name',
      description: '.dang-inner-html',
      requirements: '.job-desc',
      location: '.jd-loc',
      salary: '.salary'
    }
  },
  
  linkedin: {
    baseUrl: 'https://www.linkedin.com',
    selectors: {
      jobTitle: '.job-details-jobs-unified-top-card__job-title',
      company: '.job-details-jobs-unified-top-card__company-name',
      description: '.job-details-jobs-unified-top-card__job-description',
      requirements: '.job-details-jobs-unified-top-card__job-insight',
      location: '.job-details-jobs-unified-top-card__bullet',
      salary: '.job-details-jobs-unified-top-card__job-insight--highlight'
    }
  }
};

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    userBasicDetails: '/user/basic-details',
    userProfile: (userId: string) => `/user/${userId}/profile`,
    userSkills: (userId: string) => `/user/${userId}/skills`,
    userExperience: (userId: string) => `/user/${userId}/experience`,
    userEducation: (userId: string) => `/user/${userId}/education`
  }
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKENS: 'authTokens',
  USER_PROFILE: 'userProfile',
  JOB_HISTORY: 'jobHistory',
  EXTENSION_CONFIG: 'extensionConfig',
  LAST_SYNC: 'lastSync'
};

// Score thresholds for color coding
export const SCORE_THRESHOLDS = {
  EXCELLENT: 75,  // Green
  GOOD: 50,       // Yellow
  FAIR: 30,       // Amber
  POOR: 0         // Red
};

export default CONFIG;