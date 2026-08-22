import {
  User,
  Job,
  Application,
  PaymentSettings,
  AdminStats,
  StkPushResponse,
} from '../types';

const API_BASE = ''; // Relative path because Express serves Vite frontend

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('adecco_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Auth
  async register(name: string, email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async signin(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Sign in failed');
    return data;
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch user');
    return data.user;
  },

  // Jobs
  async getJobs(params?: {
    country?: string;
    region_county?: string;
    category?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ jobs: Job[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params?.country) query.append('country', params.country);
    if (params?.region_county) query.append('region_county', params.region_county);
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/api/jobs?${query.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load jobs');
    const jobsList = Array.isArray(data.jobs) ? data.jobs : (Array.isArray(data) ? data : []);
    return {
      jobs: jobsList,
      total: data.total || jobsList.length,
      page: data.page || 1,
      totalPages: data.totalPages || 1,
    };
  },

  async getJobById(id: string): Promise<Job> {
    const res = await fetch(`${API_BASE}/api/jobs/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Job not found');
    return data.job;
  },

  async createJob(jobData: Partial<Job>): Promise<Job> {
    const res = await fetch(`${API_BASE}/api/jobs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(jobData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create job');
    return data.job;
  },

  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update job');
    return data.job;
  },

  async deleteJob(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete job');
    return true;
  },

  // Applications
  async createApplication(payload: {
    job_id: string;
    passport_number: string;
    phone_number?: string;
    full_name?: string;
    email?: string;
  }): Promise<Application> {
    const res = await fetch(`${API_BASE}/api/applications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit application');
    return data.application;
  },

  async getMyApplications(): Promise<Application[]> {
    const res = await fetch(`${API_BASE}/api/applications/my`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load my applications');
    return Array.isArray(data.applications) ? data.applications : (Array.isArray(data) ? data : []);
  },

  async getAllApplications(): Promise<Application[]> {
    const res = await fetch(`${API_BASE}/api/applications`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load all applications');
    return Array.isArray(data.applications) ? data.applications : (Array.isArray(data) ? data : []);
  },

  async updateApplicationStatus(id: string, status: string, payment_reference?: string): Promise<Application> {
    const res = await fetch(`${API_BASE}/api/applications/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, payment_reference }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update application status');
    return data.application;
  },

  // Pay Hero Payments
  async sendStkPush(application_id: string, phone_number: string): Promise<StkPushResponse> {
    const res = await fetch(`${API_BASE}/api/payments/stk-push`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ application_id, phone_number }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Payment request failed');
    return data;
  },

  async simulateStkConfirm(application_id: string, phone_number: string) {
    const res = await fetch(`${API_BASE}/api/payments/simulate-stk-confirm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ application_id, phone_number }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Payment simulation failed');
    return data;
  },

  async getPaymentStatus(applicationId: string) {
    const res = await fetch(`${API_BASE}/api/payments/status/${applicationId}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to check status');
    return data;
  },

  async markPaymentTimeout(applicationId: string, reason?: string) {
    const res = await fetch(`${API_BASE}/api/payments/timeout/${applicationId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update timeout status');
    return data;
  },

  // Admin
  async getPaymentSettings(): Promise<PaymentSettings> {
    const res = await fetch(`${API_BASE}/api/admin/payment-settings`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load payment settings');
    return data.settings;
  },

  async getDatabaseIndexes(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/database-indexes`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load database index metadata');
    return data;
  },

  async updatePaymentSettings(settings: Partial<PaymentSettings>): Promise<PaymentSettings> {
    const res = await fetch(`${API_BASE}/api/admin/payment-settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update payment settings');
    return data.settings;
  },

  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_BASE}/api/admin/stats`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load stats');
    return data.stats;
  },
};
