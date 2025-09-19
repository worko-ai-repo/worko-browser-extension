// Content script for Naukri.com and NaukriGulf.com job pages
// Fixed version with simplified imports

console.log('Worko Extension: Naukri/NaukriGulf content script loaded');

// Add debug functions to window for testing - same as original
(window as any).workoDebug = () => {
  console.log('=== WORKO DEBUG ===');
  console.log('URL:', window.location.href);
  console.log('Is Naukri site:', isNaukriSite());
  console.log('Is job detail page:', isJobDetailPage());
  
  // Force inject UI for testing
  console.log('Force injecting UI...');
  injectWorkoUI();
};

// Add test injection function - same as original
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

// Local type definitions to avoid import issues
interface JobData {
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

interface ExtensionMessage {
  type: string;
  payload?: any;
  tabId?: number;
  requestId?: string;
}

interface ExtensionResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId?: string;
}

// Check if we're on a Naukri or NaukriGulf site
const isNaukriSite = (): boolean => {
  return window.location.hostname.includes('naukri.com') || 
         window.location.hostname.includes('naukrigulf.com');
};

// Check if we're on a job detail page
const isJobDetailPage = (): boolean => {
  if (!isNaukriSite()) return false;
  
  console.log('Checking if job detail page for URL:', window.location.href);
  
  // More specific URL patterns for actual job detail pages
  const url = window.location.href;
  
  // NaukriGulf specific patterns - must have job ID at the end
  const naukriGulfPatterns = [
    /-jid-\d+$/,  // Ends with -jid-[numbers]
    /jobs-in-.*-jid-\d+$/,  // jobs-in-location-jid-numbers
    /years-n-cd-\d+-jid-\d+$/  // years-n-cd-numbers-jid-numbers
  ];
  
  // Naukri.com specific patterns
  const naukriPatterns = [
    /\/job-detail\//,
    /\/jobs\/.*\/\d+$/,  // /jobs/title/id
    /jobId=\d+/,
    /currentJobId=\d+/
  ];
  
  const isNaukriGulf = window.location.hostname.includes('naukrigulf');
  const patterns = isNaukriGulf ? naukriGulfPatterns : naukriPatterns;
  
  const hasDetailUrl = patterns.some(pattern => pattern.test(url));
  
  if (!hasDetailUrl) {
    console.log('URL does not match job detail patterns');
    return false;
  }
  
  // Additional check: ensure we have job detail elements AND it's not a listing page
  const hasJobTitle = document.querySelector('h1') !== null;
  const hasJobDescription = document.querySelector('.job-description, .job-desc, [class*="description"]') !== null;
  const isNotListingPage = !document.querySelector('.jobTuple, .job-card, .srp-jobtuple-wrapper, .search-results');
  
  const isDetailPage = hasJobTitle && hasJobDescription && isNotListingPage;
  
  console.log('Job detail page detection results:');
  console.log('- hasDetailUrl:', hasDetailUrl);
  console.log('- hasJobTitle:', hasJobTitle);
  console.log('- hasJobDescription:', hasJobDescription);
  console.log('- isNotListingPage:', isNotListingPage);
  console.log('- Final result:', isDetailPage);
  
  return isDetailPage;
};

