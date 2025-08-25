// Jest setup file for Worko Browser Extension tests

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn()
  },
  identity: {
    getRedirectURL: jest.fn(() => 'chrome-extension://test/'),
    launchWebAuthFlow: jest.fn()
  }
};

// Make chrome available globally
(global as any).chrome = mockChrome;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock DOM methods
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com',
    origin: 'https://example.com'
  },
  writable: true
});

// Export mocks for use in tests
export { mockChrome };