// Content script for Naukri.com and NaukriGulf.com job pages
// Extracts job data and provides UI integration

import { JobData, ExtensionMessage, ExtensionResponse } from '@/types';
import { PLATFORM_CONFIG } from '@shared/config';

console.log('Worko Extension: Naukri/NaukriGulf content script loaded');

// Immediately add test functions to window for debugging
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

// Add debug function immediately
(window as any).workoDebugInject = () => {
  console.log('=== WORKO DEBUG INJECTION ===');
  console.log('URL:', window.location.href);
  console.log('Page title:', document.title);
  console.log('Script loaded successfully!');
  
  // Show all elements with "Easy Apply"
  const allElements = document.querySelectorAll('*');
  let easyApplyCount = 0;
  
  allElements.forEach(element => {
    const text = element.textContent?.toLowerCase() || '';
    if (text.includes('easy apply')) {
      easyApplyCount++;
      console.log('Found Easy Apply element:', element);
    }
  });
  
  console.log(`Found ${easyApplyCount} elements containing "Easy Apply"`);
};

// Add force inject function immediately
(window as any).workoForceInject = () => {
  console.log('=== WORKO FORCE INJECTION ===');
  
  // Find all elements that contain "Easy Apply"
  const allElements = document.querySelectorAll('*');
  let injectedCount = 0;
  
  allElements.forEach((element, index) => {
    const text = element.textContent?.toLowerCase() || '';
    
    if (text.includes('easy apply') && !element.querySelector('.worko-job-card-ui')) {
      // Create a simple UI element
      const workoUI = document.createElement('div');
      workoUI.className = 'worko-job-card-ui';
      workoUI.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: linear-gradient(135deg, #170155 0%, #316bff 100%);
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 1000;
        cursor: pointer;
      `;
      workoUI.textContent = '🎯 Score Job';
      
      // Make parent relatively positioned if needed
      const computedStyle = window.getComputedStyle(element as Element);
      if (computedStyle.position === 'static') {
        (element as HTMLElement).style.position = 'relative';
      }
      
      element.appendChild(workoUI);
      injectedCount++;
      
      console.log(`Injected UI into element ${index}:`, element.className);
    }
  });
  
  console.log(`Force injection complete. Injected ${injectedCount} UI elements.`);
};

// Add a simple test injection function
(window as any).workoSimpleTest = () => {
  console.log('=== WORKO SIMPLE TEST ===');
  
  // Create a very visible test button
  const testButton = document.createElement('button');
  testButton.style.cssText = `
    position: fixed;
    top: 50px;
    right: 50px;
    background: #ff0000;
    color: white;
    padding: 15px 20px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    z-index: 10000;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  testButton.textContent = '🎯 WORKO TEST BUTTON';
  
  testButton.onclick = () => {
    alert('Worko extension is working!');
    testButton.remove();
  };
  
  document.body.appendChild(testButton);
  console.log('Test button added to page');
};

console.log('Worko debug functions added to window object');

// Global flag to prevent multiple injections
let injectionInProgress = false;



// Add a small indicator that the script is loaded
setTimeout(() => {
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: #170155;
    color: white;
    padding: 5px 8px;
    border-radius: 3px;
    font-size: 10px;
    z-index: 9999;
    font-family: Arial;
  `;
  indicator.textContent = 'Worko Loaded';
  document.body.appendChild(indicator);
  
  // Remove after 3 seconds
  setTimeout(() => {
    indicator.remove();
  }, 3000);
}, 1000);

// Check if we're on a Naukri/NaukriGulf site
const isNaukriSite = (): boolean => {
  return window.location.hostname.includes('naukri.com') || 
         window.location.hostname.includes('naukrigulf.com');
};

// Check if we're on an individual job detail page
const isJobDetailPage = (): boolean => {
  if (!isNaukriSite()) return false;
  
  // Check URL patterns for individual job pages
  const detailUrlPatterns = [
    '/job-detail/',
    '/jobdetail/',
    '/jobs/view/',
    '/vacancy/view/',
    '/crewing-officer-jobs-in-', // NaukriGulf specific pattern
    '/jobs-in-'
  ];
  
  const hasDetailUrl = detailUrlPatterns.some(pattern => window.location.href.includes(pattern));
  
  // Check for individual job page elements (single job page indicators)
  const detailPageSelectors = [
    '.jd-header-title',
    '.styles_jd-header-title__rZwM1',
    '.dang-inner-html',
    '.job-header-title',
    '.vacancy-title'
  ];
  
  const hasDetailElements = detailPageSelectors.some(selector => document.querySelector(selector) !== null);
  
  // Additional check: if there's only one "Easy Apply" button, it's likely a detail page
  const easyApplyButtons = document.querySelectorAll('button, a, .btn').length;
  const easyApplyText = document.body.textContent?.toLowerCase().match(/easy apply/g);
  const hasOnlyOneEasyApply = Boolean(easyApplyText && easyApplyText.length === 1);
  
  return hasDetailUrl || hasDetailElements || hasOnlyOneEasyApply;
};

// Check if we're on a job listing/search page
const isJobListingPage = (): boolean => {
  if (!isNaukriSite()) return false;
  
  // Check URL patterns for job listing pages
  const listingUrlPatterns = [
    '/jobs',
    '/job-listings',
    '/search',
    '-jobs', // for URLs like /architect-jobs
    '/browse-jobs'
  ];
  
  const hasListingUrl = listingUrlPatterns.some(pattern => window.location.href.includes(pattern));
  
  // Check for job listing elements (enhanced for NaukriGulf)
  const listingPageSelectors = [
    '.jobTuple',
    '.job-card',
    '.job-item',
    '.srp-jobtuple-wrapper',
    '.job-listing-item',
    '.vacancy-card',
    '[data-job-id]',
    '.job-result',
    '.search-result',
    '.vacancy-item',
    '.job-posting',
    'article[data-testid="job-card"]',
    '.job-container'
  ];
  
  const hasListingElements = listingPageSelectors.some(selector => document.querySelector(selector) !== null);
  
  return hasListingUrl || hasListingElements;
};

// Check if we're on any job-related page
const isJobPage = (): boolean => {
  return isJobDetailPage() || isJobListingPage();
};

// Enhanced debugging and auto-injection
console.log('=== WORKO EXTENSION DEBUG INFO ===');
console.log('URL:', window.location.href);
console.log('Hostname:', window.location.hostname);
console.log('Is Naukri site:', isNaukriSite());

// Fast and targeted initialization for job listings
const initializeWorko = () => {
  console.log('Initializing Worko extension...');
  
  // Check page type
  const isListing = isJobListingPage();
  
  console.log('Page type detection:');
  console.log('- Is job listing page:', isListing);
  
  if (isListing) {
    console.log('Detected job listing page, injecting listing UI...');
    // Inject immediately for faster response
    setTimeout(() => {
      injectJobListingUI();
    }, 500);
    
    // Also try after a short delay for dynamic content
    setTimeout(() => {
      injectJobListingUI();
    }, 1500);
  } else {
    console.log('Not a job listing page, skipping injection');
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWorko);
} else {
  initializeWorko();
}

// Quick retry for dynamic content
setTimeout(initializeWorko, 2000);

// Set up mutation observer for dynamic content
const setupMutationObserver = () => {
  if (!isJobListingPage()) return;
  
  const observer = new MutationObserver((mutations) => {
    let shouldInject = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if new job cards were added
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.querySelector('.jobTuple, .job-card, .vacancy-card') || 
                element.classList.contains('jobTuple') ||
                element.classList.contains('job-card') ||
                element.classList.contains('vacancy-card')) {
              shouldInject = true;
            }
          }
        });
      }
    });
    
    if (shouldInject) {
      console.log('New job cards detected, injecting UI...');
      setTimeout(() => {
        injectJobListingUI();
      }, 300);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('Mutation observer set up for dynamic content');
};

// Set up mutation observer after initial load
setTimeout(setupMutationObserver, 1000);

// Aggressive fallback injection - inject UI anywhere we find "Easy Apply"
const aggressiveFallbackInjection = () => {
  console.log('=== AGGRESSIVE FALLBACK INJECTION ===');
  
  // Find all elements containing "Easy Apply" text
  const allElements = document.querySelectorAll('*');
  let injectedCount = 0;
  
  allElements.forEach((element, index) => {
    const text = element.textContent?.toLowerCase() || '';
    
    if (text.includes('easy apply') && 
        !element.querySelector('.worko-job-card-ui') && 
        !element.querySelector('.worko-job-detail-ui') &&
        element.children.length > 0) {
      
      console.log(`Found Easy Apply element ${index}:`, element.className, element.tagName);
      
      // Create a simple Worko UI
      const workoUI = document.createElement('div');
      workoUI.className = 'worko-fallback-ui';
      workoUI.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: linear-gradient(135deg, #170155 0%, #316bff 100%);
        color: white;
        padding: 6px 10px;
        border-radius: 5px;
        font-size: 11px;
        font-weight: 500;
        z-index: 1000;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      `;
      workoUI.innerHTML = '🎯 Worko Score';
      
      // Make parent relatively positioned if needed
      const computedStyle = window.getComputedStyle(element as Element);
      if (computedStyle.position === 'static') {
        (element as HTMLElement).style.position = 'relative';
      }
      
      // Add click handler
      workoUI.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        workoUI.textContent = '✅ Clicked!';
        workoUI.style.background = '#10b981';
        console.log('Worko UI clicked on element:', element);
      });
      
      element.appendChild(workoUI);
      injectedCount++;
      
      console.log(`Injected fallback UI into element ${index}`);
    }
  });
  
  console.log(`Aggressive fallback injection complete. Injected ${injectedCount} UI elements.`);
  
  // Show a notification about the injection
  if (injectedCount > 0) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 10px 15px;
      border-radius: 8px;
      font-size: 12px;
      z-index: 10000;
      font-family: Arial;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.textContent = `🎯 Worko: Injected ${injectedCount} job scoring buttons`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
};