// Extract job data from the page
const extractJobData = (): JobData | null => {
  try {
    const platform = window.location.hostname.includes('naukrigulf') ? 'naukrigulf' : 'naukri';
    
    // Try multiple selectors for job title
    const titleSelectors = [
      '.jd-header-title',
      '.job-title',
      '.vacancy-title',
      'h1[data-testid="job-title"]',
      'h1.job-header-title',
      'h1',
      '.main-title',
      '.position-title'
    ];
    
    // Try multiple selectors for company name
    const companySelectors = [
      '.jd-header-comp-name',
      '.company-name',
      '.employer-name',
      '[data-testid="company-name"]',
      '.job-header-company',
      '.company-title',
      'h2',
      '.employer'
    ];
    
    // Try multiple selectors for job description
    const descriptionSelectors = [
      '.dang-inner-html',
      '.job-description',
      '.vacancy-description',
      '.job-details-content',
      '.job-content',
      '.description-content',
      '.job-desc',
      '[class*="description"]'
    ];
    
    // Try multiple selectors for location
    const locationSelectors = [
      '.jd-loc',
      '.job-location',
      '.vacancy-location',
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
        break;
      }
    }
    
    // Find company element
    for (const selector of companySelectors) {
      companyElement = document.querySelector(selector) as HTMLElement;
      if (companyElement && companyElement.textContent?.trim()) {
        break;
      }
    }
    
    // Find description element
    for (const selector of descriptionSelectors) {
      descriptionElement = document.querySelector(selector) as HTMLElement;
      if (descriptionElement && descriptionElement.textContent?.trim()) {
        break;
      }
    }
    
    // Find location element
    for (const selector of locationSelectors) {
      locationElement = document.querySelector(selector) as HTMLElement;
      if (locationElement && locationElement.textContent?.trim()) {
        break;
      }
    }
    
    if (!titleElement || !companyElement) {
      console.log('Required job elements not found');
      return null;
    }
    
    const jobData: JobData = {
      title: titleElement.textContent?.trim() || '',
      company: companyElement.textContent?.trim() || '',
      description: descriptionElement?.textContent?.trim() || '',
      requirements: descriptionElement?.textContent?.trim() || '',
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

// Store the latest scoring results
let latestScoringResults: any = null;

// Inject Worko UI into Naukri's interface (matching LinkedIn style)
const injectWorkoUI = (): void => {
  console.log('=== WORKO UI INJECTION ===');
  
  // Check if already injected
  if (document.querySelector('.worko-job-matcher-naukri')) {
    console.log('Worko UI already injected');
    return;
  }
  
  // Find the best location to inject the UI - look for job info sections
  const jobInfoSelectors = [
    '.jd-header',           // Naukri job header
    '.job-header',          // Generic job header
    '.vacancy-header',      // NaukriGulf vacancy header
    '.job-details-header',  // Job details header
    '.job-info',           // Job info section
    '.job-summary',        // Job summary section
    '.job-details-section' // Job details section
  ];
  
  let targetElement: Element | null = null;
  
  // Debug: log all available elements
  console.log('=== AVAILABLE ELEMENTS FOR UI INJECTION ===');
  jobInfoSelectors.forEach(selector => {
    const element = document.querySelector(selector);
    console.log(`${selector}: ${element ? 'FOUND' : 'NOT FOUND'}`);
    if (element) {
      console.log(`  - Class: ${element.className}`);
      console.log(`  - Tag: ${element.tagName}`);
    }
  });
  
  // Try to find the most appropriate job info container
  for (const selector of jobInfoSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      targetElement = element;
      console.log(`✅ Selected target element with selector: ${selector}`);
      console.log(`   Element details:`, {
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        childElementCount: element.childElementCount
      });
      break;
    }
  }
  
  // If no specific job info section found, try to find a good location near the job title
  if (!targetElement) {
    const h1Element = document.querySelector('h1');
    if (h1Element) {
      // Look for a parent container that might be the job info section
      let parent = h1Element.parentElement;
      while (parent && parent !== document.body) {
        const className = parent.className.toLowerCase();
        if (className.includes('job') || className.includes('detail') || className.includes('info')) {
          targetElement = parent;
          console.log('Found job info container via h1 parent:', parent.className);
          break;
        }
        parent = parent.parentElement;
      }
      
      // If still no good container, use the h1's parent
      if (!targetElement) {
        targetElement = h1Element.parentElement;
        console.log('Using h1 parent as fallback');
      }
    }
  }
  
  // Last resort - use body but this should rarely happen
  if (!targetElement) {
    targetElement = document.body;
    console.log('Using body as last resort');
  }
  
  // Create Worko UI container with consistent styling
  const workoContainer = document.createElement('div');
  workoContainer.className = 'worko-job-matcher-naukri';
  workoContainer.innerHTML = `
    <div class="worko-naukri-banner">
      <div class="worko-naukri-content">
        <div class="worko-naukri-logo">
          <img src="${chrome.runtime.getURL('icons/32.png')}" alt="Worko" class="worko-logo-img" style="width: 24px; height: 24px; margin-right: 8px; border-radius: 4px;">
          <span class="worko-text">Worko Match</span>
        </div>
        <div class="worko-naukri-actions">
          <span id="worko-naukri-score" class="worko-score-display" style="display: none;">
            <span id="worko-score-value">--</span>% Match
          </span>
          <button id="worko-naukri-score-btn" class="worko-naukri-btn-primary">
            Score Job
          </button>
          <button id="worko-naukri-details" class="worko-naukri-btn-secondary" style="display: none;">
            View Details
          </button>
          <button id="worko-naukri-apply" class="worko-naukri-btn-apply" style="display: none;">
            Apply
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Use the safest insertion method - always append to avoid insertBefore issues
  try {
    // Simple and safe approach - just append to the target element
    targetElement.appendChild(workoContainer);
    console.log('Successfully appended Worko UI to target element');
  } catch (error) {
    console.error('Error inserting Worko UI:', error);
    // Ultimate fallback - append to body
    try {
      document.body.appendChild(workoContainer);
      console.log('Used body appendChild as fallback');
    } catch (fallbackError) {
      console.error('Even fallback insertion failed:', fallbackError);
      return;
    }
  }
  
  // Add event listeners
  setupNaukriEventListeners();
  
  console.log('Worko UI injected into Naukri successfully');
};

// Set up event listeners for Naukri UI
const setupNaukriEventListeners = (): void => {
  const scoreBtn = document.getElementById('worko-naukri-score-btn');
  const detailsBtn = document.getElementById('worko-naukri-details');
  const applyBtn = document.getElementById('worko-naukri-apply');
  
  scoreBtn?.addEventListener('click', handleNaukriScoreJob);
  detailsBtn?.addEventListener('click', handleNaukriViewDetails);
  applyBtn?.addEventListener('click', handleNaukriApplyJob);
};

// Handle score job for Naukri
const handleNaukriScoreJob = async (): Promise<void> => {
  const scoreBtn = document.getElementById('worko-naukri-score-btn');
  const scoreDisplay = document.getElementById('worko-naukri-score');
  const detailsBtn = document.getElementById('worko-naukri-details');
  const applyBtn = document.getElementById('worko-naukri-apply');
  
  if (!scoreBtn) return;
  
  try {
    // Show loading state
    scoreBtn.textContent = 'Scoring...';
    scoreBtn.setAttribute('disabled', 'true');
    
    // Extract job data
    const jobData = extractJobData();
    if (!jobData) {
      throw new Error('Could not extract job data from Naukri');
    }
    
    console.log('Sending job data for scoring:', jobData);
    
    // Send message to background script for scoring
    const response = await sendMessage({
      type: 'SCORE_JOB',
      payload: jobData
    });
    
    if (response.success) {
      // Store the scoring results for details view
      latestScoringResults = response.data;
      
      // Display results
      const score = response.data.matchingScore || response.data.score || 0;
      displayNaukriScore(score);
      scoreDisplay?.style.setProperty('display', 'inline-block');
      detailsBtn?.style.setProperty('display', 'inline-block');
      applyBtn?.style.setProperty('display', 'inline-block');
      scoreBtn.style.display = 'none';
    } else {
      throw new Error(response.error || 'Scoring failed');
    }
    
  } catch (error) {
    console.error('Naukri job scoring failed:', error);
    scoreBtn.textContent = 'Scoring Failed';
    setTimeout(() => {
      scoreBtn.textContent = 'Score Job';
      scoreBtn.removeAttribute('disabled');
    }, 3000);
  }
};

// Display score in Naukri UI
const displayNaukriScore = (score: number): void => {
  const scoreElement = document.getElementById('worko-score-value');
  if (!scoreElement) return;
  
  scoreElement.textContent = score.toString();
  
  // Add color coding
  const scoreDisplay = document.getElementById('worko-naukri-score');
  if (scoreDisplay) {
    let colorClass = '';
    if (score >= 75) colorClass = 'worko-score-green';
    else if (score >= 50) colorClass = 'worko-score-yellow';
    else if (score >= 30) colorClass = 'worko-score-amber';
    else colorClass = 'worko-score-red';
    
    scoreDisplay.className = `worko-score-display ${colorClass}`;
  }
};

// Handle view details for Naukri
const handleNaukriViewDetails = (): void => {
  if (!latestScoringResults) {
    console.error('No scoring results available');
    return;
  }
  
  showJobDetailsModal(latestScoringResults);
};

// Show job details modal (same as LinkedIn)
const showJobDetailsModal = (scoringResults: any): void => {
  // Remove existing modal if any
  const existingModal = document.querySelector('.worko-details-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modal = document.createElement('div');
  modal.className = 'worko-details-modal';
  modal.innerHTML = `
    <div class="worko-modal-overlay">
      <div class="worko-modal-content">
        <div class="worko-modal-header">
          <h3>Job Match Details</h3>
          <button class="worko-modal-close">&times;</button>
        </div>
        <div class="worko-modal-body">
          <div class="worko-overall-score">
            <div class="worko-score-circle">
              <span class="worko-score-number">${scoringResults.matchingScore}%</span>
            </div>
            <p class="worko-overall-explanation">${scoringResults.overallExplanation}</p>
          </div>
          
          <div class="worko-breakdown-section">
            <h4>Score Breakdown</h4>
            <div class="worko-breakdown-items">
              <div class="worko-breakdown-item">
                <span class="worko-breakdown-label">Experience</span>
                <div class="worko-breakdown-bar">
                  <div class="worko-breakdown-fill" style="width: ${scoringResults.breakdown.experienceScore}%"></div>
                </div>
                <span class="worko-breakdown-score">${scoringResults.breakdown.experienceScore}%</span>
              </div>
              <div class="worko-breakdown-item">
                <span class="worko-breakdown-label">Skills</span>
                <div class="worko-breakdown-bar">
                  <div class="worko-breakdown-fill" style="width: ${scoringResults.breakdown.skillsScore}%"></div>
                </div>
                <span class="worko-breakdown-score">${scoringResults.breakdown.skillsScore}%</span>
              </div>
              <div class="worko-breakdown-item">
                <span class="worko-breakdown-label">Education</span>
                <div class="worko-breakdown-bar">
                  <div class="worko-breakdown-fill" style="width: ${scoringResults.breakdown.educationScore}%"></div>
                </div>
                <span class="worko-breakdown-score">${scoringResults.breakdown.educationScore}%</span>
              </div>
              <div class="worko-breakdown-item">
                <span class="worko-breakdown-label">Location</span>
                <div class="worko-breakdown-bar">
                  <div class="worko-breakdown-fill" style="width: ${scoringResults.breakdown.locationScore}%"></div>
                </div>
                <span class="worko-breakdown-score">${scoringResults.breakdown.locationScore}%</span>
              </div>
              <div class="worko-breakdown-item">
                <span class="worko-breakdown-label">Role Match</span>
                <div class="worko-breakdown-bar">
                  <div class="worko-breakdown-fill" style="width: ${scoringResults.breakdown.roleScore}%"></div>
                </div>
                <span class="worko-breakdown-score">${scoringResults.breakdown.roleScore}%</span>
              </div>
            </div>
          </div>
          
          ${scoringResults.matchingKeywords && scoringResults.matchingKeywords.length > 0 ? `
          <div class="worko-skills-section">
            <h4>Your Matching Skills</h4>
            <div class="worko-skills-list">
              ${scoringResults.matchingKeywords.map((skill: string) => `<span class="worko-skill-tag worko-skill-match">${skill}</span>`).join('')}
            </div>
          </div>
          ` : ''}
          
          ${scoringResults.missingSkills && scoringResults.missingSkills.length > 0 ? `
          <div class="worko-skills-section">
            <h4>Skills to Develop</h4>
            <div class="worko-skills-list">
              ${scoringResults.missingSkills.map((skill: string) => `<span class="worko-skill-tag worko-skill-missing">${skill}</span>`).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  const closeBtn = modal.querySelector('.worko-modal-close');
  const overlay = modal.querySelector('.worko-modal-overlay');
  
  closeBtn?.addEventListener('click', () => modal.remove());
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) {
      modal.remove();
    }
  });
  
  // Close on escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
};

// Handle apply job for Naukri
const handleNaukriApplyJob = (): void => {
  // Find Naukri's apply button
  const applySelectors = [
    '.apply-button',
    '.btn-apply',
    '.easy-apply',
    'button[title*="Apply"]',
    'button[aria-label*="Apply"]',
    '.jd-apply-btn',
    '.apply-now',
    'a[href*="apply"]'
  ];
  
  for (const selector of applySelectors) {
    const applyButton = document.querySelector(selector) as HTMLElement;
    if (applyButton && (applyButton.textContent?.toLowerCase().includes('apply') || 
                       applyButton.getAttribute('title')?.toLowerCase().includes('apply'))) {
      applyButton.click();
      return;
    }
  }
  
  // If no apply button found, scroll to the top where apply buttons usually are
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Initialize the extension
const initializeWorko = () => {
  console.log('Initializing Worko extension...');
  
  // Check if we're on a Naukri/NaukriGulf site
  if (!isNaukriSite()) {
    console.log('Not on a Naukri/NaukriGulf site, skipping initialization');
    return;
  }
  
  // Wait a bit for dynamic content to load, then check if it's a job detail page
  setTimeout(() => {
    if (isJobDetailPage()) {
      console.log('On job detail page, injecting UI...');
      injectWorkoUI();
    } else {
      console.log('Not on job detail page, skipping UI injection');
    }
  }, 500); // Small delay to ensure page content is loaded
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
export { extractJobData, isJobDetailPage, injectWorkoUI };