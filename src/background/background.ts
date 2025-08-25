// Background script for Worko Browser Extension
// This service worker handles extension lifecycle, API calls, and coordination between components

import { ExtensionMessage, ExtensionResponse, UserProfile } from '@/types';
import { CONFIG } from '@shared/config';
import { simpleAuthManager } from '@shared/simple-auth-manager';
import { apiClient } from '@shared/api-client';

console.log('Worko Browser Extension background script loaded');

// Cache for job applications data
interface CacheData {
  jobApplications: any;
  lastFetch: number;
  userEmail: string;
}

// Cache for user profile data
interface UserProfileCache {
  userProfile: UserProfile;
  lastFetch: number;
  userEmail: string;
}

let jobApplicationsCache: CacheData | null = null;
let userProfileCache: UserProfileCache | null = null;
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const PROFILE_CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes for profile

// Function to handle refresh job applications
async function handleRefreshJobApplications(): Promise<ExtensionResponse> {
  try {
    console.log('Force refreshing job applications...');
    
    // Get current user to get email
    const currentUser = await simpleAuthManager.getCurrentUser();
    
    if (!currentUser || !currentUser.email) {
      return {
        success: false,
        error: 'User email not found - please login again'
      };
    }
    
    // Clear cache to force fresh fetch
    jobApplicationsCache = null;
    
    // Fetch fresh job applications from API
    const jobApplications = await apiClient.getUserJobApplications(currentUser.email);
    
    // Update cache
    jobApplicationsCache = {
      jobApplications,
      lastFetch: Date.now(),
      userEmail: currentUser.email
    };
    
    console.log('Job applications force refreshed successfully:', jobApplications.data.length);
    
    return {
      success: true,
      data: jobApplications
    };
    
  } catch (error) {
    console.error('Failed to refresh job applications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh job applications'
    };
  }
}

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // First time installation
    console.log('First time installation - setting up defaults');
    initializeExtension();
  } else if (details.reason === 'update') {
    // Extension updated
    console.log('Extension updated from version:', details.previousVersion);
  }
});

// Message handler for communication between components
chrome.runtime.onMessage.addListener((
  message: ExtensionMessage,
  sender,
  sendResponse: (response: ExtensionResponse) => void
) => {
  console.log('Background received message:', message.type);
  
  // Handle async operations
  handleMessage(message, sender)
    .then(response => sendResponse(response))
    .catch(error => {
      console.error('Message handling error:', error);
      sendResponse({
        success: false,
        error: error.message,
        requestId: message.requestId || undefined
      });
    });
  
  // Return true to indicate async response
  return true;
});

// Initialize extension on first install
async function initializeExtension() {
  try {
    // Set default configuration
    await chrome.storage.local.set({
      extensionConfig: CONFIG,
      jobHistory: [],
      lastSync: Date.now()
    });
    
    console.log('Extension initialized successfully');
  } catch (error) {
    console.error('Failed to initialize extension:', error);
  }
}