// Disabled aggressive fallback - too many injections
// setTimeout(aggressiveFallbackInjection, 8000);

// Sidebar functionality will be included inline
// (Import statements don't work in content scripts, so we'll include the sidebar code directly)

// Initialize Worko sidebar after page loads
setTimeout(() => {
  initializeWorkoSidebar();
}, 2000);

// Extract job data from the current page
const extractJobData = (): JobData | null => {
  try {
    console.log('Starting job data extraction from Naukri/NaukriGulf page...');
    
    // Enhanced selectors for current Naukri page structure
    const titleSelectors = [
      '.jd-header-title',
      '.job-title',
      '.jobTupleHeader .jobTuple-title',
      'h1[data-automation="job-title"]',
      '.styles_jd-header-title__rZwM1'
    ];
    
    const companySelectors = [
      '.jd-header-comp-name',
      '.comp-name',
      '.jobTupleHeader .jobTuple-comp-name',
      '[data-automation="job-company-name"]',
      '.styles_jd-header-comp-name__MvqAI'
    ];
    
    const locationSelectors = [
      '.jd-loc',
      '.location',
      '.jobTupleHeader .jobTuple-location',
      '[data-automation="job-location"]',
      '.styles_jhc__location__qJ0bK'
    ];
    
    const descriptionSelectors = [
      '.dang-inner-html',
      '.job-desc',
      '.jd-desc',
      '.job-description-container',
      '.styles_JDC__dang-inner-html__h0K4t'
    ];
    
    // Extract job title
    const titleElement = findElementBySelectors(titleSelectors);
    const title = titleElement?.textContent?.trim() || '';
    
    // Extract company name
    const companyElement = findElementBySelectors(companySelectors);
    const company = companyElement?.textContent?.trim() || '';
    
    // Extract location
    const locationElement = findElementBySelectors(locationSelectors);
    const location = locationElement?.textContent?.trim() || '';
    
    // Extract description
    const descriptionElement = findElementBySelectors(descriptionSelectors);
    const description = descriptionElement?.textContent?.trim() || '';
    
    if (!title || !company) {
      console.log('Required job elements not found. Title:', !!title, 'Company:', !!company);
      return null;
    }
    
    const jobData: JobData = {
      title,
      company,
      description,
      requirements: extractRequirements(),
      location,
      url: window.location.href,
      platform: window.location.hostname.includes('naukrigulf.com') ? 'naukrigulf' : 'naukri',
      extractedAt: Date.now(),
      salary: extractSalary(),
      experience: extractExperience(),
      jobType: extractJobType()
    };
    
    console.log('Successfully extracted job data:', {
      title: jobData.title,
      company: jobData.company,
      location: jobData.location,
      hasDescription: !!jobData.description,
      hasRequirements: !!jobData.requirements
    });
    
    return jobData;
    
  } catch (error) {
    console.error('Failed to extract job data:', error);
    return null;
  }
};

// Helper function to find element by multiple selectors
const findElementBySelectors = (selectors: string[]): HTMLElement | null => {
  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && element.textContent?.trim()) {
      return element;
    }
  }
  return null;
};

// Extract job requirements from various sections
const extractRequirements = (): string => {
  const requirementSelectors = [
    '.dang-inner-html',
    '.job-desc',
    '.jd-desc',
    '.job-description',
    '.key-skill',
    '.other-details',
    '.styles_JDC__dang-inner-html__h0K4t',
    '.job-description-container'
  ];
  
  let requirements = '';
  
  requirementSelectors.forEach(selector => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && element.textContent?.trim()) {
      requirements += element.textContent.trim() + ' ';
    }
  });
  
  return requirements.trim();
};

// Extract salary information
const extractSalary = (): string => {
  const salarySelectors = [
    '.salary',
    '.jd-salary',
    '.sal',
    '.package',
    '.styles_jhc__salary__jdfEC',
    '.jobTuple-salary',
    '[data-automation="job-salary"]'
  ];
  
  const salaryElement = findElementBySelectors(salarySelectors);
  return salaryElement?.textContent?.trim() || '';
};

// Extract experience requirements
const extractExperience = (): string => {
  const expSelectors = [
    '.exp',
    '.experience',
    '.jd-exp',
    '.exp-range',
    '.styles_jhc__exp__k_giM',
    '.jobTuple-exp',
    '[data-automation="job-experience"]'
  ];
  
  const expElement = findElementBySelectors(expSelectors);
  return expElement?.textContent?.trim() || '';
};

// Extract job type (full-time, part-time, etc.)
const extractJobType = (): string => {
  const typeSelectors = [
    '.job-type',
    '.employment-type',
    '.jd-type',
    '.jobTuple-type',
    '[data-automation="job-type"]'
  ];
  
  const typeElement = findElementBySelectors(typeSelectors);
  return typeElement?.textContent?.trim() || '';
};

// Inject UI for job detail pages (single job)
const injectJobDetailUI = (): void => {
  if (injectionInProgress) {
    console.log('Injection already in progress, skipping...');
    return;
  }
  
  injectionInProgress = true;
  console.log('Injecting Worko UI for job detail page...');
  
  // Remove existing UI if present
  const existingUI = document.querySelector('.worko-job-detail-ui');
  if (existingUI) {
    existingUI.remove();
  }
  
  // Find the Easy Apply button
  let easyApplyButton: Element | null = null;
  
  // Try to find Easy Apply button using different methods
  const allButtons = document.querySelectorAll('button, a, .btn');
  allButtons.forEach(button => {
    const text = button.textContent?.toLowerCase() || '';
    if (text.includes('easy apply') && !easyApplyButton) {
      easyApplyButton = button;
    }
  });
  
  if (!easyApplyButton) {
    console.log('Easy Apply button not found, trying alternative placement...');
    // Fallback: look for any button container or action area
    const actionAreas = document.querySelectorAll('.actions, .job-actions, .apply-section, .btn-container');
    if (actionAreas.length > 0) {
      easyApplyButton = actionAreas[0];
    }
  }
  
  if (easyApplyButton) {
    console.log('Found Easy Apply button, injecting UI next to it');
    
    // Create Worko UI for job detail page
    const workoUI = document.createElement('div');
    workoUI.className = 'worko-job-detail-ui';
    workoUI.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-left: 12px;
      padding: 8px 12px;
      background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
      border: 1px solid #e1e8ff;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `;
    
    workoUI.innerHTML = `
      <span style="font-size: 14px;">🚀</span>
      <span style="font-size: 12px; color: #170155; font-weight: 500;">Worko AI Match</span>
      <button class="worko-score-detail-btn" style="
        background: linear-gradient(135deg, #170155 0%, #316bff 100%);
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        🎯 Score This Job
      </button>
    `;
    
    // Add click handler
    const scoreBtn = workoUI.querySelector('.worko-score-detail-btn') as HTMLButtonElement;
    scoreBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleJobDetailScore(scoreBtn);
    });
    
    // Insert next to Easy Apply button
    easyApplyButton.parentNode?.insertBefore(workoUI, easyApplyButton.nextSibling);
    
    console.log('Worko UI injected successfully next to Easy Apply button');
  } else {
    console.log('Could not find Easy Apply button for UI injection');
  }
  
  // Reset injection flag
  injectionInProgress = false;
};

// Handle scoring for job detail page
const handleJobDetailScore = async (button: HTMLButtonElement): Promise<void> => {
  try {
    console.log('Scoring job detail page...');
    
    // Extract job data from the detail page
    const jobData = extractJobData();
    
    if (!jobData) {
      button.textContent = '❌ No data';
      button.style.background = '#ef4444';
      return;
    }
    
    // Update button to loading state
    button.textContent = '⏳ Scoring...';
    button.disabled = true;
    button.style.background = '#6b7280';
    
    // Send job data for scoring
    const response = await sendMessage({
      type: 'SCORE_JOB',
      payload: { jobData }
    });
    
    if (response.success && response.data) {
      const score = response.data.score || 0;
      
      // Update button with score
      button.textContent = `✅ ${score}% Match`;
      button.disabled = false;
      
      // Color code based on score
      if (score >= 75) {
        button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      } else if (score >= 50) {
        button.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
      } else if (score >= 30) {
        button.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      } else {
        button.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      }
      
      // Add click handler to show details
      button.onclick = () => {
        chrome.runtime.sendMessage({
          type: 'SHOW_JOB_DETAILS',
          payload: { jobData, scoreData: response.data }
        });
      };
      
    } else {
      button.textContent = '❌ Failed';
      button.style.background = '#ef4444';
      button.disabled = false;
    }
    
  } catch (error) {
    console.error('Failed to score job detail:', error);
    button.textContent = '❌ Error';
    button.style.background = '#ef4444';
    button.disabled = false;
  }
};

