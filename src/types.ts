export type Role = 'applicant' | 'admin';

export type ApplicationStatus = 'pending_payment' | 'paid' | 'under_review' | 'approved' | 'rejected' | 'failed';

export type JobStatus = 'active' | 'closed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface UserWithPassword extends User {
  password_hash: string;
}

export interface Job {
  id: string;
  title: string;
  country: string;
  region_county?: string;
  category: string;
  description: string;
  requirements: string;
  fee_amount: number;
  status: JobStatus;
  created_at: string;
  salary_range?: string;
  positions_available?: number;
}

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  passport_number: string;
  current_status: ApplicationStatus;
  payment_reference?: string | null;
  phone_number?: string;
  full_name?: string;
  email?: string;
  created_at: string;
  
  // Optional relations for UI display
  job?: Job;
  user?: User;
}

export interface Testimonial {
  id: string;
  client_name: string;
  location: string;
  rating: number;
  review_text: string;
  avatar_url?: string;
  is_visible: boolean;
  created_at?: string;
}

export interface GatewayCredentials {
  id: number;
  api_key: string;
  gateway_username: string;
  channel_identifier: string;
  updated_at: string;
}

export interface PaymentSettings {
  id: number;
  payhero_api_key: string;
  payhero_username: string;
  payhero_channel_id: string;
  updated_at: string;
}

export interface StkPushRequest {
  phone_number: string;
  application_id: string;
  amount?: number;
}

export interface StkPushResponse {
  success: boolean;
  message: string;
  checkout_id?: string;
  status?: string;
  reference?: string;
}

export interface AdminStats {
  total_users: number;
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  paid_applications: number;
  approved_applications: number;
  total_revenue: number;
}
