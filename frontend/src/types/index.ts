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

// Claim Types
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

// Cashier Types
export interface VerifyCodeResponse {
  code: string;
  reward: RewardData;
  status: 'VALID' | 'INVALID' | 'EXPIRED' | 'USED';
  remainingTime?: number;
  claimedAt: string;
  expiresAt: string;
}

export interface PointsResponse {
  inviterId: string;
  points: number;
  nextMilestone?: number;
  pointsToNext?: number;
}

// Timer Types
export interface TimerData {
  code: string;
  expiresAt: number;
  remainingTime: number;
  isExpired: boolean;
}

// Demo Stats Types
export interface DemoReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalPoints: number;
  pointsThisMonth: number;
  conversionRate: number;
}


