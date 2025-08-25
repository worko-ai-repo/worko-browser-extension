// Simplified OAuth Authentication Manager for Worko Browser Extension
// Direct OAuth implementation without AWS Amplify complexity

import { AuthTokens, UserProfile } from '@/types';
import { CONFIG } from './config';

export class SimpleAuthManager {
  private static instance: SimpleAuthManager;
  
  public static getInstance(): SimpleAuthManager {
    if (!SimpleAuthManager.instance) {
      SimpleAuthManager.instance = new SimpleAuthManager();
    }
    return SimpleAuthManager.instance;
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get(['authTokens']);
      const tokens = result.authTokens as AuthTokens;
      
      if (!tokens || !tokens.accessToken) {
        return false;
      }
      
      // Check if token is expired
      if (Date.now() >= tokens.expiresAt) {
        console.log('Token expired, attempting refresh...');
        const refreshed = await this.refreshTokens();
        return refreshed;
      }
      
      return true;
      
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }



  /**
   * Test OAuth URL accessibility
   */
  async testOAuthUrl(): Promise<boolean> {
    try {
      const authUrl = this.buildOAuthUrl();
      
      // Test if the OAuth URL is accessible
      const response = await fetch(authUrl, { 
        method: 'HEAD',
        mode: 'no-cors' // Avoid CORS issues for testing
      });
      
      console.log('OAuth URL test response:', response.status);
      return true;
      
    } catch (error) {
      console.error('OAuth URL test failed:', error);
      return false;
    }
  }

  /**
   * Start OAuth login flow
   */
  async signIn(): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      console.log('Starting OAuth sign-in flow...');
      
      // Test OAuth URL first
      const urlAccessible = await this.testOAuthUrl();
      if (!urlAccessible) {
        console.warn('OAuth URL may not be accessible, but proceeding anyway...');
      }
      
      // Build OAuth URL
      const authUrl = this.buildOAuthUrl();
      console.log('OAuth URL:', authUrl);
      
      // Try Chrome identity API first, fallback to tab-based auth
      let responseUrl: string;
      
      try {
        console.log('Attempting Chrome identity API authentication...');
        
        const authResult = await chrome.identity.launchWebAuthFlow({
          url: authUrl,
          interactive: true
        });
        
        if (!authResult) {
          throw new Error('No response URL received from OAuth flow');
        }
        
        responseUrl = authResult;
        

        
        console.log('Chrome identity API authentication successful');
        
      } catch (identityError) {
        console.error('Chrome identity API failed:', identityError);
        
        // Fallback: Tab-based authentication
        console.log('Falling back to tab-based authentication...');
        
        responseUrl = await this.performTabBasedAuth(authUrl);
      }
      
      console.log('OAuth response received');
      
