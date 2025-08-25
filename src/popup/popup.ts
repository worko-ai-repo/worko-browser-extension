// Popup script for Worko Browser Extension
// Handles the main UI logic and user interactions

import { ExtensionMessage, ExtensionResponse } from '@/types';

console.log('Worko Extension popup loaded');

// DOM elements
let elements: { [key: string]: HTMLElement } = {};

// Application state
interface PopupState {
  isAuthenticated: boolean;
  currentView: 'login' | 'dashboard' | 'scoring' | 'results' | 'error';
  userProfile: any;
  currentJob: any;
  jobHistory: any[];
  jobApplications: any[];
  lastDataLoad: number;
}

let state: PopupState = {
  isAuthenticated: false,
  currentView: 'login',
  userProfile: null,
  currentJob: null,
  jobHistory: [],
  jobApplications: [],
  lastDataLoad: 0
};

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);

async function initializePopup() {
  console.log('Initializing popup...');
  
  try {
    // Cache DOM elements
    cacheElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check authentication status
    await checkAuthenticationStatus();
    
    // Load initial data
    await loadInitialData();
    
    console.log('Popup initialized successfully');
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    showError('Failed to initialize extension');
  }
}

function cacheElements() {
  const elementIds = [
    'login-state', 'dashboard-state', 'scoring-state', 'results-state', 'error-state',
    'login-btn', 'logout-btn', 'score-job-btn', 'apply-job-btn', 'save-job-btn',
    'back-btn', 'results-back-btn', 'retry-btn', 'header-loader',
    'user-name', 'user-avatar', 'user-menu', 'resume-link', 'job-applications', 'progress-fill', 'score-badge',
    'job-title', 'job-company', 'job-location', 'overall-explanation-text', 'breakdown-items',
    'matching-skills-list', 'missing-skills-list', 'error-message',
    'job-detection-icon', 'job-detection-title', 'job-detection-subtitle', 'status-indicator',
    'refresh-applications-btn', 'data-cache-info'
  ];
  
  elementIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      elements[id] = element;
    }
  });
}

function setupEventListeners() {
  // Login button
  elements['login-btn']?.addEventListener('click', handleLogin);
  
  // Logout button
  elements['logout-btn']?.addEventListener('click', handleLogout);
  
  // Score job button
  elements['score-job-btn']?.addEventListener('click', handleScoreJob);
  
  // Apply job button
  elements['apply-job-btn']?.addEventListener('click', handleApplyJob);
  
  // Navigation buttons
  elements['back-btn']?.addEventListener('click', () => showView('dashboard'));
  elements['results-back-btn']?.addEventListener('click', () => showView('dashboard'));
  elements['retry-btn']?.addEventListener('click', initializePopup);
  
  // User avatar click to toggle menu
  elements['user-avatar']?.addEventListener('click', toggleUserMenu);
  
  // Refresh applications button
  elements['refresh-applications-btn']?.addEventListener('click', handleRefreshApplications);
  
  // Close menu when clicking outside
  document.addEventListener('click', handleOutsideClick);
}