// Handle messages from popup and content scripts
async function handleMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender
): Promise<ExtensionResponse> {
  
  switch (message.type) {
    case 'CHECK_AUTH':
      return handleCheckAuth();
      
    case 'AUTHENTICATE':
      return handleAuthenticate();
      
    case 'GET_USER_PROFILE':
      return handleGetUserProfile();
      
    case 'SCORE_JOB':
      return handleScoreJob(message.payload);
      
    case 'GET_HISTORY':
      return handleGetHistory();
      
    case 'GET_JOB_APPLICATIONS':
      return handleGetJobApplications();
      
    case 'REFRESH_JOB_APPLICATIONS':
      return handleRefreshJobApplications();
      
    case 'LOGOUT':
      return handleLogout();
      
    case 'EXTRACT_JOB_DATA':
      return handleExtractJobData(message.payload, sender.tab?.id);
      
    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

// Authentication and user profile handlers
async function handleCheckAuth(): Promise<ExtensionResponse> {
  try {
    console.log('Checking authentication status...');
    
    // Check if user is already signed in
    const currentUser = await simpleAuthManager.getCurrentUser();
    
    if (currentUser) {
      console.log('User is authenticated:', currentUser.name);
      return {
        success: true,
        data: currentUser
      };
    } else {
      console.log('User is not authenticated');
      return {
        success: false,
        error: 'User not authenticated'
      };
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Auth check failed'
    };
  }
}

async function handleGetUserProfile(): Promise<ExtensionResponse> {
  try {
    console.log('Getting user profile for scoring...');
    
    // Check if user is authenticated
    const isAuthenticated = await simpleAuthManager.isAuthenticated();
    
    if (!isAuthenticated) {
      return {
        success: false,
        error: 'Not authenticated - login required'
      };
    }
    
    // Get current user email
    const currentUser = await simpleAuthManager.getCurrentUser();
    const userEmail = currentUser?.email;
    
    if (!userEmail) {
      return {
        success: false,
        error: 'User email not found - please login again'
      };
    }
    
    const now = Date.now();
    
    // Check if we have valid cached profile data
    if (userProfileCache && 
        userProfileCache.userEmail === userEmail &&
        (now - userProfileCache.lastFetch) < PROFILE_CACHE_EXPIRY_MS) {
      
      console.log('Returning cached user profile');
      return {
        success: true,
        data: userProfileCache.userProfile
      };
    }
    
    console.log('Fetching fresh user profile from API...');
    
    // Get user profile from storage first (faster)
    let userProfile = await simpleAuthManager.getCurrentUser();
    
    if (!userProfile || !userProfile.skills || userProfile.skills.length === 0) {
      // Get complete profile from API
      try {
        userProfile = await apiClient.getCompleteUserProfile(userEmail);
        await chrome.storage.local.set({ userProfile });
      } catch (apiError) {
        console.warn('Failed to get complete profile from API, using basic profile:', apiError);
        // Use basic profile if API fails
        if (!userProfile) {
          throw new Error('No user profile available');
        }
      }
    }
    
    // Update cache
    userProfileCache = {
      userProfile,
      lastFetch: now,
      userEmail
    };
    
    console.log('User profile retrieved and cached successfully');
    return {
      success: true,
      data: userProfile
    };
    
  } catch (error) {
    console.error('Failed to get user profile:', error);
    
    // If we have cached data, return it as fallback
    if (userProfileCache && userProfileCache.userEmail === (await simpleAuthManager.getCurrentUser())?.email) {
      console.log('API failed, returning cached profile as fallback');
      return {
        success: true,
        data: userProfileCache.userProfile
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user profile'
    };
  }
}

async function handleAuthenticate(): Promise<ExtensionResponse> {
  try {
    console.log('Starting authentication process...');
    
    // Attempt OAuth sign-in
    const result = await simpleAuthManager.signIn();
    
    if (result.success && result.user) {
      // Try to get complete user profile from API
      let userProfile = result.user;
      
      try {
        if (result.user.email) {
          const completeProfile = await apiClient.getCompleteUserProfile(result.user.email);
          userProfile = completeProfile;
        } else {
          console.warn('No email found in user profile, skipping API call');
        }
      } catch (apiError) {
        console.warn('Failed to get complete profile from API, using basic profile:', apiError);
        // Use the basic profile from OAuth if API fails
      }
      
      // Store user profile in chrome storage for session persistence
      await chrome.storage.local.set({ userProfile });
      
      console.log('Authentication successful');
      return {
        success: true,
        data: userProfile
      };
    } else {
      throw new Error(result.error || 'Authentication failed');
    }
    
  } catch (error) {
    console.error('Authentication failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}

async function handleLogout(): Promise<ExtensionResponse> {
  try {
    console.log('Logging out user...');
    
    // Sign out from auth manager
    await simpleAuthManager.signOut();
    
    // Clear all stored data
    await chrome.storage.local.clear();
    
    // Clear job applications cache
    jobApplicationsCache = null;
    
    // Clear user profile cache
    userProfileCache = null;
    
    console.log('Logout successful');
    return {
      success: true,
      data: { message: 'Logged out successfully' }
    };
  } catch (error) {
    console.error('Logout failed:', error);
    
    // Even if logout fails, clear local storage
    await chrome.storage.local.clear();
    
    // Clear job applications cache
    jobApplicationsCache = null;
    
    // Clear user profile cache
    userProfileCache = null;
    
    return {
      success: true,
      data: { message: 'Logged out (with errors)' }
    };
  }
}

async function handleScoreJob(payload: any): Promise<ExtensionResponse> {
  try {
    console.log('Starting job scoring process...');
    console.log('Received payload:', payload);
    
    const { jobData } = payload;
    
    if (!jobData) {
      console.error('No jobData in payload:', payload);
      throw new Error('No job data provided for scoring');
    }
    
    console.log('Job data received for scoring:', jobData);
    
    // Get user profile for scoring
    const userProfileResponse = await handleGetUserProfile();
    
    if (!userProfileResponse.success || !userProfileResponse.data) {
      throw new Error('User profile not available for scoring');
    }
    
    const userProfile = userProfileResponse.data;
    
    // Calculate job score using our scoring algorithm
    const scoreResult = calculateJobScore(jobData, userProfile);
    
    // Save scored job to history
    const jobScore = {
      id: `${jobData.platform}_${Date.now()}`,
      jobData,
      score: scoreResult.matchingScore,
      breakdown: scoreResult.breakdown,
      timestamp: Date.now(),
      applied: false,
      platform: jobData.platform
    };
    
    // Update job history
    const historyResult = await chrome.storage.local.get(['jobHistory']);
    const jobHistory = historyResult.jobHistory || [];
    
    // Add new score and limit history size
    jobHistory.unshift(jobScore);
    const maxHistorySize = CONFIG.jobMatching.maxHistorySize;
    if (jobHistory.length > maxHistorySize) {
      jobHistory.splice(maxHistorySize);
    }
    
    await chrome.storage.local.set({ jobHistory });
    
    console.log('Job scored successfully:', scoreResult.matchingScore);
    
    return {
      success: true,
      data: scoreResult
    };
    
  } catch (error) {
    console.error('Job scoring failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Job scoring failed'
    };
  }
}

async function handleGetHistory(): Promise<ExtensionResponse> {
  const result = await chrome.storage.local.get(['jobHistory']);
  return {
    success: true,
    data: result.jobHistory || []
  };
}

async function handleGetJobApplications(): Promise<ExtensionResponse> {
  try {
    console.log('Handling job applications request...');
    
    // Get current user to get email
    const currentUser = await simpleAuthManager.getCurrentUser();
    
    if (!currentUser || !currentUser.email) {
      return {
        success: false,
        error: 'User email not found - please login again'
      };
    }
    
    const now = Date.now();
    
    // Check if we have valid cached data for this user
    if (jobApplicationsCache && 
        jobApplicationsCache.userEmail === currentUser.email &&
        (now - jobApplicationsCache.lastFetch) < CACHE_EXPIRY_MS) {
      
      console.log('Returning cached job applications data');
      return {
        success: true,
        data: jobApplicationsCache.jobApplications
      };
    }
    
    console.log('Fetching fresh job applications from API...');
    
    // Fetch job applications from API
    const jobApplications = await apiClient.getUserJobApplications(currentUser.email);
    
    // Update cache
    jobApplicationsCache = {
      jobApplications,
      lastFetch: now,
      userEmail: currentUser.email
    };
    
    console.log('Job applications retrieved and cached successfully:', jobApplications.data.length);
    
    return {
      success: true,
      data: jobApplications
    };
    
  } catch (error) {
    console.error('Failed to get job applications:', error);
    
    // If we have cached data, return it as fallback
    if (jobApplicationsCache && jobApplicationsCache.userEmail === (await simpleAuthManager.getCurrentUser())?.email) {
      console.log('API failed, returning cached data as fallback');
      return {
        success: true,
        data: jobApplicationsCache.jobApplications
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch job applications'
    };
  }
}



async function handleExtractJobData(payload: any, tabId?: number): Promise<ExtensionResponse> {
  return {
    success: true,
    data: { message: 'Job extraction handler - to be implemented', payload, tabId }
  };
}

// Job scoring algorithm
function calculateJobScore(jobData: any, userProfile: UserProfile): any {
  console.log('Calculating job score for:', jobData.title);
  
  const breakdown = {
    experienceScore: 0,
    skillsScore: 0,
    educationScore: 0,
    locationScore: 0,
    industryScore: 0,
    roleScore: 0,
    responsibilitiesScore: 0
  };
  
  const explanation = {
    experience: '',
    skills: '',
    education: '',
    location: '',
    industry: '',
    role: '',
    responsibilities: ''
  };
  
  // 1. Experience Score (25% weight)
  breakdown.experienceScore = calculateExperienceScore(jobData, userProfile);
  explanation.experience = getExperienceExplanation(jobData, userProfile, breakdown.experienceScore);
  
  // 2. Skills Score (30% weight)
  breakdown.skillsScore = calculateSkillsScore(jobData, userProfile);
  explanation.skills = getSkillsExplanation(jobData, userProfile, breakdown.skillsScore);
  
  // 3. Education Score (15% weight)
  breakdown.educationScore = calculateEducationScore(jobData, userProfile);
  explanation.education = getEducationExplanation(jobData, userProfile, breakdown.educationScore);
  
  // 4. Location Score (10% weight)
  breakdown.locationScore = calculateLocationScore(jobData, userProfile);
  explanation.location = getLocationExplanation(jobData, userProfile, breakdown.locationScore);
  
  // 5. Industry/Role Score (20% weight)
  breakdown.roleScore = calculateRoleScore(jobData, userProfile);
  explanation.role = getRoleExplanation(jobData, userProfile, breakdown.roleScore);
  
  // Calculate weighted overall score
  const weights = {
    experience: 0.25,
    skills: 0.30,
    education: 0.15,
    location: 0.10,
    role: 0.20
  };
  
  const matchingScore = Math.round(
    breakdown.experienceScore * weights.experience +
    breakdown.skillsScore * weights.skills +
    breakdown.educationScore * weights.education +
    breakdown.locationScore * weights.location +
    breakdown.roleScore * weights.role
  );
  
  // Generate overall explanation
  const overallExplanation = generateOverallExplanation(matchingScore, breakdown);
  
  // Extract matching keywords and missing skills
  const matchingKeywords = extractMatchingKeywords(jobData, userProfile);
  const missingSkills = extractMissingSkills(jobData, userProfile);
  
  return {
    matchingScore,
    breakdown,
    explanation,
    overallExplanation,
    matchingKeywords,
    missingSkills
  };
}

// Experience scoring
function calculateExperienceScore(jobData: any, userProfile: UserProfile): number {
  const jobDescription = (jobData.description + ' ' + jobData.requirements).toLowerCase();
  const userExperience = userProfile.experience || 0;
  
  // Extract required experience from job description
  const experiencePatterns = [
    /(\d+)[\s-]*(?:to|-)[\s]*(\d+)[\s]*years?/i,
    /(\d+)\+?\s*years?/i,
    /minimum\s*(\d+)\s*years?/i,
    /at least\s*(\d+)\s*years?/i
  ];
  
  let requiredExperience = 0;
  
  for (const pattern of experiencePatterns) {
    const match = jobDescription.match(pattern);
    if (match) {
      if (match[2]) {
        // Range like "2-5 years"
        requiredExperience = parseInt(match[1]);
      } else {
        // Single number like "3 years"
        requiredExperience = parseInt(match[1]);
      }
      break;
    }
  }
  
  if (requiredExperience === 0) {
    // If no specific experience mentioned, assume entry level
    requiredExperience = 1;
  }
  
  // Score based on experience match
  if (userExperience >= requiredExperience) {
    // User meets or exceeds requirement
    const excess = userExperience - requiredExperience;
    if (excess <= 2) {
      return 100; // Perfect match
    } else if (excess <= 5) {
      return 85; // Slightly overqualified
    } else {
      return 70; // Significantly overqualified
    }
  } else {
    // User has less experience than required
    const deficit = requiredExperience - userExperience;
    if (deficit <= 1) {
      return 80; // Close match
    } else if (deficit <= 2) {
      return 60; // Moderate gap
    } else {
      return 30; // Large gap
    }
  }
}

// Skills scoring
function calculateSkillsScore(jobData: any, userProfile: UserProfile): number {
  const jobText = (jobData.title + ' ' + jobData.description + ' ' + jobData.requirements).toLowerCase();
  const userSkills = userProfile.skills.map(skill => skill.name.toLowerCase());
  
  // Common technical skills to look for
  const skillKeywords = [
    'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js', 'express',
    'sql', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'docker', 'kubernetes',
    'git', 'agile', 'scrum', 'html', 'css', 'typescript', 'php', 'laravel', 'django',
    'spring', 'hibernate', 'redis', 'elasticsearch', 'jenkins', 'ci/cd', 'devops',
    'machine learning', 'ai', 'data science', 'analytics', 'tableau', 'power bi',
    'project management', 'leadership', 'communication', 'problem solving'
  ];
  
  let matchedSkills = 0;
  let totalRelevantSkills = 0;
  
  // Check for skill matches
  for (const skill of skillKeywords) {
    if (jobText.includes(skill)) {
      totalRelevantSkills++;
      if (userSkills.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))) {
        matchedSkills++;
      }
    }
  }
  
  // Also check user skills directly
  for (const userSkill of userSkills) {
    if (jobText.includes(userSkill) && !skillKeywords.includes(userSkill)) {
      matchedSkills++;
      totalRelevantSkills++;
    }
  }
  
  if (totalRelevantSkills === 0) {
    return 50; // No specific skills mentioned, neutral score
  }
  
  const skillMatchPercentage = (matchedSkills / totalRelevantSkills) * 100;
  return Math.min(100, Math.max(0, skillMatchPercentage));
}

// Education scoring
function calculateEducationScore(jobData: any, userProfile: UserProfile): number {
  const jobText = (jobData.description + ' ' + jobData.requirements).toLowerCase();
  const userEducation = userProfile.education || [];
  
  // Check for degree requirements
  const degreePatterns = [
    /bachelor|b\.?tech|b\.?e|b\.?sc|undergraduate/i,
    /master|m\.?tech|m\.?e|m\.?sc|mba|graduate/i,
    /phd|doctorate|ph\.?d/i
  ];
  
  let requiredDegreeLevel = 0; // 0: none, 1: bachelor, 2: master, 3: phd
  
  for (let i = 0; i < degreePatterns.length; i++) {
    if (jobText.match(degreePatterns[i])) {
      requiredDegreeLevel = i + 1;
      break;
    }
  }
  
  if (requiredDegreeLevel === 0) {
    return 75; // No specific education requirement
  }
  
  // Check user's highest degree
  let userDegreeLevel = 0;
  for (const edu of userEducation) {
    const degree = edu.degree.toLowerCase();
    if (degree.includes('phd') || degree.includes('doctorate')) {
      userDegreeLevel = Math.max(userDegreeLevel, 3);
    } else if (degree.includes('master') || degree.includes('mba') || degree.includes('m.tech')) {
      userDegreeLevel = Math.max(userDegreeLevel, 2);
    } else if (degree.includes('bachelor') || degree.includes('b.tech') || degree.includes('b.e')) {
      userDegreeLevel = Math.max(userDegreeLevel, 1);
    }
  }
  
  if (userDegreeLevel >= requiredDegreeLevel) {
    return 100; // Meets or exceeds requirement
  } else if (userDegreeLevel === requiredDegreeLevel - 1) {
    return 70; // One level below
  } else {
    return 40; // Significantly below requirement
  }
}

// Location scoring
function calculateLocationScore(jobData: any, userProfile: UserProfile): number {
  const jobLocation = jobData.location?.toLowerCase() || '';
  const userLocation = userProfile.location?.toLowerCase() || '';
  const preferredLocations = userProfile.preferences?.preferredLocations?.map(loc => loc.toLowerCase()) || [];
  
  if (!jobLocation) {
    return 75; // No location specified, neutral score
  }
  
  // Check if job location matches user's current location
  if (userLocation && jobLocation.includes(userLocation)) {
    return 100;
  }
  
  // Check if job location matches preferred locations
  for (const prefLoc of preferredLocations) {
    if (jobLocation.includes(prefLoc) || prefLoc.includes(jobLocation)) {
      return 90;
    }
  }
  
  // Check for remote work
  if (jobLocation.includes('remote') || jobLocation.includes('work from home')) {
    return 95;
  }
  
  return 30; // Location doesn't match preferences
}

// Role scoring
function calculateRoleScore(jobData: any, userProfile: UserProfile): number {
  const jobTitle = jobData.title.toLowerCase();
  const jobDescription = jobData.description.toLowerCase();
  const preferredRoles = userProfile.preferences?.preferredRoles?.map(role => role.toLowerCase()) || [];
  
  // Check if job title matches preferred roles
  for (const prefRole of preferredRoles) {
    if (jobTitle.includes(prefRole) || prefRole.includes(jobTitle)) {
      return 100;
    }
  }
  
  // Check job description for role keywords
  let roleScore = 50; // Base score
  
  // Common role indicators
  const roleKeywords = {
    'developer': ['developer', 'development', 'coding', 'programming'],
    'engineer': ['engineer', 'engineering', 'technical'],
    'manager': ['manager', 'management', 'lead', 'leadership'],
    'analyst': ['analyst', 'analysis', 'data', 'research'],
    'designer': ['designer', 'design', 'ui', 'ux'],
    'consultant': ['consultant', 'consulting', 'advisory']
  };
  
  for (const [role, keywords] of Object.entries(roleKeywords)) {
    if (preferredRoles.some(prefRole => prefRole.includes(role))) {
      const keywordMatches = keywords.filter(keyword => 
        jobTitle.includes(keyword) || jobDescription.includes(keyword)
      ).length;
      
      if (keywordMatches > 0) {
        roleScore = Math.max(roleScore, 70 + (keywordMatches * 10));
      }
    }
  }
  
  return Math.min(100, roleScore);
}

// Explanation generators
function getExperienceExplanation(jobData: any, userProfile: UserProfile, score: number): string {
  const userExp = userProfile.experience || 0;
  if (score >= 90) {
    return `Your ${userExp} years of experience aligns well with the job requirements.`;
  } else if (score >= 70) {
    return `Your experience level is acceptable for this role.`;
  } else {
    return `You may need more experience for this role, but don't let that stop you from applying.`;
  }
}

function getSkillsExplanation(jobData: any, userProfile: UserProfile, score: number): string {
  if (score >= 80) {
    return `Your skills are a strong match for this position.`;
  } else if (score >= 60) {
    return `You have some relevant skills for this role.`;
  } else {
    return `Consider developing additional skills mentioned in the job description.`;
  }
}

function getEducationExplanation(jobData: any, userProfile: UserProfile, score: number): string {
  if (score >= 90) {
    return `Your educational background meets the requirements.`;
  } else if (score >= 70) {
    return `Your education is relevant to this role.`;
  } else {
    return `Additional qualifications might be beneficial.`;
  }
}

function getLocationExplanation(jobData: any, userProfile: UserProfile, score: number): string {
  if (score >= 90) {
    return `The job location aligns with your preferences.`;
  } else {
    return `Consider if the location works for you.`;
  }
}

function getRoleExplanation(jobData: any, userProfile: UserProfile, score: number): string {
  if (score >= 80) {
    return `This role matches your career interests.`;
  } else {
    return `This role might be a good opportunity to explore new areas.`;
  }
}

function generateOverallExplanation(score: number, breakdown: any): string {
  if (score >= 75) {
    return `Excellent match! This job aligns well with your profile across multiple dimensions.`;
  } else if (score >= 50) {
    return `Good match. You meet many of the requirements for this position.`;
  } else if (score >= 30) {
    return `Moderate match. Consider if this role aligns with your career goals.`;
  } else {
    return `Lower match. This role might require significant skill development.`;
  }
}

function extractMatchingKeywords(jobData: any, userProfile: UserProfile): string[] {
  const jobText = (jobData.title + ' ' + jobData.description + ' ' + jobData.requirements).toLowerCase();
  const userSkills = userProfile.skills.map(skill => skill.name.toLowerCase());
  
  const matchingKeywords: string[] = [];
  
  for (const skill of userSkills) {
    if (jobText.includes(skill)) {
      matchingKeywords.push(skill);
    }
  }
  
  return matchingKeywords.slice(0, 10); // Limit to top 10
}

function extractMissingSkills(jobData: any, userProfile: UserProfile): string[] {
  const jobText = (jobData.title + ' ' + jobData.description + ' ' + jobData.requirements).toLowerCase();
  const userSkills = userProfile.skills.map(skill => skill.name.toLowerCase());
  
  const commonSkills = [
    'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js',
    'sql', 'mongodb', 'aws', 'docker', 'git', 'agile', 'html', 'css'
  ];
  
  const missingSkills: string[] = [];
  
  for (const skill of commonSkills) {
    if (jobText.includes(skill) && !userSkills.some(userSkill => userSkill.includes(skill))) {
      missingSkills.push(skill);
    }
  }
  
  return missingSkills.slice(0, 5); // Limit to top 5
}

// Export for testing
export { handleMessage, initializeExtension, calculateJobScore };