export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'cashier' | 'admin'
          points: number
          total_referrals: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'cashier' | 'admin'
          points?: number
          total_referrals?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'cashier' | 'admin'
          points?: number
          total_referrals?: number
          created_at?: string
          updated_at?: string
        }
      }
      invites: {
        Row: {
          id: string
          inviter_id: string
          slug: string
          title: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inviter_id: string
          slug: string
          title: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          inviter_id?: string
          slug?: string
          title?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          invite_id: string
          inviter_id: string
          referred_user_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          invite_id: string
          inviter_id: string
          referred_user_id: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          invite_id?: string
          inviter_id?: string
          referred_user_id?: string
          status?: string
          created_at?: string
        }
      }
      ephemeral_codes: {
        Row: {
          id: string
          invite_id: string
          referred_user_id: string
          code_hash: string
          salt: string
          expires_at: string
          used_at: string | null
          used_by: string | null
          status: 'ACTIVE' | 'USED' | 'EXPIRED'
          created_at: string
        }
        Insert: {
          id?: string
          invite_id: string
          referred_user_id: string
          code_hash: string
          salt: string
          expires_at: string
          used_at?: string | null
          used_by?: string | null
          status?: 'ACTIVE' | 'USED' | 'EXPIRED'
          created_at?: string
        }
        Update: {
          id?: string
          invite_id?: string
          referred_user_id?: string
          code_hash?: string
          salt?: string
          expires_at?: string
          used_at?: string | null
          used_by?: string | null
          status?: 'ACTIVE' | 'USED' | 'EXPIRED'
          created_at?: string
        }
      }
      redemptions: {
        Row: {
          id: string
          code_id: string
          inviter_id: string
          referred_user_id: string
          points_awarded: number
          receipt_url: string | null
          redeemed_by: string
          created_at: string
        }
        Insert: {
          id?: string
          code_id: string
          inviter_id: string
          referred_user_id: string
          points_awarded?: number
          receipt_url?: string | null
          redeemed_by: string
          created_at?: string
        }
        Update: {
          id?: string
          code_id?: string
          inviter_id?: string
          referred_user_id?: string
          points_awarded?: number
          receipt_url?: string | null
          redeemed_by?: string
          created_at?: string
        }
      }
      milestones: {
        Row: {
          id: string
          name: string
          description: string | null
          points_required: number
          reward_description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          points_required: number
          reward_description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          points_required?: number
          reward_description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      milestone_awards: {
        Row: {
          id: string
          user_id: string
          milestone_id: string
          status: 'LOCKED' | 'UNLOCKED' | 'CLAIMED'
          unlocked_at: string | null
          claimed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          milestone_id: string
          status?: 'LOCKED' | 'UNLOCKED' | 'CLAIMED'
          unlocked_at?: string | null
          claimed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          milestone_id?: string
          status?: 'LOCKED' | 'UNLOCKED' | 'CLAIMED'
          unlocked_at?: string | null
          claimed_at?: string | null
          created_at?: string
        }
      }
      rate_limits: {
        Row: {
          id: string
          identifier: string
          endpoint: string
          request_count: number
          window_start: string
          created_at: string
        }
        Insert: {
          id?: string
          identifier: string
          endpoint: string
          request_count?: number
          window_start?: string
          created_at?: string
        }
        Update: {
          id?: string
          identifier?: string
          endpoint?: string
          request_count?: number
          window_start?: string
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string | null
          record_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name?: string | null
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          table_name?: string | null
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_points_and_check_milestones: {
        Args: {
          p_user_id: string
          p_points: number
        }
        Returns: Json
      }
      clean_expired_codes: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      check_rate_limit: {
        Args: {
          p_identifier: string
          p_endpoint: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_table_name: string
          p_record_id: string
          p_old_values?: Json
          p_new_values?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      user_role: 'user' | 'cashier' | 'admin'
      code_status: 'ACTIVE' | 'USED' | 'EXPIRED'
      milestone_status: 'LOCKED' | 'UNLOCKED' | 'CLAIMED'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for common operations
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Invite = Database['public']['Tables']['invites']['Row']
export type Referral = Database['public']['Tables']['referrals']['Row']
export type EphemeralCode = Database['public']['Tables']['ephemeral_codes']['Row']
export type Redemption = Database['public']['Tables']['redemptions']['Row']
export type Milestone = Database['public']['Tables']['milestones']['Row']
export type MilestoneAward = Database['public']['Tables']['milestone_awards']['Row']
export type RateLimit = Database['public']['Tables']['rate_limits']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']

export type UserRole = Database['public']['Enums']['user_role']
export type CodeStatus = Database['public']['Enums']['code_status']
export type MilestoneStatus = Database['public']['Enums']['milestone_status']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type InviteInsert = Database['public']['Tables']['invites']['Insert']
export type ReferralInsert = Database['public']['Tables']['referrals']['Insert']
export type EphemeralCodeInsert = Database['public']['Tables']['ephemeral_codes']['Insert']
export type RedemptionInsert = Database['public']['Tables']['redemptions']['Insert']
export type MilestoneInsert = Database['public']['Tables']['milestones']['Insert']
export type MilestoneAwardInsert = Database['public']['Tables']['milestone_awards']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type InviteUpdate = Database['public']['Tables']['invites']['Update']
export type ReferralUpdate = Database['public']['Tables']['referrals']['Update']
export type EphemeralCodeUpdate = Database['public']['Tables']['ephemeral_codes']['Update']
export type RedemptionUpdate = Database['public']['Tables']['redemptions']['Update']
export type MilestoneUpdate = Database['public']['Tables']['milestones']['Update']
export type MilestoneAwardUpdate = Database['public']['Tables']['milestone_awards']['Update']

// Function return types
export type AwardPointsResult = {
  new_total_points: number
  unlocked_milestones: Array<{
    milestone_id: string
    name: string
    description: string | null
    reward: string | null
  }>
}