async function handleLogin() {
  try {
    console.log('Starting login process...');
    
    // Show loading in header
    showHeaderLoader(true);
    
    // Send authentication message to background script
    const response = await sendMessage({ type: 'AUTHENTICATE', payload: {} });
    
    if (response.success) {
      console.log('Login successful');
      state.isAuthenticated = true;
      state.userProfile = response.data;
      showView('dashboard');
      await loadInitialData();
    } else {
      throw new Error(response.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login failed:', error);
    showError('Login failed. Please try again.');
  } finally {
    showHeaderLoader(false);
  }
}

function showHeaderLoader(show: boolean) {
  const loader = elements['header-loader'];
  if (loader) {
    loader.style.display = show ? 'flex' : 'none';
  }
}

function toggleUserMenu(event: Event) {
  event.stopPropagation();
  const menu = elements['user-menu'];
  if (menu) {
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
  }
}

function handleOutsideClick(event: Event) {
  const menu = elements['user-menu'];
  const avatar = elements['user-avatar'];
  
  if (menu && avatar && menu.style.display === 'block') {
    const target = event.target as HTMLElement;
    
    // Check if click is outside the menu and avatar
    if (!menu.contains(target) && !avatar.contains(target)) {
      menu.style.display = 'none';
    }
  }
}

async function handleLogout() {
  try {
    console.log('Logging out...');
    
    // Close user menu
    const menu = elements['user-menu'];
    if (menu) {
      menu.style.display = 'none';
    }
    
    // Send logout message to background script
    const response = await sendMessage({ type: 'LOGOUT', payload: {} });
    
    if (response.success) {
      // Clear all cached data
      clearCachedData();
      state.isAuthenticated = false;
      
      console.log('Logout successful');
      showView('login');
    } else {
      throw new Error(response.error || 'Logout failed');
    }
  } catch (error) {
    console.error('Logout failed:', error);
    
    // Even if logout fails, clear local state and show login
    clearCachedData();
    state.isAuthenticated = false;
    showView('login');
  }
}

async function checkAuthenticationStatus() {
  try {
    console.log('Checking authentication status...');
    
    // Check if user is already authenticated by sending a message to background
    const response = await sendMessage({ type: 'CHECK_AUTH', payload: {} });
    
    if (response.success && response.data) {
      console.log('User is already authenticated:', response.data.name);
      state.isAuthenticated = true;
      state.userProfile = response.data;
      showView('dashboard');
      await loadInitialData();
    } else {
      console.log('User not authenticated, showing login screen');
      state.isAuthenticated = false;
      showView('login');
    }
  } catch (error) {
    console.error('Authentication check failed:', error);
    state.isAuthenticated = false;
    showView('login');
  }
}

async function loadInitialData() {
  if (!state.isAuthenticated) return;
  
  try {
    // Check if we need to refresh job applications data
    const now = Date.now();
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
    const shouldRefreshData = !state.lastDataLoad || (now - state.lastDataLoad) > cacheExpiry;
    
    if (shouldRefreshData || state.jobApplications.length === 0) {
      console.log('Loading fresh job applications data...', {
        shouldRefreshData,
        cacheEmpty: state.jobApplications.length === 0,
        timeSinceLastLoad: state.lastDataLoad ? now - state.lastDataLoad : 'never'
      });
      
      // Load job applications from API
      const applicationsResponse = await sendMessage({ type: 'GET_JOB_APPLICATIONS', payload: {} });
      if (applicationsResponse.success) {
        state.jobApplications = applicationsResponse.data;
        state.lastDataLoad = now;
        updateJobApplicationsUI(applicationsResponse.data);
        updateCacheInfo();
      } else {
        console.error('Failed to load job applications:', applicationsResponse.error);
        // Use cached data if available
        if (state.jobApplications.length > 0) {
          console.log('Using cached job applications data');
          updateJobApplicationsUI(state.jobApplications);
        }
      }
    } else {
      console.log('Using cached job applications data', {
        cacheAge: now - state.lastDataLoad,
        itemCount: state.jobApplications.length
      });
      updateJobApplicationsUI(state.jobApplications);
      updateCacheInfo();
    }
    
    // Update user info
    if (state.userProfile) {
      if (elements['user-name']) {
        elements['user-name'].textContent = state.userProfile.name || 'User';
      }
      
      // Update profile image
      if (elements['user-avatar'] && state.userProfile.profileImage) {
        const avatarImg = elements['user-avatar'] as HTMLImageElement;
        avatarImg.src = state.userProfile.profileImage;
        avatarImg.style.display = 'block';
        avatarImg.classList.add('clickable');
        
        // Handle image load error
        avatarImg.onerror = () => {
          avatarImg.style.display = 'none';
          avatarImg.classList.remove('clickable');
        };
      }
      
      // Update resume link
      if (elements['resume-link'] && state.userProfile.resumeUrl) {
        const resumeLink = elements['resume-link'] as HTMLAnchorElement;
        resumeLink.href = state.userProfile.resumeUrl;
        resumeLink.style.display = 'flex';
      }
    }
    
    // Check if current tab is a job page
    await checkCurrentJobPage();
    
    // Set up periodic job page monitoring
    setupJobPageMonitoring();
    
    // Set up periodic cache info updates
    setupCacheInfoUpdates();
    
  } catch (error) {
    console.error('Failed to load initial data:', error);
  }
}

function setupJobPageMonitoring() {
  // Check job page status every 3 seconds when dashboard is visible
  let monitoringInterval: NodeJS.Timeout;
  
  const startMonitoring = () => {
    if (monitoringInterval) clearInterval(monitoringInterval);
    
    monitoringInterval = setInterval(async () => {
      if (state.currentView === 'dashboard') {
        await checkCurrentJobPage();
      }
    }, 3000);
  };

  // Start monitoring immediately
  startMonitoring();

  // Clean up on popup close
  window.addEventListener('beforeunload', () => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }
  });
}