// Inject Worko UI elements into the page (legacy function)
const injectWorkoUI = (): void => {
  // Check if already injected
  if (document.querySelector('.worko-job-matcher')) {
    return;
  }
  
  // Find a good place to inject the UI
  const targetElement = document.querySelector('.jd-header') || 
                       document.querySelector('.job-header') ||
                       document.querySelector('.job-details');
  
  if (!targetElement) {
    console.log('No suitable element found for UI injection');
    return;
  }
  
  // Create Worko UI container
  const workoContainer = document.createElement('div');
  workoContainer.className = 'worko-job-matcher';
  workoContainer.innerHTML = `
    <div class="worko-banner">
      <div class="worko-logo">
        <span class="worko-icon">🚀</span>
        <span class="worko-text">Worko Job Matcher</span>
      </div>
      <button id="worko-score-btn" class="worko-btn-primary">
        📈 Score This Job
      </button>
    </div>
    <div id="worko-results" class="worko-results" style="display: none;">
      <div class="worko-score-display">
        <span id="worko-score-value">--</span>
        <span class="worko-score-label">Match Score</span>
      </div>
      <div class="worko-actions">
        <button id="worko-view-details" class="worko-btn-secondary">View Details</button>
        <button id="worko-apply-job" class="worko-btn-primary">Apply Now</button>
      </div>
    </div>
  `;
  
  // Insert the UI
  targetElement.insertBefore(workoContainer, targetElement.firstChild);
  
  // Add event listeners
  setupUIEventListeners();
  
  console.log('Worko UI injected successfully');
};

// Set up event listeners for injected UI
const setupUIEventListeners = (): void => {
  const scoreBtn = document.getElementById('worko-score-btn');
  const viewDetailsBtn = document.getElementById('worko-view-details');
  const applyBtn = document.getElementById('worko-apply-job');
  
  scoreBtn?.addEventListener('click', handleScoreJob);
  viewDetailsBtn?.addEventListener('click', handleViewDetails);
  applyBtn?.addEventListener('click', handleApplyJob);
};

// Handle score job button click
const handleScoreJob = async (): Promise<void> => {
  const scoreBtn = document.getElementById('worko-score-btn');
  const resultsDiv = document.getElementById('worko-results');
  
  if (!scoreBtn) return;
  
  try {
    // Show loading state
    scoreBtn.textContent = '⏳ Scoring...';
    scoreBtn.setAttribute('disabled', 'true');
    
    // Extract job data
    const jobData = extractJobData();
    if (!jobData) {
      throw new Error('Could not extract job data');
    }
    
    // Send message to background script for scoring
    const response = await sendMessage({
      type: 'SCORE_JOB',
      payload: jobData
    });
    
    if (response.success) {
      // Display results
      displayScore(response.data.score);
      resultsDiv?.style.setProperty('display', 'block');
    } else {
      throw new Error(response.error || 'Scoring failed');
    }
    
  } catch (error) {
    console.error('Job scoring failed:', error);
    scoreBtn.textContent = '❌ Scoring Failed';
    setTimeout(() => {
      scoreBtn.textContent = '📈 Score This Job';
      scoreBtn.removeAttribute('disabled');
    }, 3000);
  }
};

// Display the job score
const displayScore = (score: number): void => {
  const scoreElement = document.getElementById('worko-score-value');
  if (!scoreElement) return;
  
  scoreElement.textContent = `${score}%`;
  
  // Add color coding
  let colorClass = '';
  if (score >= 75) colorClass = 'worko-score-green';
  else if (score >= 50) colorClass = 'worko-score-yellow';
  else if (score >= 30) colorClass = 'worko-score-amber';
  else colorClass = 'worko-score-red';
  
  scoreElement.className = `worko-score-value ${colorClass}`;
  
  // Reset score button
  const scoreBtn = document.getElementById('worko-score-btn');
  if (scoreBtn) {
    scoreBtn.textContent = '✅ Scored';
    scoreBtn.removeAttribute('disabled');
  }
};

// Handle view details button click
const handleViewDetails = (): void => {
  // Open extension popup or send message to show details
  chrome.runtime.sendMessage({
    type: 'SHOW_JOB_DETAILS',
    payload: { url: window.location.href }
  });
};

// Handle apply job button click
const handleApplyJob = (): void => {
  // Find the apply button on the page and click it
  const applySelectors = [
    '.apply-button',
    '.btn-apply',
    '.apply-now',
    '.jd-apply-btn'
  ];
  
  for (const selector of applySelectors) {
    const applyButton = document.querySelector(selector) as HTMLElement;
    if (applyButton) {
      applyButton.click();
      return;
    }
  }
  
  // If no apply button found, just scroll to top
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

// Inject UI into job listing cards
const injectJobListingUI = (): void => {
  if (injectionInProgress) {
    console.log('Injection already in progress, skipping...');
    return;
  }
  
  injectionInProgress = true;
  console.log('Injecting Worko UI into job listing cards...');
  console.log('Current URL:', window.location.href);
  
  // Find job cards with more targeted selectors (prioritize specific ones)
  const jobCardSelectors = [
    '.jobTuple', // Primary NaukriGulf selector
    '.srp-jobtuple-wrapper', // Naukri wrapper
    '.job-card',
    '.vacancy-card',
    '[data-job-id]'
  ];
  
  let jobCards: NodeListOf<Element> | null = null;
  let usedSelector = '';
  
  for (const selector of jobCardSelectors) {
    jobCards = document.querySelectorAll(selector);
    if (jobCards.length > 0) {
      usedSelector = selector;
      console.log(`Found ${jobCards.length} job cards using selector: ${selector}`);
      break;
    }
  }
  
  if (!jobCards || jobCards.length === 0) {
    console.log('No job cards found with standard selectors, trying fallback detection...');
    
    // More targeted fallback: look for elements with "Easy Apply" buttons
    console.log('Trying targeted fallback detection...');
    const easyApplyElements = document.querySelectorAll('*');
    const jobCardCandidates: Element[] = [];
    
    easyApplyElements.forEach(element => {
      const text = element.textContent?.toLowerCase() || '';
      
      // Very specific criteria for job cards
      const hasEasyApply = text.includes('easy apply');
      const hasJobTitle = element.querySelector('h3, h4, .title, [class*="title"]');
      const hasCompanyName = text.includes('company') || text.includes('confidential');
      const isReasonableSize = element.children.length >= 3 && element.children.length <= 15;
      const notTooLarge = text.length < 1000; // Avoid large containers
      
      if (hasEasyApply && hasJobTitle && hasCompanyName && isReasonableSize && notTooLarge) {
        console.log('Found targeted job card:', element.className);
        jobCardCandidates.push(element);
      }
    });
    
    // Limit to maximum 20 job cards to avoid over-injection
    const limitedCandidates = jobCardCandidates.slice(0, 20);
    
    if (limitedCandidates.length > 0) {
      jobCards = limitedCandidates as any as NodeListOf<Element>;
      usedSelector = 'targeted fallback detection';
      console.log(`Found ${jobCards.length} job cards using targeted fallback (limited to 20)`);
    } else {
      console.log('No job cards found on listing page');
      injectionInProgress = false;
      return;
    }
  }
  
  // Ensure jobCards is not null before proceeding
  if (!jobCards || jobCards.length === 0) {
    console.log('No job cards to inject UI into');
    return;
  }
  
  // Clean up any existing UI first
  document.querySelectorAll('.worko-job-card-ui').forEach(ui => ui.remove());
  
  // Limit injection to maximum 15 job cards for performance
  const limitedJobCards = Array.from(jobCards).slice(0, 15);
  console.log(`Injecting UI into ${limitedJobCards.length} job cards (limited from ${jobCards.length})`);
  
  // Inject UI into each job card
  limitedJobCards.forEach((jobCard, index) => {
    // Skip if already has Worko UI (double check)
    if (jobCard.querySelector('.worko-job-card-ui')) {
      console.log(`Job card ${index} already has Worko UI, skipping`);
      return;
    }
    
    console.log(`Injecting UI into job card ${index}:`, jobCard);
    
    const jobCardUI = createJobCardUI(index);
    
    // Try multiple injection strategies
    let injected = false;
    
    // Strategy 1: Look for action areas
    const actionSelectors = [
      '.job-actions',
      '.apply-button',
      '.btn-apply',
      '.job-footer',
      '.job-meta',
      '.job-buttons',
      '.actions',
      '.footer'
    ];
    
    for (const selector of actionSelectors) {
      const actionArea = jobCard.querySelector(selector);
      if (actionArea) {
        actionArea.appendChild(jobCardUI);
        injected = true;
        console.log(`Injected UI using action area: ${selector}`);
        break;
      }
    }
    
    // Strategy 2: Look for the right side of the job card
    if (!injected) {
      const rightSideSelectors = [
        '.job-right',
        '.right-section',
        '.job-aside',
        '.job-sidebar',
        '.meta-info'
      ];
      
      for (const selector of rightSideSelectors) {
        const rightArea = jobCard.querySelector(selector);
        if (rightArea) {
          rightArea.appendChild(jobCardUI);
          injected = true;
          console.log(`Injected UI using right area: ${selector}`);
          break;
        }
      }
    }
    
    // Strategy 3: Create a positioned overlay on the right side
    if (!injected) {
      // Position the UI absolutely in the top-right corner of the job card
      jobCardUI.style.position = 'absolute';
      jobCardUI.style.top = '10px';
      jobCardUI.style.right = '10px';
      jobCardUI.style.zIndex = '1000';
      
      // Make the job card relatively positioned if it's not already
      const computedStyle = window.getComputedStyle(jobCard as Element);
      if (computedStyle.position === 'static') {
        (jobCard as HTMLElement).style.position = 'relative';
      }
      
      jobCard.appendChild(jobCardUI);
      injected = true;
      console.log(`Injected UI using absolute positioning`);
    }
    
    if (!injected) {
      console.log(`Failed to inject UI into job card ${index}`);
    }
  });
  
  // Reset injection flag
  injectionInProgress = false;
  console.log('Job listing UI injection completed');
};

// Create UI for individual job cards in listings
const createJobCardUI = (cardIndex: number): HTMLElement => {
  const container = document.createElement('div');
  container.className = 'worko-job-card-ui';
  container.style.cssText = `
    margin: 4px;
    padding: 8px 10px;
    background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
    border: 1px solid #e1e8ff;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    min-width: 140px;
    max-width: 200px;
  `;
  
  container.innerHTML = `
    <div style="display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0;">
      <span style="font-size: 12px; color: #170155;">🚀</span>
      <span style="font-size: 10px; color: #170155; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Worko AI</span>
    </div>
    <button class="worko-score-job-btn" data-card-index="${cardIndex}" style="
      background: linear-gradient(135deg, #170155 0%, #316bff 100%);
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      flex-shrink: 0;
    ">
      🎯 Score
    </button>
  `;
  
  // Add click handler for the score button
  const scoreBtn = container.querySelector('.worko-score-job-btn') as HTMLButtonElement;
  scoreBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleJobCardScore(cardIndex, scoreBtn, container.closest('.jobTuple, .job-card, .job-item, .srp-jobtuple-wrapper, .job-listing-item, .vacancy-card') as HTMLElement);
  });
  
  // Add hover effects
  scoreBtn.addEventListener('mouseenter', () => {
    scoreBtn.style.transform = 'translateY(-1px)';
    scoreBtn.style.boxShadow = '0 4px 8px rgba(49, 107, 255, 0.3)';
  });
  
  scoreBtn.addEventListener('mouseleave', () => {
    scoreBtn.style.transform = 'translateY(0)';
    scoreBtn.style.boxShadow = 'none';
  });
  
  return container;
};

