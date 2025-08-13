// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
    field?: string;
  };
  timestamp: string;
  requestId?: string;
}

// Referral Types
export interface ReferralData {
  id: string;
  referralCode: string;
  inviteePhone?: string;
  status: 'PENDING' | 'CLAIMED' | 'REDEEMED' | 'EXPIRED';
  rewardCode?: string;
  claimedAt?: string;
  redeemedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReferralRequest {
  referralCode: string;
  inviteePhone?: string;
}

// Reward Types
export interface RewardData {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  category: 'INSTANT' | 'MILESTONE' | 'SEASONAL';
  isActive: boolean;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface RewardCodeData {
  id: string;
  code: string;
  rewardId: string;
  referralId: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
  reward: RewardData;
}

// Claim Types
export interface ClaimRewardRequest {
  rewardId: string;
}

export interface ClaimRewardResponse {
  claimId: string;
  rewardCode: string;
  reward: RewardData;
  expiresAt: string;
  timerMinutes: number;
  qrUrl?: string;
}

export interface GenerateLinkResponse {
  referralCode: string;
  shareUrl: string;
}

export interface PointsResponse {
  inviterId: string;
  points: number;
  nextMilestone?: number;
  pointsToNext?: number;
}

// Cashier Types
export interface VerifyCodeRequest {
  code: string;
}

export interface VerifyCodeResponse {
  code: string;
  reward: RewardData;
  status: 'VALID' | 'INVALID' | 'EXPIRED' | 'USED';
  remainingTime?: number; // dalam detik
  claimedAt: string;
  expiresAt: string;
}

export interface RedeemRewardRequest {
  code: string;
  cashierId: string;
  storeId: string;
  notes?: string;
}

// Timer Types
export interface TimerData {
  code: string;
  expiresAt: number; // Unix timestamp
  remainingTime: number; // dalam detik
  isExpired: boolean;
}

// Redis Types
export interface RedisTimerData {
  code: string;
  expiresAt: number;
  referralId: string;
  rewardId: string;
}