function setupCacheInfoUpdates() {
  // Update cache info every 30 seconds
  setInterval(() => {
    if (state.currentView === 'dashboard' && state.lastDataLoad) {
      updateCacheInfo();
    }
  }, 30000);
}

// Force refresh job applications data
async function refreshJobApplications() {
  if (!state.isAuthenticated) return;
  
  try {
    console.log('Force refreshing job applications data...');
    
    const applicationsResponse = await sendMessage({ type: 'REFRESH_JOB_APPLICATIONS', payload: {} });
    if (applicationsResponse.success) {
      state.jobApplications = applicationsResponse.data;
      state.lastDataLoad = Date.now();
      updateJobApplicationsUI(applicationsResponse.data);
      updateCacheInfo();
      console.log('Job applications data refreshed successfully');
    } else {
      console.error('Failed to refresh job applications:', applicationsResponse.error);
    }
  } catch (error) {
    console.error('Error refreshing job applications:', error);
  }
}

// Handle refresh applications button click
async function handleRefreshApplications() {
  const refreshBtn = elements['refresh-applications-btn'];
  if (!refreshBtn) return;
  
  try {
    // Show loading state
    refreshBtn.textContent = '⏳';
    refreshBtn.setAttribute('disabled', 'true');
    
    // Force refresh data
    await refreshJobApplications();
    
    // Show success state briefly
    refreshBtn.textContent = '✅';
    setTimeout(() => {
      refreshBtn.textContent = '🔄';
      refreshBtn.removeAttribute('disabled');
    }, 1000);
    
  } catch (error) {
    console.error('Failed to refresh applications:', error);
    
    // Show error state briefly
    refreshBtn.textContent = '❌';
    setTimeout(() => {
      refreshBtn.textContent = '🔄';
      refreshBtn.removeAttribute('disabled');
    }, 1000);
  }
}

// Update cache info display
function updateCacheInfo() {
  const cacheInfoElement = elements['data-cache-info'];
  if (!cacheInfoElement || !state.lastDataLoad) return;
  
  const now = Date.now();
  const timeDiff = now - state.lastDataLoad;
  
  let timeText = '';
  if (timeDiff < 60000) { // Less than 1 minute
    timeText = 'just now';
  } else if (timeDiff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(timeDiff / 60000);
    timeText = `${minutes}m ago`;
  } else {
    const hours = Math.floor(timeDiff / 3600000);
    timeText = `${hours}h ago`;
  }
  
  cacheInfoElement.textContent = `Updated ${timeText}`;
  cacheInfoElement.style.display = 'block';
}

// Clear cached data on logout
function clearCachedData() {
  state.jobApplications = [];
  state.lastDataLoad = 0;
  state.userProfile = null;
  state.currentJob = null;
  state.jobHistory = [];
  
  // Hide cache info
  const cacheInfoElement = elements['data-cache-info'];
  if (cacheInfoElement) {
    cacheInfoElement.style.display = 'none';
  }
}