// Handle scoring for individual job cards
const handleJobCardScore = async (cardIndex: number, button: HTMLButtonElement, jobCard: HTMLElement): Promise<void> => {
  try {
    console.log(`Scoring job card ${cardIndex}...`);
    
    // Extract job data from the card
    const jobData = extractJobDataFromCard(jobCard);
    
    console.log('Extracted job data:', jobData);
    
    if (!jobData) {
      console.error('Failed to extract job data from card:', jobCard);
      button.textContent = '❌ No data';
      button.style.background = '#ef4444';
      return;
    }
    
    // Update button to loading state
    button.textContent = '⏳ Scoring...';
    button.disabled = true;
    button.style.background = '#6b7280';
    
    // Send job data for scoring
    const response = await sendMessage({
      type: 'SCORE_JOB',
      payload: { jobData }
    });
    
    if (response.success && response.data) {
      const score = response.data.matchingScore || 0;
      
      // Update button with score
      button.textContent = `✅ ${score}%`;
      button.disabled = false;
      
      // Color code based on score using Worko theme colors
      if (score >= 75) {
        button.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'; // Green
      } else if (score >= 50) {
        button.style.background = 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'; // Yellow
      } else if (score >= 30) {
        button.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'; // Amber
      } else {
        button.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'; // Red
      }
      
      // Store score data for potential details view
      button.setAttribute('data-score', score.toString());
      button.setAttribute('data-breakdown', JSON.stringify(response.data.breakdown));
      
      // Add hover effect to show more info
      button.title = `Match Score: ${score}%\nClick for details`;
      
      // Show a brief success notification
      showScoreNotification(score, jobData.title);
      
      // Add click handler to show details (future enhancement)
      button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Score details:', response.data);
        // Future: Show detailed breakdown in a popup
      };
      
    } else {
      // Handle specific error cases
      const errorMessage = response.error || 'Failed to score';
      
      if (errorMessage.includes('not authenticated') || errorMessage.includes('login')) {
        button.textContent = '🔐 Login';
        button.style.background = 'linear-gradient(135deg, #170155 0%, #316bff 100%)';
        button.disabled = false;
        button.title = 'Click to login and enable job scoring';
        
        // Add click handler to open login
        button.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          chrome.runtime.sendMessage({ type: 'AUTHENTICATE' });
        };
      } else {
        button.textContent = '❌ Failed';
        button.style.background = '#ef4444';
        button.disabled = false;
        button.title = errorMessage;
      }
    }
    
  } catch (error) {
    console.error('Failed to score job card:', error);
    button.textContent = '❌ Error';
    button.style.background = '#ef4444';
    button.disabled = false;
  }
};

// Extract job data from a job card element
const extractJobDataFromCard = (jobCard: HTMLElement): JobData | null => {
  try {
    console.log('Extracting job data from card:', jobCard);
    
    // Enhanced selectors for better data extraction (NaukriGulf specific)
    const titleSelectors = [
      '.job-title a',
      '.jobTupleHeader a',
      '.job-card-title a',
      '.vacancy-title a',
      'h3 a',
      'h4 a',
      '.title a',
      'a[title]', // Fallback for any link with title attribute
      'a[href*="/job"]', // Any job link
      'a[href*="/vacancy"]', // Any vacancy link
      '.jobTuple a:first-child', // First link in job tuple
      '.job-card a:first-child' // First link in job card
    ];
    
    const companySelectors = [
      '.company-name',
      '.jobTupleHeader .subTitle',
      '.job-company',
      '.employer-name',
      '.company',
      '.comp-name',
      '.jobTuple .subTitle', // NaukriGulf specific
      '.job-card .company', // Generic job card company
      '[class*="company"]', // Any element with "company" in class name
      '.jobTupleFooter .companyName' // Another NaukriGulf pattern
    ];
    
    const locationSelectors = [
      '.location',
      '.job-location',
      '.jobTupleFooter .location',
      '.loc',
      '.job-loc'
    ];
    
    const experienceSelectors = [
      '.experience',
      '.exp',
      '.job-experience',
      '.years'
    ];
    
    const salarySelectors = [
      '.salary',
      '.sal',
      '.package',
      '.compensation'
    ];
    
    // Extract title
    let title = '';
    for (const selector of titleSelectors) {
      const element = jobCard.querySelector(selector);
      if (element?.textContent?.trim()) {
        title = element.textContent.trim();
        console.log(`Found title using selector "${selector}":`, title);
        break;
      }
    }
    
    // Fallback: try to extract title from any link text
    if (!title) {
      const allLinks = Array.from(jobCard.querySelectorAll('a'));
      for (const link of allLinks) {
        const linkText = link.textContent?.trim();
        if (linkText && linkText.length > 10 && linkText.length < 100) {
          title = linkText;
          console.log('Found title from link fallback:', title);
          break;
        }
      }
    }
    
    // Extract company
    let company = '';
    for (const selector of companySelectors) {
      const element = jobCard.querySelector(selector);
      if (element?.textContent?.trim()) {
        company = element.textContent.trim();
        console.log(`Found company using selector "${selector}":`, company);
        break;
      }
    }
    
    // Fallback: try to extract company from text patterns
    if (!company) {
      const cardText = jobCard.textContent || '';
      const companyPatterns = [
        /Company:\s*([^,\n]+)/i,
        /Employer:\s*([^,\n]+)/i,
        /([A-Z][a-zA-Z\s&]+(?:Ltd|Inc|Corp|Company|Group|Solutions|Technologies|Services))/
      ];
      
      for (const pattern of companyPatterns) {
        const match = cardText.match(pattern);
        if (match && match[1]) {
          company = match[1].trim();
          console.log('Found company from pattern fallback:', company);
          break;
        }
      }
    }
    
    // Extract location
    let location = '';
    for (const selector of locationSelectors) {
      const element = jobCard.querySelector(selector);
      if (element?.textContent?.trim()) {
        location = element.textContent.trim();
        break;
      }
    }
    
    // Extract experience
    let experience = '';
    for (const selector of experienceSelectors) {
      const element = jobCard.querySelector(selector);
      if (element?.textContent?.trim()) {
        experience = element.textContent.trim();
        break;
      }
    }
    
    // Extract salary
    let salary = '';
    for (const selector of salarySelectors) {
      const element = jobCard.querySelector(selector);
      if (element?.textContent?.trim()) {
        salary = element.textContent.trim();
        break;
      }
    }
    
    // Get job URL
    const jobLink = jobCard.querySelector('a[href*="/job"], a[href*="/vacancy"], a[href*="/jobs"]') as HTMLAnchorElement;
    const jobUrl = jobLink ? new URL(jobLink.href, window.location.origin).href : window.location.href;
    
    // Extract description/requirements from card text (limited but better than nothing)
    const cardText = jobCard.textContent || '';
    const description = cardText.substring(0, 500); // First 500 chars as description
    
    // Extract skills/requirements from card text
    const requirements = extractSkillsFromText(cardText);
    
    if (!title || !company) {
      console.log('Could not extract required job data from card');
      console.log('Title:', title, 'Company:', company);
      console.log('Job card HTML:', jobCard.outerHTML.substring(0, 500));
      return null;
    }
    
    const jobData: JobData = {
      title,
      company,
      description,
      requirements,
      location,
      url: jobUrl,
      platform: window.location.hostname.includes('naukrigulf.com') ? 'naukrigulf' : 'naukri',
      extractedAt: Date.now(),
      salary,
      experience,
      jobType: 'Full-time' // Default assumption
    };
    
    console.log('Extracted job data:', jobData);
    return jobData;
    
  } catch (error) {
    console.error('Failed to extract job data from card:', error);
    return null;
  }
};

