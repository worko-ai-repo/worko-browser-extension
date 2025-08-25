// Content script for LinkedIn job pages
// Extracts job data and provides UI integration for LinkedIn's dynamic SPA

import { JobData, ExtensionMessage, ExtensionResponse } from '@/types';
import { PLATFORM_CONFIG } from '@shared/config';

console.log('Worko Extension: LinkedIn content script loaded');

// Check if we're on a LinkedIn job page
const isJobPage = (): boolean => {
  return window.location.href.includes('/jobs/view/') || 
         window.location.href.includes('/jobs/collections/') ||
         document.querySelector('.job-details-jobs-unified-top-card__job-title') !== null;
};

// Extract job data from LinkedIn's dynamic content
const extractJobData = (): JobData | null => {
  try {
    const selectors = PLATFORM_CONFIG.linkedin.selectors;
    
    // LinkedIn uses dynamic loading, so we need to wait for content
    const titleElement = document.querySelector(selectors.jobTitle) as HTMLElement;
    const companyElement = document.querySelector(selectors.company) as HTMLElement;
    
    if (!titleElement || !companyElement) {
      console.log('Required LinkedIn job elements not found, retrying...');
      return null;
    }
    
    // Extract job description from multiple possible locations
    const descriptionElement = document.querySelector(selectors.description) || 
                              document.querySelector('.job-details-jobs-unified-top-card__job-description-snippet') ||
                              document.querySelector('.jobs-description__content') ||
                              document.querySelector('.jobs-box__html-content');
    
    const locationElement = document.querySelector(selectors.location) ||
                           document.querySelector('.job-details-jobs-unified-top-card__primary-description-container');
    
    const jobData: JobData = {
      title: titleElement.textContent?.trim() || '',
      company: companyElement.textContent?.trim() || '',
      description: descriptionElement?.textContent?.trim() || '',
      requirements: extractRequirements(),
      location: extractLocation(locationElement),
      url: window.location.href,
      platform: 'linkedin',
      extractedAt: Date.now(),
      salary: extractSalary(),
      experience: extractExperience(),
      jobType: extractJobType()
    };
    
    console.log('Extracted LinkedIn job data:', jobData);
    return jobData;
    
  } catch (error) {
    console.error('Failed to extract LinkedIn job data:', error);
    return null;
  }
};

// Extract job requirements from LinkedIn's structure
const extractRequirements = (): string => {
  const requirementSelectors = [
    '.jobs-description__content',
    '.jobs-box__html-content',
    '.job-details-jobs-unified-top-card__job-description',
    '.jobs-description-content__text'
  ];
  
  let requirements = '';
  
  requirementSelectors.forEach(selector => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      requirements += element.textContent?.trim() + ' ';
    }
  });
  
  return requirements.trim();
};

// Extract location from LinkedIn's complex structure
const extractLocation = (locationElement: Element | null): string => {
  if (!locationElement) return '';
  
  // LinkedIn often has location in various formats
  const locationText = locationElement.textContent?.trim() || '';
  
  // Extract just the location part (remove other details)
  const locationMatch = locationText.match(/([^•]+)/);
  return locationMatch?.[1]?.trim() || locationText;
};

// Extract salary information from LinkedIn
const extractSalary = (): string => {
  const salarySelectors = [
    '.job-details-jobs-unified-top-card__job-insight--highlight',
    '.jobs-unified-top-card__job-insight--highlight',
    '.job-details-preferences-and-skills__pill'
  ];
  
  for (const selector of salarySelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of Array.from(elements)) {
      const text = element.textContent?.trim() || '';
      if (text.includes('$') || text.includes('₹') || text.includes('salary') || text.includes('pay')) {
        return text;
      }
    }
  }
  
  return '';
};

// Extract experience requirements from LinkedIn
const extractExperience = (): string => {
  const expSelectors = [
    '.job-details-jobs-unified-top-card__job-insight',
    '.jobs-unified-top-card__job-insight'
  ];
  
  for (const selector of expSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of Array.from(elements)) {
      const text = element.textContent?.trim() || '';
      if (text.includes('year') || text.includes('experience') || text.includes('level')) {
        return text;
      }
    }
  }
  
  return '';
};

