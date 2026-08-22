import { Job, User, Application, PaymentSettings, AdminStats } from '../types';
import { generateCanonicalAndMassJobs } from '../data/jobData';

interface LocalStore {
  users: Array<User & { password_hash?: string }>;
  jobs: Job[];
  applications: Application[];
  paymentSettings: PaymentSettings;
}

const LOCAL_STORAGE_KEY = 'adecco_app_local_store_v1';

let memoryStore: LocalStore | null = null;

export const defaultDemoUsers: Array<User & { password_hash?: string }> = [
  {
    id: 'usr_admin_001',
    name: 'Adecco Operations Administrator',
    email: 'admin@adecco.co.ke',
    password_hash: 'admin123',
    role: 'admin',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'usr_applicant_001',
    name: 'Kiplagat Micah',
    email: 'applicant@adecco.co.ke',
    password_hash: 'applicant123',
    role: 'applicant',
    created_at: new Date('2026-02-01T00:00:00Z').toISOString(),
  },
];

export const defaultPaymentSettings: PaymentSettings = {
  id: 1,
  payhero_api_key: 'ph_live_adecco_demo_key_2026',
  payhero_username: 'adecco_agency_ke',
  payhero_channel_id: '782',
  updated_at: new Date().toISOString(),
};

export function getLocalStore(): LocalStore {
  if (memoryStore) {
    return memoryStore;
  }

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as LocalStore;
      if (Array.isArray(parsed.jobs) && parsed.jobs.length > 0) {
        memoryStore = parsed;
        return memoryStore;
      }
    }
  } catch (err) {
    // Continue to initialization
  }

  const initialJobs = generateCanonicalAndMassJobs();
  const initialStore: LocalStore = {
    users: [...defaultDemoUsers],
    jobs: initialJobs,
    applications: [
      {
        id: 'app_demo_001',
        user_id: 'usr_applicant_001',
        job_id: 'job_001',
        passport_number: 'AK9847291',
        current_status: 'paid',
        payment_reference: 'MPESA_QK781920X92',
        phone_number: '0712345678',
        full_name: 'Kiplagat Micah',
        email: 'applicant@adecco.co.ke',
        created_at: new Date('2026-02-10T11:00:00Z').toISOString(),
      },
    ],
    paymentSettings: defaultPaymentSettings,
  };

  memoryStore = initialStore;
  saveLocalStore(initialStore);
  return memoryStore;
}