// Helper function to extract skills from text
const extractSkillsFromText = (text: string): string => {
  const skillKeywords = [
    'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js', 'express',
    'sql', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'docker', 'kubernetes',
    'git', 'agile', 'scrum', 'html', 'css', 'typescript', 'php', 'laravel', 'django',
    'spring', 'hibernate', 'redis', 'elasticsearch', 'jenkins', 'ci/cd', 'devops',
    'machine learning', 'ai', 'data science', 'analytics', 'tableau', 'power bi',
    'project management', 'leadership', 'communication', 'problem solving'
  ];
  
  const lowerText = text.toLowerCase();
  const foundSkills = skillKeywords.filter(skill => lowerText.includes(skill));
  
  return foundSkills.join(', ');
};

// Show score notification
const showScoreNotification = (score: number, jobTitle: string): void => {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${score >= 75 ? '#16a34a' : score >= 50 ? '#eab308' : score >= 30 ? '#f59e0b' : '#dc2626'};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;
  
  const emoji = score >= 75 ? '🎉' : score >= 50 ? '👍' : score >= 30 ? '⚡' : '💪';
  const message = score >= 75 ? 'Excellent match!' : score >= 50 ? 'Good match!' : score >= 30 ? 'Moderate match' : 'Keep trying!';
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 18px;">${emoji}</span>
      <div>
        <div style="font-weight: 600;">${score}% Match</div>
        <div style="font-size: 12px; opacity: 0.9;">${message}</div>
      </div>
    </div>
  `;
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 300);
  }, 3000);
};

// Wait for page to be fully loaded
const waitForPageLoad = (): Promise<void> => {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', () => resolve());
    }
  });
};

// Wait for content to be available
const waitForContent = (): Promise<boolean> => {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds max
    
    const checkContent = () => {
      attempts++;
      
      // Check if we have job-related content
      const hasJobContent = document.querySelector('.jobTuple, .job-card, .easy-apply, [class*="job"], [class*="apply"]') !== null;
      const hasTextContent = document.body.textContent && document.body.textContent.length > 1000;
      
      if (hasJobContent || hasTextContent || attempts >= maxAttempts) {
        console.log(`Content ready after ${attempts} attempts`);
        resolve(Boolean(hasJobContent || hasTextContent));
      } else {
        setTimeout(checkContent, 500);
      }
    };
    
    checkContent();
  });
};

// Initialize content script
const initialize = (): void => {
  console.log('Initializing Worko content script...');
  console.log('Current URL:', window.location.href);
  console.log('Page title:', document.title);
  console.log('Document ready state:', document.readyState);
  
  // Always try to inject on Naukri/NaukriGulf sites
  if (isNaukriSite()) {
    console.log('Naukri/NaukriGulf site detected, waiting for page load...');
    
    // Wait for page to be fully loaded, then wait for content
    waitForPageLoad().then(() => {
      console.log('Page loaded, waiting for content...');
      return waitForContent();
    }).then((hasContent) => {
      if (hasContent) {
        console.log('Content detected, starting injection...');
        
        // Determine page type and inject accordingly
        if (isJobDetailPage()) {
          console.log('Detected as job detail page');
          injectJobDetailUI();
        } else if (isJobListingPage()) {
          console.log('Detected as job listing page, injecting into cards');
          injectJobListingUI();
        } else {
          console.log('Page type not recognized, trying listing injection as fallback');
          setTimeout(() => injectJobListingUI(), 1000);
        }
      } else {
        console.log('No job content detected, skipping injection');
      }
    }).catch((error) => {
      console.error('Error during initialization:', error);
    });
  }
  
  // Set up mutation observer for dynamic content
  const observer = new MutationObserver((mutations) => {
    let shouldReinject = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if new job-related content was added
        const hasNewJobContent = Array.from(mutation.addedNodes).some(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const hasJobElements = element.matches('.jobTuple, .job-card, .job-item, .srp-jobtuple-wrapper, [class*="job"], [class*="apply"]') ||
                                 element.querySelector('.jobTuple, .job-card, .job-item, .srp-jobtuple-wrapper, [class*="job"], [class*="apply"]');
            return hasJobElements;
          }
          return false;
        });
        
        if (hasNewJobContent) {
          shouldReinject = true;
        }
      }
    });
    
    if (shouldReinject && !injectionInProgress) {
      console.log('New job content detected, re-injecting UI...');
      setTimeout(() => {
        if (isJobDetailPage()) {
          if (!document.querySelector('.worko-job-detail-ui')) {
            injectJobDetailUI();
          }
        } else if (isJobListingPage()) {
          injectJobListingUI();
        }
      }, 1000);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('Mutation observer set up for dynamic content');
};

// Start initialization
initialize();

// Simple test injection to verify script is working
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

// Debug: Add global function to manually trigger injection
(window as any).workoDebugInject = () => {
  console.log('=== WORKO DEBUG INJECTION ===');
  console.log('URL:', window.location.href);
  console.log('Is Naukri Site:', isNaukriSite());
  console.log('Is Job Detail Page:', isJobDetailPage());
  console.log('Is Job Listing Page:', isJobListingPage());
  
  // Debug: Show all potential job card elements
  console.log('=== DOM ANALYSIS ===');
  const allDivs = document.querySelectorAll('div');
  console.log('Total divs on page:', allDivs.length);
  
  // Look for elements that might be job cards
  const potentialJobCards: Array<{element: Element, index: number, classes: string, text: string}> = [];
  allDivs.forEach((div, index) => {
    const text = div.textContent?.toLowerCase() || '';
    if (text.includes('easy apply') && text.includes('years') && div.children.length > 2) {
      potentialJobCards.push({ element: div, index, classes: div.className, text: text.substring(0, 100) });
    }
  });
  
  console.log('Potential job cards found:', potentialJobCards.length);
  potentialJobCards.forEach((card, i) => {
    console.log(`Card ${i}:`, card.classes, card.text);
  });
  
  if (isJobListingPage()) {
    injectJobListingUI();
  } else if (isJobDetailPage()) {
    injectJobDetailUI();
  } else {
    console.log('Not a recognized job page');
  }
};

// Aggressive injection for testing
(window as any).workoForceInject = () => {
  console.log('=== WORKO FORCE INJECTION ===');
  
  // Find all elements that contain "Easy Apply"
  const allElements = document.querySelectorAll('*');
  let injectedCount = 0;
  
  allElements.forEach((element, index) => {
    const text = element.textContent?.toLowerCase() || '';
    
    if (text.includes('easy apply') && !element.querySelector('.worko-job-card-ui')) {
      // Create a simple UI element
      const workoUI = document.createElement('div');
      workoUI.className = 'worko-job-card-ui';
      workoUI.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: linear-gradient(135deg, #170155 0%, #316bff 100%);
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 1000;
        cursor: pointer;
      `;
      workoUI.textContent = '🎯 Score Job';
      
      // Make parent relatively positioned if needed
      const computedStyle = window.getComputedStyle(element as Element);
      if (computedStyle.position === 'static') {
        (element as HTMLElement).style.position = 'relative';
      }
      
      element.appendChild(workoUI);
      injectedCount++;
      
      console.log(`Injected UI into element ${index}:`, element.className);
    }
  });
  
  console.log(`Force injection complete. Injected ${injectedCount} UI elements.`);
};

// Export for testing
export { extractJobData, isJobPage, isJobDetailPage, isJobListingPage, injectWorkoUI, injectJobListingUI };

// ===== UTILITY FUNCTIONS =====

// Utility function to convert text to title case
function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Utility function to get CSS class based on score
function getScoreClass(score: number): string {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-fair';
  return 'score-poor';
}

// ===== WORKO SIDEBAR IMPLEMENTATION =====

// Sidebar state
interface WorkoSidebarState {
  isOpen: boolean;
  isAuthenticated: boolean;
  currentView: 'login' | 'dashboard' | 'scoring' | 'results' | 'error';
  userProfile: any;
  currentJob: any;
  jobApplications: any[];
  lastDataLoad: number;
}

