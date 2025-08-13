import { create } from 'zustand';
import { 
  ReferralData, 
  RewardData, 
  ClaimRewardResponse, 
  DemoReferralStats 
} from '@/types';

interface ReferralState {
  // Demo referral data (for Initial Build)
  demoReferralCode: string;
  
  // Current referral
  currentReferral: ReferralData | null;
  
  // Available rewards
  availableRewards: RewardData[];
  
  // Current claim
  currentClaim: ClaimRewardResponse | null;
  
  // Demo statistics
  demoStats: DemoReferralStats | null;
  
  // Loading states
  isLoading: boolean;
  isClaiming: boolean;
  
  // Actions
  setDemoReferralCode: (code: string) => void;
  setCurrentReferral: (referral: ReferralData | null) => void;
  setAvailableRewards: (rewards: RewardData[]) => void;
  setCurrentClaim: (claim: ClaimRewardResponse | null) => void;
  setDemoStats: (stats: DemoReferralStats | null) => void;
  setLoading: (loading: boolean) => void;
  setClaiming: (claiming: boolean) => void;
  
  // Reset state
  reset: () => void;
}

const initialState = {
  demoReferralCode: 'DEMO123',
  currentReferral: null,
  availableRewards: [],
  currentClaim: null,
  demoStats: null,
  isLoading: false,
  isClaiming: false,
};

export const useReferralStore = create<ReferralState>((set) => ({
  ...initialState,
  
  setDemoReferralCode: (code: string) => set({ demoReferralCode: code }),
  
  setCurrentReferral: (referral: ReferralData | null) => set({ currentReferral: referral }),
  
  setAvailableRewards: (rewards: RewardData[]) => set({ availableRewards: rewards }),
  
  setCurrentClaim: (claim: ClaimRewardResponse | null) => set({ currentClaim: claim }),
  
  setDemoStats: (stats: DemoReferralStats | null) => set({ demoStats: stats }),
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setClaiming: (claiming: boolean) => set({ isClaiming: claiming }),
  
  reset: () => set(initialState),
}));