async function checkCurrentJobPage() {
  try {
    // Set searching state
    updateJobDetectionState('searching', 'Checking current page...', 'Analyzing page content');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.url) {
      updateJobDetectionState('error', 'Unable to access page', 'Please refresh and try again');
      return;
    }

    // Check if we're on a supported platform
    const isNaukri = tab.url.includes('naukri.com');
    const isNaukriGulf = tab.url.includes('naukrigulf.com');
    const isLinkedIn = tab.url.includes('linkedin.com');
    const isSupportedPlatform = isNaukri || isNaukriGulf || isLinkedIn;
    
    if (!isSupportedPlatform) {
      updateJobDetectionState('not-found', 'Not on a job platform', 'Visit Naukri.com, NaukriGulf.com, or LinkedIn to score jobs');
      return;
    }

    // Check if it's actually a job page by sending message to content script
    const response = await sendMessage({
      type: 'EXTRACT_JOB_DATA',
      payload: { tabId: tab.id, url: tab.url }
    });

    if (response.success && response.data) {
      const platform = isNaukri ? 'Naukri' : isNaukriGulf ? 'NaukriGulf' : 'LinkedIn';
      const jobTitle = response.data.title || 'Job';
      updateJobDetectionState('found', `${platform} job detected!`, `Ready to score: ${jobTitle}`);
      
      if (elements['score-job-btn']) {
        (elements['score-job-btn'] as HTMLButtonElement).disabled = false;
        elements['score-job-btn'].textContent = '🚀 Score This Job';
      }
    } else {
      const platform = isNaukri ? 'Naukri' : isNaukriGulf ? 'NaukriGulf' : 'LinkedIn';
      updateJobDetectionState('not-found', `Browse ${platform} job listings`, 'Open a specific job posting to get started');
    }
    
  } catch (error) {
    console.error('Failed to check current job page:', error);
    updateJobDetectionState('error', 'Detection failed', 'Please refresh and try again');
  }
}

function updateJobDetectionState(state: 'searching' | 'found' | 'not-found' | 'error', title: string, subtitle: string) {
  const section = document.querySelector('.job-detection-section');
  const icon = elements['job-detection-icon'];
  const titleEl = elements['job-detection-title'];
  const subtitleEl = elements['job-detection-subtitle'];
  const statusIndicator = elements['status-indicator'];
  const scoreBtn = elements['score-job-btn'] as HTMLButtonElement;

  // Remove all state classes
  section?.classList.remove('searching', 'found', 'not-found', 'error');
  
  // Add current state class
  section?.classList.add(state);

  // Update content based on state
  const stateConfig = {
    searching: {
      icon: '🔍',
      statusIndicator: '⏳',
      btnDisabled: true,
      btnText: '📈 Analyzing...'
    },
    found: {
      icon: '✅',
      statusIndicator: '🎯',
      btnDisabled: false,
      btnText: '🚀 Score This Job'
    },
    'not-found': {
      icon: '🔍',
      statusIndicator: '📍',
      btnDisabled: true,
      btnText: '📈 Visit a job page to score'
    },
    error: {
      icon: '⚠️',
      statusIndicator: '❌',
      btnDisabled: true,
      btnText: '📈 Unable to detect job'
    }
  };

  const config = stateConfig[state];
  
  if (icon) icon.textContent = config.icon;
  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;
  if (statusIndicator) statusIndicator.textContent = config.statusIndicator;
  
  if (scoreBtn) {
    scoreBtn.disabled = config.btnDisabled;
    scoreBtn.textContent = config.btnText;
  }
}

function showView(view: PopupState['currentView']) {
  // Hide all views
  const views = ['login-state', 'dashboard-state', 'scoring-state', 'results-state', 'error-state'];
  views.forEach(viewId => {
    const element = elements[viewId];
    if (element) {
      element.style.display = 'none';
    }
  });
  
  // Show selected view
  const viewElement = elements[`${view}-state`];
  if (viewElement) {
    viewElement.style.display = 'block';
  }
  
  state.currentView = view;
}