let workoSidebarState: WorkoSidebarState = {
  isOpen: false,
  isAuthenticated: false,
  currentView: 'login',
  userProfile: null,
  currentJob: null,
  jobApplications: [],
  lastDataLoad: 0
};

let workoSidebarContainer: HTMLElement | null = null;
let workoSidebarElements: { [key: string]: HTMLElement } = {};

// Initialize Worko sidebar
function initializeWorkoSidebar() {
  console.log('Initializing Worko sidebar...');
  
  // Create sidebar container
  createWorkoSidebarContainer();
  
  // Create sidebar content
  createWorkoSidebarContent();
  
  // Set up event listeners
  setupWorkoSidebarEventListeners();
  
  // Add toggle button
  addWorkoSidebarToggle();
  
  // Check authentication status
  checkWorkoAuthenticationStatus();
  
  console.log('Worko sidebar initialized');
}

// Create the main sidebar container
function createWorkoSidebarContainer() {
  // Remove existing sidebar if present
  const existingSidebar = document.getElementById('worko-sidebar');
  if (existingSidebar) {
    existingSidebar.remove();
  }
  
  workoSidebarContainer = document.createElement('div');
  workoSidebarContainer.id = 'worko-sidebar';
  workoSidebarContainer.className = 'worko-sidebar-container';
  
  document.body.appendChild(workoSidebarContainer);
}

