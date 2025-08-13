import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  ReferralData, 
  RewardData, 
  ClaimRewardResponse, 
  VerifyCodeResponse,
  DemoReferralStats,
  GenerateLinkResponse,
  PointsResponse 
} from '@/types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Referral endpoints
  async getReferralByCode(code: string): Promise<ReferralData> {
    const response = await this.api.get<ApiResponse<ReferralData>>(`/referral/${code}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to get referral');
  }

  async getAvailableRewards(): Promise<RewardData[]> {
    const response = await this.api.get<ApiResponse<RewardData[]>>('/referral/demo/rewards');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to get rewards');
  }

  async claimReward(referralCode: string, rewardId: string): Promise<ClaimRewardResponse> {
    const response = await this.api.post<ApiResponse<ClaimRewardResponse>>('/referral/claim', {
      referralCode,
      rewardId
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to claim reward');
  }

  async generateLink(): Promise<GenerateLinkResponse> {
    const response = await this.api.post<ApiResponse<GenerateLinkResponse>>('/referral/generate-link', {});
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Failed to generate link');
  }

  async getPoints(inviterId: string): Promise<PointsResponse> {
    const response = await this.api.get<ApiResponse<PointsResponse>>(`/referral/points/${inviterId}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Failed to get points');
  }

  async getDemoStats(): Promise<DemoReferralStats> {
    const response = await this.api.get<ApiResponse<DemoReferralStats>>('/referral/stats/demo');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to get demo stats');
  }

  // Cashier endpoints
  async verifyCode(code: string): Promise<VerifyCodeResponse> {
    const response = await this.api.post<ApiResponse<VerifyCodeResponse>>('/cashier/verify', {
      code
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to verify code');
  }

  async redeemReward(code: string, cashierId: string, storeId: string, notes?: string): Promise<any> {
    const response = await this.api.post<ApiResponse<any>>('/cashier/redeem', {
      code,
      cashierId,
      storeId,
      notes
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to redeem reward');
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();


