// Content script for Naukri.com and NaukriGulf.com job pages
// Extracts job data and provides UI integration

import { JobData, ExtensionMessage, ExtensionResponse } from '@/types';

console.log('Worko Extension: Naukri/NaukriGulf content script loaded');

// Add debug functions to window for testing
(window as any).workoDebug = () => {
  console.log('=== WORKO DEBUG ===');
  console.log('URL:', window.location.href);
  console.log('Is Naukri site:', isNaukriSite());
  console.log('Is job detail page:', isJobDetailPage());
  
  // Force inject UI for testing
  console.log('Force injecting UI...');
  aggressiveUIInjection();
};

// Add test injection function
(window as any).workoTestInject = () => {
  console.log('=== WORKO TEST INJECTION ===');
  
  // Create a highly visible test element
  const testElement = document.createElement('div');
  testElement.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: red;
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 9999;
    font-family: Arial;
    font-size: 14px;
  `;
  testElement.textContent = 'WORKO SCRIPT IS WORKING!';
  document.body.appendChild(testElement);
  
  // Remove after 5 seconds
  setTimeout(() => {
    testElement.remove();
  }, 5000);
};

// ===== UTILITY FUNCTIONS =====

// Check if we're on a Naukri or NaukriGulf site
const isNaukriSite = (): boolean => {
  return window.location.hostname.includes('naukri.com') || 
         window.location.hostname.includes('naukrigulf.com');
};

// Check if we're on a job detail page
const isJobDetailPage = (): boolean => {
  if (!isNaukriSite()) return false;
  
  console.log('Checking if job detail page for URL:', window.location.href);
  
  // Check URL patterns for job detail pages (enhanced for NaukriGulf)
  const detailUrlPatterns = [
    '/job-detail',
    '/jobs/',
    '-jobs-in-', // NaukriGulf pattern like "project-engineer-jobs-in-dubai-uae"
    '-jid-', // Job ID pattern
    '/vacancy/',
    '/job/',
    'jobId=',
    'currentJobId=',
    '-n-cd-', // NaukriGulf pattern
    '-years-n-cd-', // NaukriGulf experience pattern
    'project-engineer-jobs' // Specific pattern from the URL
  ];
  
  const hasDetailUrl = detailUrlPatterns.some(pattern => {
    const matches = window.location.href.includes(pattern);
    if (matches) console.log(`URL matches pattern: ${pattern}`);
    return matches;
  });
  
  // Check for job detail elements (enhanced for NaukriGulf)
  const detailPageSelectors = [
    '.jd-header',
    '.job-header',
    '.vacancy-header',
    '.job-details-header',
    '.job-title-container',
    '.job-info-container',
    // NaukriGulf specific selectors
    'h1', // Job title is usually in h1
    '.job-title',
    '.position-title'
  ];
  
  const hasDetailElements = detailPageSelectors.some(selector => {
    const element = document.querySelector(selector);
    if (element) console.log(`Found detail element with selector: ${selector}`);
    return element !== null;
  });
  
  // Additional check: if there's only one "Easy Apply" button, it's likely a detail page
  const easyApplyText = document.body.textContent?.toLowerCase().match(/easy apply/g);
  const hasOnlyOneEasyApply = Boolean(easyApplyText && easyApplyText.length === 1);
  
  // NaukriGulf specific check: look for job description section
  const hasJobDescription = document.querySelector('.job-description, .job-desc, [class*="description"]') !== null;
  
  const isDetailPage = hasDetailUrl || hasDetailElements || hasOnlyOneEasyApply || hasJobDescription;
  
  console.log('Job detail page detection results:');
  console.log('- hasDetailUrl:', hasDetailUrl);
  console.log('- hasDetailElements:', hasDetailElements);
  console.log('- hasOnlyOneEasyApply:', hasOnlyOneEasyApply);
  console.log('- hasJobDescription:', hasJobDescription);
  console.log('- Final result:', isDetailPage);
  
  return isDetailPage;
};

// ===== JOB DATA EXTRACTION =====

// Extract job data from Naukri/NaukriGulf job detail pages
const extractJobData = (): JobData | null => {
  try {
    console.log('Extracting job data from page...');
    
    // Determine platform
    const platform = window.location.hostname.includes('naukrigulf') ? 'naukrigulf' : 'naukri';
    
    // Try multiple selectors for job title (enhanced for NaukriGulf)
    const titleSelectors = [
      '.jd-header-title', // Naukri
      '.job-title', // Generic
      '.vacancy-title', // NaukriGulf
      'h1[data-testid="job-title"]',
      'h1.job-header-title',
      'h1', // NaukriGulf uses h1 for job titles
      '.main-title',
      '.position-title'
    ];
    
    // Try multiple selectors for company name (enhanced for NaukriGulf)
    const companySelectors = [
      '.jd-header-comp-name', // Naukri
      '.company-name', // Generic
      '.employer-name', // NaukriGulf
      '[data-testid="company-name"]',
      '.job-header-company',
      '.company-title',
      'h2', // Sometimes company name is in h2
      '.employer'
    ];
    
    // Try multiple selectors for job description
    const descriptionSelectors = [
      '.dang-inner-html', // Naukri
      '.job-description', // Generic
      '.vacancy-description', // NaukriGulf
      '.job-details-content',
      '.job-content',
      '.description-content',
      '.job-desc',
      '[class*="description"]'
    ];
    
    // Try multiple selectors for location
    const locationSelectors = [
      '.jd-loc', // Naukri
      '.job-location', // Generic
      '.vacancy-location', // NaukriGulf
      '[data-testid="job-location"]',
      '.location-info',
      '.job-header-location',
      '[class*="location"]'
    ];
    
    let titleElement: HTMLElement | null = null;
    let companyElement: HTMLElement | null = null;
    let descriptionElement: HTMLElement | null = null;
    let locationElement: HTMLElement | null = null;
    
    // Find title element
    for (const selector of titleSelectors) {
      titleElement = document.querySelector(selector) as HTMLElement;
      if (titleElement && titleElement.textContent?.trim()) {
        console.log(`Found title with selector: ${selector}`, titleElement.textContent.trim());
        break;
      }
    }
    
    // Find company element
    for (const selector of companySelectors) {
      companyElement = document.querySelector(selector) as HTMLElement;
      if (companyElement && companyElement.textContent?.trim()) {
        console.log(`Found company with selector: ${selector}`, companyElement.textContent.trim());
        break;
      }
    }
    
    // Find description element
    for (const selector of descriptionSelectors) {
      descriptionElement = document.querySelector(selector) as HTMLElement;
      if (descriptionElement && descriptionElement.textContent?.trim()) {
        console.log(`Found description with selector: ${selector}`);
        break;
      }
    }
    
    // Find location element
    for (const selector of locationSelectors) {
      locationElement = document.querySelector(selector) as HTMLElement;
      if (locationElement && locationElement.textContent?.trim()) {
        console.log(`Found location with selector: ${selector}`, locationElement.textContent.trim());
        break;
      }
    }
    
    if (!titleElement || !companyElement) {
      console.log('Required job elements not found');
      console.log('Title element:', titleElement);
      console.log('Company element:', companyElement);
      return null;
    }
    
    const jobData: JobData = {
      title: titleElement.textContent?.trim() || '',
      company: companyElement.textContent?.trim() || '',
      description: descriptionElement?.textContent?.trim() || '',
      requirements: descriptionElement?.textContent?.trim() || '', // Use description as requirements for now
      location: locationElement?.textContent?.trim() || '',
      url: window.location.href,
      platform: platform,
      extractedAt: Date.now(),
      salary: '',
      experience: '',
      jobType: ''
    };
    
    console.log('Extracted job data:', jobData);
    return jobData;
    
  } catch (error) {
    console.error('Failed to extract job data:', error);
    return null;
  }
};

// Send message to background script
const sendMessage = (message: ExtensionMessage): Promise<ExtensionResponse> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: ExtensionResponse) => {
      resolve(response || { success: false, error: 'No response received' });
    });
  });
};

// ===== AGGRESSIVE UI INJECTION =====

// Aggressive UI injection that works on any page
const aggressiveUIInjection = () => {
  console.log('=== AGGRESSIVE UI INJECTION ===');
  
  // Check if already injected
  if (document.querySelector('.worko-aggressive-ui')) {
    console.log('Aggressive UI already injected');
    return;
  }
  
  // Create a floating Worko UI
  const workoUI = document.createElement('div');
  workoUI.className = 'worko-aggressive-ui';
  workoUI.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: linear-gradient(135deg, #170155 0%, #316bff 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 1000;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: all 0.2s ease;
  `;
  workoUI.innerHTML = '🚀 Worko Match - Score Job';
  
  // Add hover effect
  workoUI.addEventListener('mouseenter', () => {
    workoUI.style.transform = 'translateY(-2px)';
    workoUI.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
  });
  
  workoUI.addEventListener('mouseleave', () => {
    workoUI.style.transform = 'translateY(0)';
    workoUI.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  });
  
  // Add click handler
  workoUI.addEventListener('click', async () => {
    workoUI.innerHTML = '⏳ Scoring...';
    workoUI.style.pointerEvents = 'none';
    
    try {
      const jobData = extractJobData();
      if (!jobData) {
        throw new Error('Could not extract job data from this page');
      }
      
      console.log('Sending job data for scoring:', jobData);
      
      const response = await sendMessage({
        type: 'SCORE_JOB',
        payload: jobData
      });
      
      if (response.success) {
        const score = response.data.matchingScore || response.data.score || 0;
        workoUI.innerHTML = `✅ ${score}% Match`;
        workoUI.style.background = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
        
        // Reset after 5 seconds
        setTimeout(() => {
          workoUI.innerHTML = '🚀 Worko Match - Score Job';
          workoUI.style.background = 'linear-gradient(135deg, #170155 0%, #316bff 100%)';
          workoUI.style.pointerEvents = 'auto';
        }, 5000);
      } else {
        throw new Error(response.error || 'Scoring failed');
      }
    } catch (error) {
      console.error('Scoring failed:', error);
      workoUI.innerHTML = '❌ Scoring Failed';
      workoUI.style.background = '#ef4444';
      
      // Reset after 3 seconds
      setTimeout(() => {
        workoUI.innerHTML = '🚀 Worko Match - Score Job';
        workoUI.style.background = 'linear-gradient(135deg, #170155 0%, #316bff 100%)';
        workoUI.style.pointerEvents = 'auto';
      }, 3000);
    }
  });
  
  document.body.appendChild(workoUI);
  console.log('Aggressive UI injected successfully');
};

// ===== INITIALIZATION =====

console.log('=== WORKO EXTENSION DEBUG INFO ===');
console.log('URL:', window.location.href);
console.log('Hostname:', window.location.hostname);
console.log('Is Naukri site:', isNaukriSite());

// Initialize the extension
const initializeWorko = () => {
  console.log('Initializing Worko extension...');
  
  // Check if we're on a Naukri/NaukriGulf site
  if (!isNaukriSite()) {
    console.log('Not on a Naukri/NaukriGulf site, skipping initialization');
    return;
  }
  
  // Only inject UI on job detail pages to avoid interfering with login
  if (isJobDetailPage()) {
    console.log('On job detail page, injecting UI...');
    aggressiveUIInjection();
  } else {
    console.log('Not on job detail page, skipping UI injection');
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWorko);
} else {
  initializeWorko();
}

// Try again after delays for dynamic content
setTimeout(initializeWorko, 1000);
setTimeout(initializeWorko, 3000);

// Export for testing
export { extractJobData, isJobDetailPage, aggressiveUIInjection };