function updateJobApplicationsUI(applicationsData: any) {
  const applicationsContainer = elements['job-applications'];
  if (!applicationsContainer) return;
  
  const applications = applicationsData?.data || [];
  
  if (applications.length === 0) {
    applicationsContainer.innerHTML = `
      <div class="empty-state">
        <p>No job applications yet</p>
        <small>Apply to jobs to see them here!</small>
      </div>
    `;
    return;
  }
  
  // Show applications
  applicationsContainer.innerHTML = applications.map((app: any) => `
    <div class="job-item" data-job-id="${app.id}">
      <div class="job-item-header">
        <div class="job-info">
          <div class="job-title">${toTitleCase(app.jobTitle)} • <span class="company-name">${app.companyName}</span></div>
        </div>
        <div class="score-badge score-${getScoreClass(app.matchingScore)}">${Math.round(app.matchingScore)}%</div>
      </div>
      <div class="job-status-actions">
        <div class="job-actions">
          <button class="btn-secondary btn-small view-job" data-job-url="${app.jobUrl}">View Job</button>
          ${app.rejectionFeedbackBySystem ? 
            `<button class="btn-secondary btn-small view-feedback" data-feedback="${encodeURIComponent(app.rejectionFeedbackBySystem)}">Feedback</button>` : 
            ''
          }
        </div>
        <div class="status-badge status-${app.status.toLowerCase()}">${app.status}</div>
      </div>
    </div>
  `).join('');
  
  // Add event listeners for job items
  applicationsContainer?.querySelectorAll('.view-job').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const jobUrl = (e.target as HTMLElement).dataset.jobUrl;
      if (jobUrl) {
        chrome.tabs.create({ url: jobUrl });
      }
    });
  });
  
  applicationsContainer.querySelectorAll('.view-feedback').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const feedback = decodeURIComponent((e.target as HTMLElement).dataset.feedback || '');
      if (feedback) {
        showFeedbackModal(feedback);
      }
    });
  });
}

function getScoreClass(score: number): string {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'average';
  return 'poor';
}

function showJobDetails(jobId?: string) {
  // Implementation for showing job details
  // This will be expanded in later tasks
  console.log('Show job details for:', jobId);
}

function showFeedbackModal(feedback: string) {
  // Simple alert for now - can be enhanced with a proper modal later
  alert(`Feedback:\n\n${feedback}`);
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

async function handleScoreJob() {
  try {
    showView('scoring');
    
    // Start progress animation
    animateProgress();
    
    // Get current tab info and score job
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const response = await sendMessage({
      type: 'SCORE_JOB',
      payload: { tabId: tab?.id, url: tab?.url }
    });
    
    if (response.success) {
      // Show results
      displayJobResults(response.data);
      showView('results');
    } else {
      throw new Error(response.error || 'Job scoring failed');
    }
  } catch (error) {
    console.error('Job scoring failed:', error);
    showError('Failed to score job. Please try again.');
  }
}

async function handleApplyJob() {
  if (state.currentJob?.url) {
    chrome.tabs.create({ url: state.currentJob.url });
  }
}

function animateProgress() {
  const progressFill = elements['progress-fill'];
  if (!progressFill) return;
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
    }
    progressFill.style.width = `${progress}%`;
  }, 200);
}

function displayJobResults(jobResult: any) {
  // Update job info
  if (elements['job-title']) elements['job-title'].textContent = jobResult.jobData?.title || 'Job Title';
  if (elements['job-company']) elements['job-company'].textContent = jobResult.jobData?.company || 'Company';
  if (elements['job-location']) elements['job-location'].textContent = `📍 ${jobResult.jobData?.location || 'Location'}`;
  
  // Update score badge
  if (elements['score-badge']) {
    elements['score-badge'].textContent = `${jobResult.score}%`;
    elements['score-badge'].className = `score-badge score-${getScoreClass(jobResult.score)}`;
  }
  
  // Update overall explanation
  displayOverallExplanation(jobResult.score, jobResult.overallExplanation);
  
  // Update detailed breakdown
  displayScoreBreakdown(jobResult.breakdown, jobResult.explanation);
  
  // Update skills analysis
  displayMatchingSkills(jobResult.matchingKeywords || []);
  displayMissingSkills(jobResult.missingSkills || []);
  
  // Set up action buttons
  setupActionButtons(jobResult.jobData);
  
  state.currentJob = jobResult.jobData;
}

