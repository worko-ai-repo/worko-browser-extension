// Worko API Client for authenticated requests
// Handles all API communication with Worko backend

import { UserProfile, JobApplicationsResponse } from '@/types';
import { simpleAuthManager } from './simple-auth-manager';
import { CONFIG } from './config';

export class WorkoAPIClient {
  private static instance: WorkoAPIClient;
  private baseURL: string;

  private constructor() {
    this.baseURL = CONFIG.apiBaseURL;
  }

  public static getInstance(): WorkoAPIClient {
    if (!WorkoAPIClient.instance) {
      WorkoAPIClient.instance = new WorkoAPIClient();
    }
    return WorkoAPIClient.instance;
  }

  /**
   * Make authenticated request to Worko API
   */
  private async makeAuthenticatedRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<any> {
    try {
      // Get valid access token
      const token = await simpleAuthManager.getValidAccessToken();
      
      if (!token) {
        throw new Error('No valid access token available');
      }

      const defaultOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      };

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...defaultOptions,
        ...options
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, try to refresh
          console.log('Token expired, attempting refresh...');
          const newToken = await simpleAuthManager.getValidAccessToken();
          
          if (newToken) {
            // Retry request with new token
            const retryResponse = await fetch(`${this.baseURL}${endpoint}`, {
              ...defaultOptions,
              ...options,
              headers: {
                ...defaultOptions.headers,
                'Authorization': `Bearer ${newToken}`
              }
            });
            
            if (!retryResponse.ok) {
              throw new Error(`API request failed: ${retryResponse.status} ${retryResponse.statusText}`);
            }
            
            return await retryResponse.json();
          } else {
            throw new Error('Authentication failed - please login again');
          }
        } else {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
      }

      return await response.json();
      
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Get user basic details by email
   */
  async getUserBasicDetails(email: string): Promise<UserProfile> {
    try {
      console.log('Fetching user basic details for:', email);
      const response = await this.makeAuthenticatedRequest(`/user/${encodeURIComponent(email)}/details`);
      
      console.log('User basic details retrieved successfully');
      
      // API returns an array with one object, so get the first item
      const userData = Array.isArray(response) ? response[0] : response;
      return this.mapToUserProfile(userData);
      
    } catch (error) {
      console.error('Failed to get user basic details:', error);
      throw error;
    }
  }

