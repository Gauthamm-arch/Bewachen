/**
 * Shared TypeScript types for the BEWACHEN app.
 */

export interface UserProfile {
  profile_id: string;
  user_id: string;
  country_of_origin: string;
  country_of_residence: string;
  medical_info: string;
  custom_notes: string;
}

export interface EmergencyContact {
  contact_id: string;
  profile_id: string;
  name: string;
  phone_number: string;
  relationship: string;
}

export interface QRToken {
  token_id: string;
  user_id: string;
  access_hash: string;
  is_active: boolean;
  created_at: string;
}

export interface User {
  user_id: string;
  email: string;
  is_onboarded: boolean;
}
