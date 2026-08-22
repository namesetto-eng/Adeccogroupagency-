import {
  User,
  Job,
  Application,
  PaymentSettings,
  AdminStats,
  StkPushResponse,
} from '../types';

const API_BASE = ''; // Relative path handled by Express server / Vercel API rewrite

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('adecco_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status} (${res.statusText || 'Error'})`);
    }
    throw new Error('Invalid JSON payload returned from API');
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async register(name: string, email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse<{ message: string; user: User; token: string }>(res);
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{ message: string; user: User; token: string; redirect?: string }>(res);
  },

  async signin(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{ message: string; user: User; token: string; redirect?: string }>(res);
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getHeaders(),
    });
    const data = await handleResponse<{ user: User }>(res);
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
    const data = await handleResponse<any>(res);
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
    const data = await handleResponse<{ job: Job }>(res);
    return data.job;
  },

  async createJob(jobData: Partial<Job>): Promise<Job> {
    const res = await fetch(`${API_BASE}/api/jobs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(jobData),
    });
    const data = await handleResponse<{ job: Job }>(res);
    return data.job;
  },

  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await handleResponse<{ job: Job }>(res);
    return data.job;
  },

  async deleteJob(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse<{ message: string }>(res);
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
    const data = await handleResponse<{ application: Application }>(res);
    return data.application;
  },

  async getMyApplications(): Promise<Application[]> {
    const res = await fetch(`${API_BASE}/api/applications/my`, {
      headers: getHeaders(),
    });
    const data = await handleResponse<any>(res);
    return Array.isArray(data.applications) ? data.applications : (Array.isArray(data) ? data : []);
  },

  async getAllApplications(): Promise<Application[]> {
    const res = await fetch(`${API_BASE}/api/applications`, {
      headers: getHeaders(),
    });
    const data = await handleResponse<any>(res);
    return Array.isArray(data.applications) ? data.applications : (Array.isArray(data) ? data : []);
  },

  async updateApplicationStatus(id: string, status: string, payment_reference?: string): Promise<Application> {
    const res = await fetch(`${API_BASE}/api/applications/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, payment_reference }),
    });
    const data = await handleResponse<{ application: Application }>(res);
    return data.application;
  },

  // Pay Hero Payments
  async sendStkPush(application_id: string, phone_number: string): Promise<StkPushResponse> {
    const res = await fetch(`${API_BASE}/api/payments/stk-push`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ application_id, phone_number }),
    });
    return handleResponse<StkPushResponse>(res);
  },

  async simulateStkConfirm(application_id: string, phone_number: string) {
    const res = await fetch(`${API_BASE}/api/payments/simulate-stk-confirm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ application_id, phone_number }),
    });
    return handleResponse<any>(res);
  },

  async getPaymentStatus(applicationId: string) {
    const res = await fetch(`${API_BASE}/api/payments/status/${applicationId}`, {
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async markPaymentTimeout(applicationId: string, reason?: string) {
    const res = await fetch(`${API_BASE}/api/payments/timeout/${applicationId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse<any>(res);
  },

  // Admin
  async getPaymentSettings(): Promise<PaymentSettings> {
    const res = await fetch(`${API_BASE}/api/admin/payment-settings`, {
      headers: getHeaders(),
    });
    const data = await handleResponse<{ settings: PaymentSettings }>(res);
    return data.settings;
  },

  async getDatabaseIndexes(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/database-indexes`, {
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async updatePaymentSettings(settings: Partial<PaymentSettings>): Promise<PaymentSettings> {
    const res = await fetch(`${API_BASE}/api/admin/payment-settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settings),
    });
    const data = await handleResponse<{ settings: PaymentSettings }>(res);
    return data.settings;
  },

  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_BASE}/api/admin/stats`, {
      headers: getHeaders(),
    });
    const data = await handleResponse<{ stats: AdminStats }>(res);
    return data.stats;
  },
};