// Create sidebar content HTML
function createWorkoSidebarContent() {
  if (!workoSidebarContainer) return;
  
  workoSidebarContainer.innerHTML = `
    <div class="worko-sidebar-overlay" id="worko-sidebar-overlay"></div>
    <div class="worko-sidebar-panel" id="worko-sidebar-panel">
      <!-- Sidebar Header -->
      <div class="worko-sidebar-header">
        <div class="worko-sidebar-logo">
          <img src="${chrome.runtime.getURL('icons/worko-logo.webp')}" alt="Worko" class="worko-logo-icon">
          <span class="worko-logo-text">Worko</span>
        </div>
        <button id="worko-sidebar-close" class="worko-sidebar-close">×</button>
      </div>
      
      <!-- Sidebar Content -->
      <div class="worko-sidebar-content" id="worko-sidebar-content">
        <!-- Login State -->
        <div id="worko-login-state" class="worko-sidebar-view">
          <div class="worko-welcome-section">
            <h2>Welcome to Worko!</h2>
            <p>Connect your account to start scoring jobs</p>
            <button id="worko-login-btn" class="worko-btn-primary">
              🔐 Login with Worko
            </button>
            <p class="worko-auth-note">Secure OIDC Authentication</p>
          </div>
        </div>

        <!-- Dashboard State -->
        <div id="worko-dashboard-state" class="worko-sidebar-view" style="display: none;">
          <!-- User Info -->
          <div class="worko-user-section">
            <div class="worko-user-info">
              <img id="worko-user-avatar" src="" alt="Profile" class="worko-user-avatar" style="display: none;">
              <div class="worko-user-details">
                <span id="worko-user-name">Loading...</span>
                <a id="worko-resume-link" href="#" target="_blank" class="worko-resume-link" style="display: none;">📄 Resume</a>
              </div>
            </div>
            <button id="worko-logout-btn" class="worko-btn-secondary worko-btn-small">Logout</button>
          </div>

          <!-- Job Detection Section -->
          <div class="worko-job-detection">
            <div class="worko-job-detection-header">
              <div class="worko-job-detection-info">
                <div class="worko-job-detection-icon" id="worko-job-detection-icon">🔍</div>
                <div class="worko-job-detection-content">
                  <h4 id="worko-job-detection-title">Looking for job pages...</h4>
                  <p id="worko-job-detection-subtitle">Navigate to a job posting to get started</p>
                </div>
              </div>
              <div class="worko-job-detection-status" id="worko-job-detection-status">
                <span class="worko-status-indicator" id="worko-status-indicator">⏳</span>
              </div>
            </div>
            <button id="worko-score-job-btn" class="worko-btn-primary worko-full-width" disabled>
              📈 Score Current Job
            </button>
          </div>

          <!-- Job Applications Section -->
          <div class="worko-applications-section">
            <div class="worko-section-header">
              <h3>📋 My Job Applications</h3>
              <button id="worko-refresh-applications-btn" class="worko-btn-refresh">🔄</button>
            </div>
            <div id="worko-job-applications" class="worko-job-applications">
              <div class="worko-empty-state">
                <p>No job applications yet</p>
                <small>Apply to jobs to see them here!</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Scoring State -->
        <div id="worko-scoring-state" class="worko-sidebar-view" style="display: none;">
          <div class="worko-scoring-header">
            <button id="worko-scoring-back-btn" class="worko-btn-back">← Back</button>
            <div class="worko-scoring-loader">
              <div class="worko-loading-spinner-small"></div>
            </div>
          </div>
          <div class="worko-progress-container">
            <div class="worko-progress-steps">
              <div class="worko-step active">🔄 Extracting job details</div>
              <div class="worko-step">📊 Calculating match score</div>
              <div class="worko-step">✅ Generating results</div>
            </div>
            <div class="worko-progress-bar">
              <div id="worko-progress-fill" class="worko-progress-fill"></div>
            </div>
            <p class="worko-progress-text">Please wait while we analyze this opportunity...</p>
          </div>
        </div>

        <!-- Results State -->
        <div id="worko-results-state" class="worko-sidebar-view" style="display: none;">
          <div class="worko-results-header">
            <button id="worko-results-back-btn" class="worko-btn-back">← Back</button>
            <div id="worko-score-badge" class="worko-score-badge">85%</div>
          </div>
          
          <div class="worko-job-info">
            <h3 id="worko-job-title">Software Engineer</h3>
            <p id="worko-job-company">TechCorp</p>
            <p id="worko-job-location">📍 Bangalore, India</p>
          </div>

          <div class="worko-overall-explanation">
            <div class="worko-explanation-card">
              <div class="worko-explanation-icon">💡</div>
              <div class="worko-explanation-content">
                <h4>Overall Assessment</h4>
                <p id="worko-overall-explanation-text">This role aligns well with your profile and experience.</p>
              </div>
            </div>
          </div>

          <div class="worko-score-breakdown">
            <h4>📊 Detailed Score Breakdown</h4>
            <div id="worko-breakdown-items" class="worko-breakdown-items"></div>
          </div>

          <div class="worko-skills-analysis">
            <div class="worko-matching-skills">
              <h4>✅ Your Matching Skills</h4>
              <div id="worko-matching-skills-list" class="worko-skills-list"></div>
            </div>
            <div class="worko-missing-skills">
              <h4>📚 Skills to Develop</h4>
              <div id="worko-missing-skills-list" class="worko-skills-list"></div>
            </div>
          </div>

          <div class="worko-actions">
            <button id="worko-apply-job-btn" class="worko-btn-primary">🚀 Apply Now</button>
            <button id="worko-save-job-btn" class="worko-btn-secondary">💾 Save Job</button>
          </div>
        </div>

        <!-- Error State -->
        <div id="worko-error-state" class="worko-sidebar-view" style="display: none;">
          <div class="worko-error-content">
            <div class="worko-error-icon">⚠️</div>
            <h3>Something went wrong</h3>
            <p id="worko-error-message">An unexpected error occurred</p>
            <button id="worko-retry-btn" class="worko-btn-secondary">Try Again</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Cache sidebar elements
  cacheWorkoSidebarElements();
}

// Cache sidebar DOM elements
function cacheWorkoSidebarElements() {
  const elementIds = [
    'worko-sidebar-overlay', 'worko-sidebar-panel', 'worko-sidebar-close',
    'worko-login-state', 'worko-dashboard-state', 'worko-scoring-state', 'worko-results-state', 'worko-error-state',
    'worko-login-btn', 'worko-logout-btn', 'worko-score-job-btn', 'worko-apply-job-btn', 'worko-save-job-btn',
    'worko-scoring-back-btn', 'worko-results-back-btn', 'worko-retry-btn',
    'worko-user-name', 'worko-user-avatar', 'worko-resume-link', 'worko-job-applications', 'worko-progress-fill',
    'worko-score-badge', 'worko-job-title', 'worko-job-company', 'worko-job-location',
    'worko-overall-explanation-text', 'worko-breakdown-items', 'worko-matching-skills-list', 'worko-missing-skills-list',
    'worko-error-message', 'worko-job-detection-icon', 'worko-job-detection-title', 'worko-job-detection-subtitle',
    'worko-status-indicator', 'worko-refresh-applications-btn'
  ];
  
  elementIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      workoSidebarElements[id] = element;
    }
  });
}

// Set up event listeners for sidebar
function setupWorkoSidebarEventListeners() {
  // Close sidebar
  workoSidebarElements['worko-sidebar-close']?.addEventListener('click', closeWorkoSidebar);
  workoSidebarElements['worko-sidebar-overlay']?.addEventListener('click', closeWorkoSidebar);
  
  // Login/logout
  workoSidebarElements['worko-login-btn']?.addEventListener('click', handleWorkoSidebarLogin);
  workoSidebarElements['worko-logout-btn']?.addEventListener('click', handleWorkoSidebarLogout);
  
  // Navigation
  workoSidebarElements['worko-scoring-back-btn']?.addEventListener('click', () => showWorkoSidebarView('dashboard'));
  workoSidebarElements['worko-results-back-btn']?.addEventListener('click', () => showWorkoSidebarView('dashboard'));
  workoSidebarElements['worko-retry-btn']?.addEventListener('click', () => {
    checkWorkoAuthenticationStatus();
    showWorkoSidebarView('dashboard');
  });
  
  // Job actions
  workoSidebarElements['worko-score-job-btn']?.addEventListener('click', handleWorkoSidebarScoreJob);
  workoSidebarElements['worko-apply-job-btn']?.addEventListener('click', handleWorkoSidebarApplyJob);
  workoSidebarElements['worko-save-job-btn']?.addEventListener('click', handleWorkoSidebarSaveJob);
  
  // Refresh applications
  workoSidebarElements['worko-refresh-applications-btn']?.addEventListener('click', handleWorkoSidebarRefreshApplications);
  
  // Prevent sidebar clicks from propagating to page
  workoSidebarElements['worko-sidebar-panel']?.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// Add sidebar toggle button
function addWorkoSidebarToggle() {
  // Remove existing toggle if present
  const existingToggle = document.getElementById('worko-sidebar-toggle');
  if (existingToggle) {
    existingToggle.remove();
  }
  
  const toggleButton = document.createElement('button');
  toggleButton.id = 'worko-sidebar-toggle';
  toggleButton.className = 'worko-sidebar-toggle';
  toggleButton.innerHTML = '🚀';
  toggleButton.title = 'Open Worko Job Matcher';
  
  toggleButton.addEventListener('click', () => {
    toggleWorkoSidebar();
  });
  
  document.body.appendChild(toggleButton);
}

// Show/hide sidebar
function toggleWorkoSidebar() {
  if (workoSidebarState.isOpen) {
    closeWorkoSidebar();
  } else {
    openWorkoSidebar();
  }
}

function openWorkoSidebar() {
  if (!workoSidebarContainer) return;
  
  workoSidebarState.isOpen = true;
  workoSidebarContainer.classList.add('worko-sidebar-open');
  
  // Update toggle button
  const toggleButton = document.getElementById('worko-sidebar-toggle');
  if (toggleButton) {
    toggleButton.innerHTML = '×';
    toggleButton.title = 'Close Worko Job Matcher';
    toggleButton.classList.add('worko-sidebar-open');
  }
  
  // Prevent page scrolling when sidebar is open
  document.body.style.overflow = 'hidden';
  
  // Load initial data if authenticated
  if (workoSidebarState.isAuthenticated) {
    loadWorkoSidebarData();
  }
}

function closeWorkoSidebar() {
  if (!workoSidebarContainer) return;
  
  workoSidebarState.isOpen = false;
  workoSidebarContainer.classList.remove('worko-sidebar-open');
  
  // Update toggle button
  const toggleButton = document.getElementById('worko-sidebar-toggle');
  if (toggleButton) {
    toggleButton.innerHTML = '🚀';
    toggleButton.title = 'Open Worko Job Matcher';
    toggleButton.classList.remove('worko-sidebar-open');
  }
  
  // Restore page scrolling
  document.body.style.overflow = '';
}

// Show specific sidebar view
function showWorkoSidebarView(view: WorkoSidebarState['currentView']) {
  const views = ['worko-login-state', 'worko-dashboard-state', 'worko-scoring-state', 'worko-results-state', 'worko-error-state'];
  
  views.forEach(viewId => {
    const element = workoSidebarElements[viewId];
    if (element) {
      element.style.display = 'none';
    }
  });
  
  const viewElement = workoSidebarElements[`worko-${view}-state`];
  if (viewElement) {
    viewElement.style.display = 'block';
  }
  
  workoSidebarState.currentView = view;
}

// Authentication handlers
async function checkWorkoAuthenticationStatus() {
  try {
    const response = await sendMessage({ type: 'CHECK_AUTH', payload: {} });
    
    if (response.success && response.data) {
      workoSidebarState.isAuthenticated = true;
      workoSidebarState.userProfile = response.data;
      showWorkoSidebarView('dashboard');
      await loadWorkoSidebarData();
    } else {
      workoSidebarState.isAuthenticated = false;
      showWorkoSidebarView('login');
    }
  } catch (error) {
    console.error('Authentication check failed:', error);
    workoSidebarState.isAuthenticated = false;
    showWorkoSidebarView('login');
  }
}

async function handleWorkoSidebarLogin() {
  try {
    const response = await sendMessage({ type: 'AUTHENTICATE', payload: {} });
    
    if (response.success) {
      workoSidebarState.isAuthenticated = true;
      workoSidebarState.userProfile = response.data;
      showWorkoSidebarView('dashboard');
      await loadWorkoSidebarData();
    } else {
      throw new Error(response.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login failed:', error);
    showWorkoSidebarError('Login failed. Please try again.');
  }
}

async function handleWorkoSidebarLogout() {
  try {
    const response = await sendMessage({ type: 'LOGOUT', payload: {} });
    
    workoSidebarState.isAuthenticated = false;
    workoSidebarState.userProfile = null;
    workoSidebarState.jobApplications = [];
    workoSidebarState.lastDataLoad = 0;
    
    showWorkoSidebarView('login');
  } catch (error) {
    console.error('Logout failed:', error);
    // Still show login view even if logout fails
    showWorkoSidebarView('login');
  }
}

// Load sidebar data
async function loadWorkoSidebarData() {
  if (!workoSidebarState.isAuthenticated) return;
  
  try {
    // Load job applications
    const applicationsResponse = await sendMessage({ type: 'GET_JOB_APPLICATIONS', payload: {} });
    if (applicationsResponse.success) {
      workoSidebarState.jobApplications = applicationsResponse.data;
      workoSidebarState.lastDataLoad = Date.now();
      updateWorkoSidebarJobApplications(applicationsResponse.data);
    }
    
    // Update user info
    if (workoSidebarState.userProfile) {
      updateWorkoSidebarUserInfo(workoSidebarState.userProfile);
    }
    
    // Check current job page
    await checkWorkoSidebarJobPage();
    
  } catch (error) {
    console.error('Failed to load sidebar data:', error);
  }
}

// Update user info in sidebar
function updateWorkoSidebarUserInfo(userProfile: any) {
  if (workoSidebarElements['worko-user-name']) {
    workoSidebarElements['worko-user-name'].textContent = userProfile.name || 'User';
  }
  
  if (workoSidebarElements['worko-user-avatar'] && userProfile.profileImage) {
    const avatarImg = workoSidebarElements['worko-user-avatar'] as HTMLImageElement;
    avatarImg.src = userProfile.profileImage;
    avatarImg.style.display = 'block';
  }
  
  if (workoSidebarElements['worko-resume-link'] && userProfile.resumeUrl) {
    const resumeLink = workoSidebarElements['worko-resume-link'] as HTMLAnchorElement;
    resumeLink.href = userProfile.resumeUrl;
    resumeLink.style.display = 'flex';
  }
}

// Update job applications in sidebar
function updateWorkoSidebarJobApplications(applicationsData: any) {
  const applicationsContainer = workoSidebarElements['worko-job-applications'];
  if (!applicationsContainer) return;
  
  const applications = applicationsData?.data || [];
  
  if (applications.length === 0) {
    applicationsContainer.innerHTML = `
      <div class="worko-empty-state">
        <p>No job applications yet</p>
        <small>Apply to jobs to see them here!</small>
      </div>
    `;
    return;
  }
  
  applicationsContainer.innerHTML = applications.slice(0, 5).map((app: any) => `
    <div class="worko-job-item" data-job-id="${app.id}">
      <div class="worko-job-item-header">
        <div class="worko-job-info">
          <div class="worko-job-title">${toTitleCase(app.jobTitle)}</div>
          <div class="worko-job-company">${app.companyName}</div>
        </div>
        <div class="worko-score-badge worko-score-${getScoreClass(app.matchingScore)}">${Math.round(app.matchingScore)}%</div>
      </div>
      <div class="worko-job-status">
        <span class="worko-status-badge worko-status-${app.status.toLowerCase()}">${app.status}</span>
        <button class="worko-btn-secondary worko-btn-tiny worko-view-job" data-job-url="${app.jobUrl}">View</button>
      </div>
    </div>
  `).join('');
  
  // Add event listeners for job items
  applicationsContainer.querySelectorAll('.worko-view-job').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const jobUrl = (e.target as HTMLElement).dataset.jobUrl;
      if (jobUrl) {
        window.open(jobUrl, '_blank');
      }
    });
  });
}

// Check current job page
async function checkWorkoSidebarJobPage() {
  try {
    updateWorkoSidebarJobDetectionState('searching', 'Checking current page...', 'Analyzing page content');
    
    const isNaukri = window.location.hostname.includes('naukri.com');
    const isNaukriGulf = window.location.hostname.includes('naukrigulf.com');
    const isLinkedIn = window.location.hostname.includes('linkedin.com');
    const isSupportedPlatform = isNaukri || isNaukriGulf || isLinkedIn;
    
    if (!isSupportedPlatform) {
      updateWorkoSidebarJobDetectionState('not-found', 'Not on a job platform', 'Visit Naukri.com, NaukriGulf.com, or LinkedIn');
      return;
    }

    // Check if it's a job page by looking for job-related content
    const hasJobContent = document.querySelector('.jd-header-title, .job-details, .jobTuple, .job-card');
    
    if (hasJobContent) {
      const platform = isNaukri ? 'Naukri' : isNaukriGulf ? 'NaukriGulf' : 'LinkedIn';
      updateWorkoSidebarJobDetectionState('found', `${platform} job detected!`, 'Ready to score this job');
      
      if (workoSidebarElements['worko-score-job-btn']) {
        (workoSidebarElements['worko-score-job-btn'] as HTMLButtonElement).disabled = false;
      }
    } else {
      const platform = isNaukri ? 'Naukri' : isNaukriGulf ? 'NaukriGulf' : 'LinkedIn';
      updateWorkoSidebarJobDetectionState('not-found', `Browse ${platform} job listings`, 'Open a specific job posting to get started');
    }
    
  } catch (error) {
    console.error('Failed to check current job page:', error);
    updateWorkoSidebarJobDetectionState('error', 'Detection failed', 'Please refresh and try again');
  }
}

// Update job detection state
function updateWorkoSidebarJobDetectionState(state: 'searching' | 'found' | 'not-found' | 'error', title: string, subtitle: string) {
  const icon = workoSidebarElements['worko-job-detection-icon'];
  const titleEl = workoSidebarElements['worko-job-detection-title'];
  const subtitleEl = workoSidebarElements['worko-job-detection-subtitle'];
  const statusIndicator = workoSidebarElements['worko-status-indicator'];
  const scoreBtn = workoSidebarElements['worko-score-job-btn'] as HTMLButtonElement;

  const stateConfig = {
    searching: { icon: '🔍', statusIndicator: '⏳', btnDisabled: true, btnText: '📈 Analyzing...' },
    found: { icon: '✅', statusIndicator: '🎯', btnDisabled: false, btnText: '🚀 Score This Job' },
    'not-found': { icon: '🔍', statusIndicator: '📍', btnDisabled: true, btnText: '📈 Visit a job page to score' },
    error: { icon: '⚠️', statusIndicator: '❌', btnDisabled: true, btnText: '📈 Unable to detect job' }
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

// Job action handlers
async function handleWorkoSidebarScoreJob() {
  try {
    showWorkoSidebarView('scoring');
    animateWorkoSidebarProgress();
    
    const response = await sendMessage({
      type: 'SCORE_JOB',
      payload: { url: window.location.href }
    });
    
    if (response.success) {
      displayWorkoSidebarJobResults(response.data);
      showWorkoSidebarView('results');
    } else {
      throw new Error(response.error || 'Job scoring failed');
    }
  } catch (error) {
    console.error('Job scoring failed:', error);
    showWorkoSidebarError('Failed to score job. Please try again.');
  }
}

async function handleWorkoSidebarApplyJob() {
  if (workoSidebarState.currentJob?.url) {
    window.open(workoSidebarState.currentJob.url, '_blank');
  }
}

async function handleWorkoSidebarSaveJob() {
  try {
    const response = await sendMessage({
      type: 'SAVE_JOB',
      payload: { jobData: workoSidebarState.currentJob }
    });
    
    if (response.success) {
      const saveBtn = workoSidebarElements['worko-save-job-btn'];
      if (saveBtn) {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✅ Saved!';
        setTimeout(() => {
          saveBtn.textContent = originalText;
        }, 2000);
      }
    }
  } catch (error) {
    console.error('Failed to save job:', error);
  }
}

async function handleWorkoSidebarRefreshApplications() {
  const refreshBtn = workoSidebarElements['worko-refresh-applications-btn'];
  if (!refreshBtn) return;
  
  try {
    refreshBtn.textContent = '⏳';
    
    const response = await sendMessage({ type: 'REFRESH_JOB_APPLICATIONS', payload: {} });
    if (response.success) {
      workoSidebarState.jobApplications = response.data;
      workoSidebarState.lastDataLoad = Date.now();
      updateWorkoSidebarJobApplications(response.data);
    }
    
    refreshBtn.textContent = '✅';
    setTimeout(() => {
      refreshBtn.textContent = '🔄';
    }, 1000);
    
  } catch (error) {
    console.error('Failed to refresh applications:', error);
    refreshBtn.textContent = '❌';
    setTimeout(() => {
      refreshBtn.textContent = '🔄';
    }, 1000);
  }
}

// Progress animation
function animateWorkoSidebarProgress() {
  const progressFill = workoSidebarElements['worko-progress-fill'];
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

// Display job results
function displayWorkoSidebarJobResults(jobResult: any) {
  // Update job info
  if (workoSidebarElements['worko-job-title']) workoSidebarElements['worko-job-title'].textContent = jobResult.jobData?.title || 'Job Title';
  if (workoSidebarElements['worko-job-company']) workoSidebarElements['worko-job-company'].textContent = jobResult.jobData?.company || 'Company';
  if (workoSidebarElements['worko-job-location']) workoSidebarElements['worko-job-location'].textContent = `📍 ${jobResult.jobData?.location || 'Location'}`;
  
  // Update score badge
  if (workoSidebarElements['worko-score-badge']) {
    const score = jobResult.matchingScore || jobResult.score || 0;
    workoSidebarElements['worko-score-badge'].textContent = `${score}%`;
    workoSidebarElements['worko-score-badge'].className = `worko-score-badge worko-score-${getScoreClass(score)}`;
  }
  
  // Update overall explanation
  if (workoSidebarElements['worko-overall-explanation-text']) {
    const score = jobResult.matchingScore || jobResult.score || 0;
    const explanation = jobResult.overallExplanation || getDefaultExplanation(score);
    workoSidebarElements['worko-overall-explanation-text'].textContent = explanation;
  }
  
  // Update detailed breakdown
  displayWorkoSidebarScoreBreakdown(jobResult.breakdown, jobResult.explanation);
  
  // Update skills analysis
  displayWorkoSidebarMatchingSkills(jobResult.matchingKeywords || []);
  displayWorkoSidebarMissingSkills(jobResult.missingSkills || []);
  
  workoSidebarState.currentJob = jobResult.jobData;
}

// Display score breakdown
function displayWorkoSidebarScoreBreakdown(breakdown: any, explanations: any) {
  const breakdownContainer = workoSidebarElements['worko-breakdown-items'];
  if (!breakdownContainer || !breakdown) return;
  
  const breakdownItems = [
    { key: 'skillsScore', label: 'Skills Match', icon: '🛠️' },
    { key: 'experienceScore', label: 'Experience', icon: '📈' },
    { key: 'educationScore', label: 'Education', icon: '🎓' },
    { key: 'locationScore', label: 'Location', icon: '📍' },
    { key: 'roleScore', label: 'Role Fit', icon: '👔' }
  ];
  
  breakdownContainer.innerHTML = breakdownItems.map(item => {
    const score = breakdown[item.key] || 0;
    const explanation = explanations?.[item.key.replace('Score', '')] || 'Analysis based on your profile.';
    const scoreClass = getScoreClass(score);
    
    return `
      <div class="worko-breakdown-item worko-score-${scoreClass}">
        <div class="worko-breakdown-content">
          <div class="worko-breakdown-label">${item.icon} ${item.label}</div>
          <div class="worko-breakdown-explanation">${explanation}</div>
        </div>
        <div class="worko-breakdown-score">${Math.round(score)}%</div>
      </div>
    `;
  }).join('');
}

// Display matching skills
function displayWorkoSidebarMatchingSkills(skills: string[]) {
  const skillsContainer = workoSidebarElements['worko-matching-skills-list'];
  if (!skillsContainer) return;
  
  if (skills.length === 0) {
    skillsContainer.innerHTML = '<div class="worko-skills-empty">No matching skills identified</div>';
    return;
  }
  
  skillsContainer.innerHTML = skills.slice(0, 10).map(skill => 
    `<span class="worko-skill-tag worko-matching">${skill}</span>`
  ).join('');
}

// Display missing skills
function displayWorkoSidebarMissingSkills(skills: string[]) {
  const skillsContainer = workoSidebarElements['worko-missing-skills-list'];
  if (!skillsContainer) return;
  
  if (skills.length === 0) {
    skillsContainer.innerHTML = '<div class="worko-skills-empty">Great! No critical skills missing</div>';
    return;
  }
  
  skillsContainer.innerHTML = skills.slice(0, 8).map(skill => 
    `<span class="worko-skill-tag worko-missing">${skill}</span>`
  ).join('');
}

// Utility functions for sidebar
function getDefaultExplanation(score: number): string {
  if (score >= 75) return 'Excellent match! This role aligns very well with your profile.';
  if (score >= 50) return 'Good match! This role has strong alignment with your background.';
  if (score >= 30) return 'Moderate match. Some skills align, but there are areas for development.';
  return 'Limited match. This role may require significant skill development.';
}

function showWorkoSidebarError(message: string) {
  if (workoSidebarElements['worko-error-message']) {
    workoSidebarElements['worko-error-message'].textContent = message;
  }
  showWorkoSidebarView('error');
}

// Utility functions for sidebar (add missing functions)


// ===== END WORKO SIDEBAR IMPLEMENTATION =====