  /**
   * Get user profile details by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      console.log('Fetching user profile for ID:', userId);
      const response = await this.makeAuthenticatedRequest(`/user/${userId}/profile`);
      
      console.log('User profile retrieved successfully');
      return this.mapToUserProfile(response);
      
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Get user job applications
   */
  async getUserJobApplications(email: string, pageSize: number = 25): Promise<JobApplicationsResponse> {
    try {
      console.log('Fetching job applications for:', email);
      
      // Use the jobs API endpoint
      const jobsApiUrl = 'https://jobs.dev.worko.work';
      const endpoint = `/job-application/?pageSize=${pageSize}&companyId=&sortOrder=descending&userEmail=${encodeURIComponent(email)}&userType=CAND&lastKey=`;
      
      // Get valid access token
      const token = await simpleAuthManager.getValidAccessToken();
      
      if (!token) {
        throw new Error('No valid access token available');
      }

      const response = await fetch(`${jobsApiUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch job applications: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Job applications retrieved successfully');
      
      return {
        data: data.data.map((app: any) => ({
          id: app.id,
          jobId: app.jobId,
          jobTitle: app.jobTitle,
          companyName: app.companyName,
          matchingScore: app.matchingScore,
          status: app.status,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          jobUrl: app.jobUrl,
          rejectionFeedbackBySystem: app.rejectionFeedbackBySystem,
          scoreDetails: app.scoreDetails
        })),
        pagination: data.pagination
      };
      
    } catch (error) {
      console.error('Failed to get job applications:', error);
      throw error;
    }
  }

  /**
   * Get user skills
   */
  async getUserSkills(userId: string): Promise<any[]> {
    try {
      console.log('Fetching user skills for ID:', userId);
      const response = await this.makeAuthenticatedRequest(`/user/${userId}/skills`);
      
      console.log('User skills retrieved successfully');
      return response.data || [];
      
    } catch (error) {
      console.error('Failed to get user skills:', error);
      return [];
    }
  }

  /**
   * Get user experience
   */
  async getUserExperience(userId: string): Promise<any[]> {
    try {
      console.log('Fetching user experience for ID:', userId);
      const response = await this.makeAuthenticatedRequest(`/user/${userId}/experience`);
      
      console.log('User experience retrieved successfully');
      return response.data || [];
      
    } catch (error) {
      console.error('Failed to get user experience:', error);
      return [];
    }
  }

  /**
   * Get user education
   */
  async getUserEducation(userId: string): Promise<any[]> {
    try {
      console.log('Fetching user education for ID:', userId);
      const response = await this.makeAuthenticatedRequest(`/user/${userId}/education`);
      
      console.log('User education retrieved successfully');
      return response.data || [];
      
    } catch (error) {
      console.error('Failed to get user education:', error);
      return [];
    }
  }

  /**
   * Build complete user profile with all data
   */
  async getCompleteUserProfile(email: string): Promise<UserProfile> {
    try {
      console.log('Building complete user profile for:', email);
      
      // Get basic details first
      const basicDetails = await this.getUserBasicDetails(email);
      
      if (!basicDetails.id) {
        throw new Error('User ID not found in basic details');
      }
      
      // Get additional profile data in parallel
      const [skills, experience, education] = await Promise.allSettled([
        this.getUserSkills(basicDetails.id),
        this.getUserExperience(basicDetails.id),
        this.getUserEducation(basicDetails.id)
      ]);
      
      // Combine all data into complete profile
      const completeProfile: UserProfile = {
        ...basicDetails,
        skills: skills.status === 'fulfilled' ? this.mapSkills(skills.value) : [],
        experience: this.calculateTotalExperience(
          experience.status === 'fulfilled' ? experience.value : []
        ),
        education: education.status === 'fulfilled' ? this.mapEducation(education.value) : []
      };
      
      console.log('Complete user profile built successfully');
      return completeProfile;
      
    } catch (error) {
      console.error('Failed to build complete user profile:', error);
      throw error;
    }
  }

  /**
   * Map API response to UserProfile interface
   */
  private mapToUserProfile(apiResponse: any): UserProfile {
    return {
      id: apiResponse.id || apiResponse.userId || '',
      email: apiResponse.email || '',
      name: apiResponse.name || apiResponse.fullName || '',
      profileImage: apiResponse.profileImageAwsS3SignedUrl || apiResponse.profileImage || '',
      resumeUrl: apiResponse.cvAwsS3SignedUrl || apiResponse.resumeUrl || '',
      skills: [], // Will be populated separately
      experience: apiResponse.YOE || 0, // Years of Experience from API
      education: [], // Will be populated separately
      location: apiResponse.location || '',
      preferences: {
        preferredLocations: apiResponse.preferredLocations || [],
        preferredIndustries: apiResponse.preferredIndustries || [],
        preferredRoles: apiResponse.preferredRoles || [],
        salaryRange: apiResponse.salaryRange
      }
    };
  }

  /**
   * Map skills API response to UserSkill interface
   */
  private mapSkills(skillsData: any[]): any[] {
    return skillsData.map(skill => ({
      name: skill.skillName || skill.name || '',
      level: skill.level || 'intermediate',
      yearsOfExperience: skill.yearsOfExperience || 0
    }));
  }

  /**
   * Map education API response to UserEducation interface
   */
  private mapEducation(educationData: any[]): any[] {
    return educationData.map(edu => ({
      degree: edu.degree || '',
      institution: edu.institution || edu.school || '',
      year: edu.graduationYear || edu.year || new Date().getFullYear(),
      field: edu.fieldOfStudy || edu.field || ''
    }));
  }

  /**
   * Calculate total years of experience from experience data
   */
  private calculateTotalExperience(experienceData: any[]): number {
    if (!experienceData || experienceData.length === 0) {
      return 0;
    }

    let totalMonths = 0;
    
    experienceData.forEach(exp => {
      const startDate = new Date(exp.startDate || exp.from);
      const endDate = exp.endDate && exp.endDate !== 'Present' 
        ? new Date(exp.endDate || exp.to) 
        : new Date();
      
      if (startDate && endDate) {
        const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());
        totalMonths += Math.max(0, months);
      }
    });

    return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing API connection...');
      await this.makeAuthenticatedRequest('/user/basic-details');
      console.log('API connection test successful');
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = WorkoAPIClient.getInstance();