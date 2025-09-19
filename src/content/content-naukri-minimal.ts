// Minimal content script for Naukri.com and NaukriGulf.com job pages
// This is a simplified version to avoid compilation issues

console.log('Worko Extension: Minimal Naukri content script loaded');

// Simple job data interface
interface SimpleJobData {
  title: string;
  company: string;
  description: string;
  url: string;
  platform: string;
}

// Check if we're on a Naukri site
const isNaukriSite = (): boolean => {
  return window.location.hostname.includes('naukri.com') || 
         window.location.hostname.includes('naukrigulf.com');
};

// Simple job data extraction
const extractJobData = (): SimpleJobData | null => {
  try {
    const platform = window.location.hostname.includes('naukrigulf') ? 'naukrigulf' : 'naukri';
    
    // Simple selectors
    const titleElement = document.querySelector('h1') as HTMLElement;
    const companyElement = document.querySelector('h2') as HTMLElement;
    
    if (!titleElement || !companyElement) {
      console.log('Could not find job elements');
      return null;
    }
    
    return {
      title: titleElement.textContent?.trim() || '',
      company: companyElement.textContent?.trim() || '',
      description: '',
      url: window.location.href,
      platform: platform
    };
  } catch (error) {
    console.error('Job extraction failed:', error);
    return null;
  }
};

// Simple UI injection
const injectUI = () => {
  if (document.querySelector('.worko-simple-ui')) {
    return; // Already injected
  }
  
  const ui = document.createElement('div');
  ui.className = 'worko-simple-ui';
  ui.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: #4f46e5;
    color: white;
    padding: 10px 15px;
    border-radius: 6px;
    font-size: 14px;
    z-index: 1000;
    cursor: pointer;
    font-family: system-ui, sans-serif;
  `;
  ui.textContent = '🚀 Worko';
  
  ui.addEventListener('click', () => {
    const jobData = extractJobData();
    if (jobData) {
      ui.textContent = `✅ Found: ${jobData.title}`;
      ui.style.background = '#10b981';
      setTimeout(() => {
        ui.textContent = '🚀 Worko';
        ui.style.background = '#4f46e5';
      }, 3000);
    } else {
      ui.textContent = '❌ No job found';
      ui.style.background = '#ef4444';
      setTimeout(() => {
        ui.textContent = '🚀 Worko';
        ui.style.background = '#4f46e5';
      }, 3000);
    }
  });
  
  document.body.appendChild(ui);
};

// Initialize
const init = () => {
  if (!isNaukriSite()) {
    return;
  }
  
  console.log('Initializing Worko on Naukri site');
  
  // Only inject on pages that look like job pages
  if (window.location.href.includes('job') || 
      window.location.href.includes('vacancy') ||
      document.querySelector('h1')) {
    injectUI();
  }
};

// Run initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

setTimeout(init, 1000);