      // Extract authorization code
      const code = this.extractAuthCode(responseUrl);
      if (!code) {
        throw new Error('No authorization code received');
      }
      
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code);
      
      // Store tokens
      await this.storeTokens(tokens);
      
      // Get user info
      if (!tokens.accessToken) {
        throw new Error('No access token received');
      }
      const userInfo = await this.getUserInfo(tokens.accessToken);
      
      // Store user profile
      await chrome.storage.local.set({ userProfile: userInfo });
      
      console.log('Sign-in successful');
      return {
        success: true,
        user: userInfo
      };
      
    } catch (error) {
      console.error('Sign-in failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }



  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(): Promise<string | null> {
    try {
      const result = await chrome.storage.local.get(['authTokens']);
      const tokens = result.authTokens as AuthTokens;
      
      if (!tokens || !tokens.accessToken) {
        return null;
      }
      
      // Check if token is expired
      if (Date.now() >= tokens.expiresAt) {
        console.log('Token expired, refreshing...');
        const refreshed = await this.refreshTokens();
        if (!refreshed) {
          return null;
        }
        
        // Get refreshed tokens
        const newResult = await chrome.storage.local.get(['authTokens']);
        const newTokens = newResult.authTokens as AuthTokens;
        return newTokens?.accessToken || null;
      }
      
      return tokens.accessToken;
      
    } catch (error) {
      console.error('Failed to get valid access token:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshTokens(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get(['authTokens']);
      const tokens = result.authTokens as AuthTokens;
      
      if (!tokens || !tokens.refreshToken) {
        console.log('No refresh token available');
        return false;
      }
      
      const tokenEndpoint = `${CONFIG.amplify.cognitoDomain}/oauth2/token`;
      
      const refreshParams = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: CONFIG.amplify.userPoolClientId,
        refresh_token: tokens.refreshToken
      });
      
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: refreshParams.toString()
      });
      
      if (!response.ok) {
        console.error('Token refresh failed:', response.status);
        return false;
      }
      
      const tokenData = await response.json();
      
      const newTokens: AuthTokens = {
        accessToken: tokenData.access_token,
        idToken: tokenData.id_token || tokens.idToken,
        refreshToken: tokenData.refresh_token || tokens.refreshToken,
        expiresAt: Date.now() + ((tokenData.expires_in || 3600) * 1000)
      };
      
      await this.storeTokens(newTokens);
      
      console.log('Token refresh successful');
      return true;
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Build OAuth authorization URL
   */
  private buildOAuthUrl(): string {
    const redirectUri = chrome.identity.getRedirectURL();
    const state = this.generateState();
    
    const params = new URLSearchParams({
      client_id: CONFIG.amplify.userPoolClientId,
      response_type: 'code',
      scope: 'openid email profile',
      redirect_uri: redirectUri,
      state: state
    });
    
    const authUrl = `${CONFIG.amplify.cognitoDomain}/oauth2/authorize?${params.toString()}`;
    
    // Debug logging
    console.log('OAuth Configuration:', {
      cognitoDomain: CONFIG.amplify.cognitoDomain,
      clientId: CONFIG.amplify.userPoolClientId,
      redirectUri: redirectUri,
      authUrl: authUrl
    });
    
    return authUrl;
  }

  /**
   * Extract authorization code from callback URL
   */
  private extractAuthCode(responseUrl: string): string | null {
    try {
      const url = new URL(responseUrl);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      
      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }
      
      return code;
      
    } catch (error) {
      console.error('Failed to extract auth code:', error);
      return null;
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<AuthTokens> {
    const tokenEndpoint = `${CONFIG.amplify.cognitoDomain}/oauth2/token`;
    const redirectUri = chrome.identity.getRedirectURL();
    
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CONFIG.amplify.userPoolClientId,
      code: code,
      redirect_uri: redirectUri
    });
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams.toString()
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
    }
    
    const tokenData = await response.json();
    
    return {
      accessToken: tokenData.access_token,
      idToken: tokenData.id_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + ((tokenData.expires_in || 3600) * 1000)
    };
  }

  /**
   * Get user information from Cognito
   */
  private async getUserInfo(accessToken: string): Promise<UserProfile> {
    const userInfoEndpoint = `${CONFIG.amplify.cognitoDomain}/oauth2/userInfo`;
    
    const response = await fetch(userInfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`);
    }
    
    const userInfo = await response.json();
    
    // Map Cognito user info to UserProfile
    return {
      id: userInfo.sub || userInfo.username || '',
      email: userInfo.email || '',
      name: userInfo.name || userInfo.given_name || userInfo.email || '',
      skills: [], // Will be populated from API
      experience: 0, // Will be calculated from API
      education: [], // Will be populated from API
      location: userInfo.address || '',
      preferences: {
        preferredLocations: [],
        preferredIndustries: [],
        preferredRoles: []
      }
    };
  }

  /**
   * Store authentication tokens securely
   */
  private async storeTokens(tokens: AuthTokens): Promise<void> {
    await chrome.storage.local.set({ authTokens: tokens });
  }

  /**
   * Perform tab-based authentication when Chrome identity API fails
   */
  private async performTabBasedAuth(authUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('Starting tab-based authentication...');
      
      // Create a new tab with the OAuth URL
      chrome.tabs.create({ url: authUrl }, (tab) => {
        if (!tab || !tab.id) {
          reject(new Error('Failed to create authentication tab'));
          return;
        }
        
        const tabId = tab.id;
        console.log('Authentication tab created:', tabId);
        
        // Listen for tab updates to detect the redirect
        const onTabUpdated = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo, updatedTab: chrome.tabs.Tab) => {
          if (updatedTabId !== tabId) return;
          
          // Check if the tab URL contains our redirect URI or authorization code
          if (updatedTab.url && (
            updatedTab.url.includes(chrome.identity.getRedirectURL()) ||
            updatedTab.url.includes('code=') ||
            updatedTab.url.includes('error=')
          )) {
            console.log('Authentication redirect detected:', updatedTab.url);
            
            // Clean up listeners
            chrome.tabs.onUpdated.removeListener(onTabUpdated);
            chrome.tabs.onRemoved.removeListener(onTabRemoved);
            
            // Close the auth tab
            chrome.tabs.remove(tabId);
            
            // Resolve with the redirect URL
            resolve(updatedTab.url);
          }
        };
        
        // Listen for tab being closed (user cancelled)
        const onTabRemoved = (removedTabId: number) => {
          if (removedTabId === tabId) {
            console.log('Authentication tab was closed');
            
            // Clean up listeners
            chrome.tabs.onUpdated.removeListener(onTabUpdated);
            chrome.tabs.onRemoved.removeListener(onTabRemoved);
            
            reject(new Error('Authentication was cancelled by user'));
          }
        };
        
        // Set up listeners
        chrome.tabs.onUpdated.addListener(onTabUpdated);
        chrome.tabs.onRemoved.addListener(onTabRemoved);
        
        // Set a timeout to avoid hanging forever
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(onTabUpdated);
          chrome.tabs.onRemoved.removeListener(onTabRemoved);
          
          // Try to close the tab if it still exists
          chrome.tabs.remove(tabId).catch(() => {
            // Tab might already be closed
          });
          
          reject(new Error('Authentication timeout - please try again'));
        }, 300000); // 5 minutes timeout
      });
    });
  }

  /**
   * Get current authenticated user from storage
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const result = await chrome.storage.local.get(['userProfile']);
      return result.userProfile || null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      console.log('Signing out user...');
      
      // Clear stored tokens and user data
      await chrome.storage.local.remove(['authTokens', 'userProfile']);
      
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  }

  /**
   * Generate random state for OAuth security
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

// Export singleton instance
export const simpleAuthManager = SimpleAuthManager.getInstance();