export function saveLocalStore(store: LocalStore) {
  memoryStore = store;
  try {
    if (typeof window !== 'undefined') {
      // Save lightweight subset if localStorage limit is tight
      const toSave = {
        users: store.users,
        // Save first 300 custom/modified jobs to keep within localStorage limits if needed
        jobs: store.jobs.slice(0, 500),
        applications: store.applications,
        paymentSettings: store.paymentSettings,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
    }
  } catch (e) {
    // Keep in memory
  }
}

export const localDb = {
  getJobs(params?: {
    country?: string;
    region_county?: string;
    category?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const store = getLocalStore();
    let filtered = [...store.jobs];

    if (params?.status) {
      filtered = filtered.filter((j) => j.status === params.status);
    } else {
      filtered = filtered.filter((j) => j.status === 'active');
    }

    if (params?.country && params.country !== 'all') {
      filtered = filtered.filter((j) => j.country.toLowerCase() === params.country?.toLowerCase());
    }

    if (params?.region_county && params.region_county !== 'all') {
      filtered = filtered.filter(
        (j) => j.region_county.toLowerCase() === params.region_county?.toLowerCase()
      );
    }

    if (params?.category && params.category !== 'all') {
      filtered = filtered.filter(
        (j) => j.category.toLowerCase() === params.category?.toLowerCase()
      );
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.country.toLowerCase().includes(q) ||
          j.region_county.toLowerCase().includes(q) ||
          j.category.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q)
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 24;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedJobs = filtered.slice(startIndex, startIndex + limit);

    return {
      jobs: paginatedJobs,
      total,
      page,
      totalPages,
    };
  },

  getJobById(id: string): Job | undefined {
    const store = getLocalStore();
    return store.jobs.find((j) => j.id === id);
  },

  signin(email: string, password: string): { user: User; token: string } {
    const store = getLocalStore();
    const cleanEmail = email.toLowerCase().trim();
    let userRecord = store.users.find((u) => u.email.toLowerCase().trim() === cleanEmail);

    if (!userRecord) {
      // Auto-provision demo applicant if email is valid and password provided
      if (password && password.length >= 4) {
        userRecord = {
          id: `usr_${Date.now()}`,
          name: email.split('@')[0],
          email: cleanEmail,
          password_hash: password,
          role: cleanEmail.includes('admin') ? 'admin' : 'applicant',
          created_at: new Date().toISOString(),
        };
        store.users.push(userRecord);
        saveLocalStore(store);
      } else {
        throw new Error('Invalid email or password');
      }
    }

    const publicUser: User = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      created_at: userRecord.created_at,
    };

    const dummyToken = `local_jwt_${userRecord.id}_${Date.now()}`;
    return { user: publicUser, token: dummyToken };
  },

  register(name: string, email: string, password: string): { user: User; token: string } {
    const store = getLocalStore();
    const cleanEmail = email.toLowerCase().trim();

    if (store.users.some((u) => u.email.toLowerCase().trim() === cleanEmail)) {
      throw new Error('An account with this email already exists');
    }

    const newUser: User & { password_hash?: string } = {
      id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name,
      email: cleanEmail,
      password_hash: password,
      role: cleanEmail.includes('admin') ? 'admin' : 'applicant',
      created_at: new Date().toISOString(),
    };

    store.users.push(newUser);
    saveLocalStore(store);

    const publicUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      created_at: newUser.created_at,
    };

    const token = `local_jwt_${newUser.id}_${Date.now()}`;
    return { user: publicUser, token };
  },

  getUserByToken(token: string): User | null {
    const store = getLocalStore();
    const activeId = localStorage.getItem('adecco_user_id');
    if (activeId) {
      const u = store.users.find((x) => x.id === activeId);
      if (u) return { id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at };
    }
    return defaultDemoUsers[0];
  },

  createApplication(payload: {
    job_id: string;
    passport_number: string;
    phone_number?: string;
    full_name?: string;
    email?: string;
    user_id?: string;
  }): Application {
    const store = getLocalStore();
    const job = store.jobs.find((j) => j.id === payload.job_id);
    const userId = payload.user_id || localStorage.getItem('adecco_user_id') || 'usr_applicant_001';

    const newApp: Application = {
      id: `app_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      job_id: payload.job_id,
      passport_number: payload.passport_number.toUpperCase().trim(),
      current_status: (job && job.fee_amount > 0) ? 'pending_payment' : 'paid',
      payment_reference: (job && job.fee_amount === 0) ? 'FREE_APPLICATION' : null,
      phone_number: payload.phone_number || '',
      full_name: payload.full_name || 'Applicant',
      email: payload.email || '',
      created_at: new Date().toISOString(),
    };

    store.applications.unshift(newApp);
    saveLocalStore(store);
    return newApp;
  },

  getMyApplications(userId?: string): Application[] {
    const store = getLocalStore();
    const uid = userId || localStorage.getItem('adecco_user_id') || 'usr_applicant_001';
    return store.applications.filter((a) => a.user_id === uid);
  },

  getAllApplications(): Application[] {
    const store = getLocalStore();
    return store.applications;
  },

  updateApplicationStatus(id: string, status: any, payment_reference?: string): Application {
    const store = getLocalStore();
    const app = store.applications.find((a) => a.id === id);
    if (!app) throw new Error('Application not found');

    app.current_status = status;
    if (payment_reference) app.payment_reference = payment_reference;
    saveLocalStore(store);
    return app;
  },

  getAdminStats(): AdminStats {
    const store = getLocalStore();
    const activeJobs = store.jobs.filter((j) => j.status === 'active').length;
    const paidApps = store.applications.filter(
      (a) => a.current_status === 'paid' || a.current_status === 'approved'
    );
    const approvedApps = store.applications.filter((a) => a.current_status === 'approved').length;

    const totalRevenue = store.applications.reduce((sum, a) => {
      if (a.current_status === 'paid' || a.current_status === 'approved') {
        const j = store.jobs.find((job) => job.id === a.job_id);
        return sum + (j ? j.fee_amount : 0);
      }
      return sum;
    }, 0);

    return {
      total_users: store.users.length,
      total_jobs: store.jobs.length,
      active_jobs: activeJobs,
      total_applications: store.applications.length,
      paid_applications: paidApps.length,
      approved_applications: approvedApps,
      total_revenue: totalRevenue,
    };
  },
};
