
export interface User {
  id: string;
  username: string;
  avatar: string;
  // Replaced simple boolean with permissions object
  permissions: StaffPermissions;
  isFounder: boolean; // Hardcoded admins
}

export interface StaffPermissions {
  can_approve_characters?: boolean;
  can_delete_characters?: boolean;
  can_manage_economy?: boolean;
  can_manage_staff?: boolean; // Only founders can give this, or people with this perm
  can_bypass_login?: boolean;
  can_manage_characters?: boolean;
  can_manage_inventory?: boolean;
  can_change_team?: boolean;
  can_manage_illegal?: boolean;
  can_go_onduty?: boolean;
  can_manage_jobs?: boolean;
}

export enum CharacterStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export interface Character {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_place: string;
  age: number;
  status: CharacterStatus;
  created_at: string;
  alignment?: 'legal' | 'illegal';
  job?: 'leo' | 'lafd' | 'ladot' | 'unemployed';
}

export interface Gang {
  id: string;
  name: string;
  leader_id: string;
  co_leader_id?: string;
}

export interface GangMember {
  id: string;
  gang_id: string;
  character_id: string;
  rank: 'leader' | 'co_leader' | 'member';
  status: 'pending' | 'accepted';
}

export interface Bounty {
  id: string;
  creator_id: string;
  target_name: string;
  description: string;
  amount: number;
  status: 'active' | 'completed' | 'cancelled';
  winner_id?: string;
}

export interface QueueEntry {
  user: string;
  status: 'queue' | 'ingame';
  time: string;
}

// Banking Types
export interface BankAccount {
  id: string;
  character_id: string;
  bank_balance: number;
  cash_balance: number;
}

export interface Transaction {
  id: string;
  sender_id: string;
  receiver_id?: string; // Null if ATM interaction
  amount: number;
  type: 'transfer' | 'deposit' | 'withdraw' | 'admin_adjustment';
  created_at: string;
  description?: string;
}