// Extract job type from LinkedIn
const extractJobType = (): string => {
  const typeSelectors = [
    '.job-details-jobs-unified-top-card__job-insight',
    '.jobs-unified-top-card__job-insight'
  ];
  
  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Remote'];
  
  for (const selector of typeSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of Array.from(elements)) {
      const text = element.textContent?.trim() || '';
      for (const type of jobTypes) {
        if (text.includes(type)) {
          return type;
        }
      }
    }
  }
  
  return '';
};

// Inject Worko UI into LinkedIn's interface
const injectWorkoUI = (): void => {
  // Check if already injected
  if (document.querySelector('.worko-job-matcher-linkedin')) {
    return;
  }
  
  // Find LinkedIn's job details container
  const targetElement = document.querySelector('.job-details-jobs-unified-top-card__container--two-pane') ||
                       document.querySelector('.job-details-jobs-unified-top-card') ||
                       document.querySelector('.jobs-unified-top-card') ||
                       document.querySelector('.job-view-layout');
  
  if (!targetElement) {
    console.log('No suitable LinkedIn element found for UI injection');
    return;
  }
  
  // Create Worko UI container with LinkedIn-specific styling
  const workoContainer = document.createElement('div');
  workoContainer.className = 'worko-job-matcher-linkedin';
  workoContainer.innerHTML = `
    <div class="worko-linkedin-banner">
      <div class="worko-linkedin-content">
        <div class="worko-linkedin-logo">
          <span class="worko-icon">🚀</span>
          <span class="worko-text">Worko Match</span>
        </div>
        <div class="worko-linkedin-actions">
          <span id="worko-linkedin-score" class="worko-score-display" style="display: none;">
            <span id="worko-score-value">--</span>% Match
          </span>
          <button id="worko-linkedin-score-btn" class="worko-linkedin-btn-primary">
            Score Job
          </button>
          <button id="worko-linkedin-details" class="worko-linkedin-btn-secondary" style="display: none;">
            View Details
          </button>
          <button id="worko-linkedin-apply" class="worko-linkedin-btn-apply" style="display: none;">
            Apply
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Insert at the top of the job details
  targetElement.insertBefore(workoContainer, targetElement.firstChild);
  
  // Add event listeners
  setupLinkedInEventListeners();
  
  console.log('Worko UI injected into LinkedIn successfully');
};

// Set up event listeners for LinkedIn UI
const setupLinkedInEventListeners = (): void => {
  const scoreBtn = document.getElementById('worko-linkedin-score-btn');
  const detailsBtn = document.getElementById('worko-linkedin-details');
  const applyBtn = document.getElementById('worko-linkedin-apply');
  
  scoreBtn?.addEventListener('click', handleLinkedInScoreJob);
  detailsBtn?.addEventListener('click', handleLinkedInViewDetails);
  applyBtn?.addEventListener('click', handleLinkedInApplyJob);
};

// Handle score job for LinkedIn
const handleLinkedInScoreJob = async (): Promise<void> => {
  const scoreBtn = document.getElementById('worko-linkedin-score-btn');
  const scoreDisplay = document.getElementById('worko-linkedin-score');
  const detailsBtn = document.getElementById('worko-linkedin-details');
  const applyBtn = document.getElementById('worko-linkedin-apply');
  
  if (!scoreBtn) return;
  
  try {
    // Show loading state
    scoreBtn.textContent = 'Scoring...';
    scoreBtn.setAttribute('disabled', 'true');
    
    // Wait a bit for LinkedIn's dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Extract job data
    const jobData = extractJobData();
    if (!jobData) {
      throw new Error('Could not extract job data from LinkedIn');
    }
    
    // Send message to background script for scoring
    const response = await sendMessage({
      type: 'SCORE_JOB',
      payload: jobData
    });
    
    if (response.success) {
      // Display results
      displayLinkedInScore(response.data.score);
      scoreDisplay?.style.setProperty('display', 'inline-block');
      detailsBtn?.style.setProperty('display', 'inline-block');
      applyBtn?.style.setProperty('display', 'inline-block');
      scoreBtn.style.display = 'none';
    } else {
      throw new Error(response.error || 'Scoring failed');
    }
    
  } catch (error) {
    console.error('LinkedIn job scoring failed:', error);
    scoreBtn.textContent = 'Scoring Failed';
    setTimeout(() => {
      scoreBtn.textContent = 'Score Job';
      scoreBtn.removeAttribute('disabled');
    }, 3000);
  }
};

// Display score in LinkedIn UI
const displayLinkedInScore = (score: number): void => {
  const scoreElement = document.getElementById('worko-score-value');
  if (!scoreElement) return;
  
  scoreElement.textContent = score.toString();
  
  // Add color coding
  const scoreDisplay = document.getElementById('worko-linkedin-score');
  if (scoreDisplay) {
    let colorClass = '';
    if (score >= 75) colorClass = 'worko-score-green';
    else if (score >= 50) colorClass = 'worko-score-yellow';
    else if (score >= 30) colorClass = 'worko-score-amber';
    else colorClass = 'worko-score-red';
    
    scoreDisplay.className = `worko-score-display ${colorClass}`;
  }
};

// Handle view details for LinkedIn
const handleLinkedInViewDetails = (): void => {
  chrome.runtime.sendMessage({
    type: 'SHOW_JOB_DETAILS',
    payload: { url: window.location.href }
  });
};

// Handle apply job for LinkedIn
const handleLinkedInApplyJob = (): void => {
  // Find LinkedIn's apply button
  const applySelectors = [
    '.jobs-apply-button',
    '.jobs-s-apply',
    '.job-details-jobs-unified-top-card__primary-description-container button',
    'button[aria-label*="Apply"]',
    'button[data-control-name="jobdetails_topcard_inapply"]'
  ];
  
  for (const selector of applySelectors) {
    const applyButton = document.querySelector(selector) as HTMLElement;
    if (applyButton && applyButton.textContent?.toLowerCase().includes('apply')) {
      applyButton.click();
      return;
    }
  }
  
  // If no apply button found, scroll to the top where apply buttons usually are
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Send message to background script
const sendMessage = (message: ExtensionMessage): Promise<ExtensionResponse> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: ExtensionResponse) => {
      resolve(response || { success: false, error: 'No response received' });
    });
  });
};

// Handle LinkedIn's SPA navigation
const handleSPANavigation = (): void => {
  let currentUrl = window.location.href;
  
  // Watch for URL changes (LinkedIn SPA navigation)
  const observer = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      console.log('LinkedIn navigation detected:', currentUrl);
      
      // Remove existing Worko UI
      const existingUI = document.querySelector('.worko-job-matcher-linkedin');
      if (existingUI) {
        existingUI.remove();
      }
      
      // Check if new page is a job page and inject UI
      if (isJobPage()) {
        setTimeout(injectWorkoUI, 2000); // Wait for LinkedIn to load content
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

// Initialize LinkedIn content script
const initializeLinkedIn = (): void => {
  console.log('Initializing LinkedIn content script');
  
  // Handle SPA navigation
  handleSPANavigation();
  
  if (isJobPage()) {
    console.log('LinkedIn job page detected');
    
    // Wait for LinkedIn's dynamic content to load
    const waitForContent = () => {
      const titleElement = document.querySelector('.job-details-jobs-unified-top-card__job-title');
      if (titleElement) {
        setTimeout(injectWorkoUI, 1000);
      } else {
        setTimeout(waitForContent, 1000);
      }
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', waitForContent);
    } else {
      waitForContent();
    }
  }
};

// Start initialization
initializeLinkedIn();

// Export for testing
export { extractJobData, isJobPage, injectWorkoUI };