function displayOverallExplanation(score: number, explanation?: string) {
  const explanationElement = elements['overall-explanation-text'];
  if (!explanationElement) return;
  
  let defaultExplanation = '';
  if (score >= 75) {
    defaultExplanation = 'Excellent match! This role aligns very well with your profile and experience.';
  } else if (score >= 50) {
    defaultExplanation = 'Good match! This role has strong alignment with your background.';
  } else if (score >= 30) {
    defaultExplanation = 'Moderate match. Some skills align, but there are areas for development.';
  } else {
    defaultExplanation = 'Limited match. This role may require significant skill development.';
  }
  
  explanationElement.textContent = explanation || defaultExplanation;
}

function displayScoreBreakdown(breakdown: any, explanations: any) {
  const breakdownContainer = elements['breakdown-items'];
  if (!breakdownContainer || !breakdown) return;
  
  const breakdownItems = [
    { key: 'skillsScore', label: 'Skills Match', icon: '🛠️' },
    { key: 'experienceScore', label: 'Experience Level', icon: '📈' },
    { key: 'educationScore', label: 'Education', icon: '🎓' },
    { key: 'locationScore', label: 'Location', icon: '📍' },
    { key: 'industryScore', label: 'Industry', icon: '🏢' },
    { key: 'roleScore', label: 'Role Fit', icon: '👔' },
    { key: 'responsibilitiesScore', label: 'Responsibilities', icon: '📋' }
  ];
  
  breakdownContainer.innerHTML = breakdownItems.map(item => {
    const score = breakdown[item.key] || 0;
    const explanation = explanations?.[item.key.replace('Score', '')] || 'Analysis based on your profile and job requirements.';
    const scoreClass = getScoreClass(score);
    
    return `
      <div class="breakdown-item score-${scoreClass}">
        <div class="breakdown-item-content">
          <div class="breakdown-label">${item.icon} ${item.label}</div>
          <div class="breakdown-explanation">${explanation}</div>
        </div>
        <div class="breakdown-score">${Math.round(score)}%</div>
      </div>
    `;
  }).join('');
}

function displayMatchingSkills(skills: string[]) {
  const skillsContainer = elements['matching-skills-list'];
  if (!skillsContainer) return;
  
  if (skills.length === 0) {
    skillsContainer.innerHTML = '<div class="skills-empty">No matching skills identified</div>';
    return;
  }
  
  skillsContainer.innerHTML = skills.slice(0, 15).map(skill => 
    `<span class="skill-tag matching">${skill}</span>`
  ).join('');
}

function displayMissingSkills(skills: string[]) {
  const skillsContainer = elements['missing-skills-list'];
  if (!skillsContainer) return;
  
  if (skills.length === 0) {
    skillsContainer.innerHTML = '<div class="skills-empty">Great! No critical skills missing</div>';
    return;
  }
  
  skillsContainer.innerHTML = skills.slice(0, 10).map(skill => 
    `<span class="skill-tag missing">${skill}</span>`
  ).join('');
}

function setupActionButtons(jobData: any) {
  // Apply button
  const applyBtn = elements['apply-job-btn'];
  if (applyBtn && jobData?.url) {
    applyBtn.onclick = () => {
      chrome.tabs.create({ url: jobData.url });
    };
  }
  
  // Save button
  const saveBtn = elements['save-job-btn'];
  if (saveBtn) {
    saveBtn.onclick = () => {
      handleSaveJob(jobData);
    };
  }
}

async function handleSaveJob(jobData: any) {
  try {
    const response = await sendMessage({
      type: 'SAVE_JOB',
      payload: { jobData }
    });
    
    if (response.success) {
      // Visual feedback for successful save
      const saveBtn = elements['save-job-btn'];
      if (saveBtn) {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✅ Saved!';
        saveBtn.style.background = '#10b981';
        
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = '';
        }, 2000);
      }
    }
  } catch (error) {
    console.error('Failed to save job:', error);
  }
}

function showError(message: string) {
  if (elements['error-message']) {
    elements['error-message'].textContent = message;
  }
  showView('error');
}

async function sendMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: ExtensionResponse) => {
      resolve(response || { success: false, error: 'No response received' });
    });
  });
}

// Export for testing
export { initializePopup, showView, state };