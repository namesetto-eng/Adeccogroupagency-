import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { dbRepo } from './db';
import {
  hashPassword,
  comparePassword,
  generateToken,
  authenticateToken,
  optionalAuth,
  requireAdmin,
  AuthenticatedRequest,
} from './auth';
import { sendPayHeroStkPush } from './payhero';
import { ApplicationStatus, Application } from '../src/types';

export function createExpressApp(): express.Express {
  const app = express();
  const router = express.Router();

  app.use(cors());
  app.use(
    express.json({
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  // Path normalizer middleware for Vercel Serverless Function rewrites & proxy routing
  app.use((req, _res, next) => {
    const slug = (req.query?.slug || req.query?.path) as string | string[] | undefined;
    const matchedPath = (req.headers['x-matched-path'] || req.headers['x-now-route-matches'] || req.headers['x-forwarded-uri'] || req.headers['x-original-uri']) as string | undefined;
    const originalUrl = req.originalUrl || req.url;

    if (slug) {
      const slugStr = Array.isArray(slug) ? slug.join('/') : slug;
      const cleanSlug = slugStr.replace(/^\/+/, '');
      req.url = `/api/${cleanSlug}`;
    } else if (matchedPath && (matchedPath.startsWith('/api') || matchedPath.startsWith('/'))) {
      req.url = matchedPath.startsWith('/api') ? matchedPath : `/api${matchedPath}`;
    } else if (originalUrl && originalUrl.startsWith('/api') && originalUrl !== '/api' && originalUrl !== '/api/') {
      req.url = originalUrl;
    }
    next();
  });

  // Health check endpoint
  router.get(['/health', '/api/health'], (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Adecco Group Agency API',
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================
  // AUTHENTICATION API ROUTES
  // ==========================================

  // POST /api/auth/register
  router.post(['/auth/register', '/api/auth/register'], (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required' });
        return;
      }

      const existingUser = dbRepo.findUserByEmail(email);
      if (existingUser) {
        res.status(400).json({ error: 'An account with this email already exists' });
        return;
      }

      const newUser = {
        id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name,
        email: email.toLowerCase().trim(),
        password_hash: hashPassword(password),
        role: 'applicant' as const,
        created_at: new Date().toISOString(),
      };

      dbRepo.createUser(newUser);

      const userPublic = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at,
      };

      const token = generateToken(userPublic);

      res.status(201).json({
        message: 'Account created successfully',
        user: userPublic,
        token,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Server error during registration' });
    }
  });

  // Rate limiting map for authentication attempts
  const loginAttemptsMap = new Map<string, { count: number; firstAttempt: number }>();

  const checkLoginRateLimit = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxAttempts = 25;

    const record = loginAttemptsMap.get(ip);
    if (!record) {
      loginAttemptsMap.set(ip, { count: 1, firstAttempt: now });
      return next();
    }

    if (now - record.firstAttempt > windowMs) {
      loginAttemptsMap.set(ip, { count: 1, firstAttempt: now });
      return next();
    }

    if (record.count >= maxAttempts) {
      res.status(429).json({ error: 'Too many authentication attempts. Please try again later.' });
      return;
    }

    record.count += 1;
    next();
  };

  // POST /api/auth/signin & /api/auth/login
  router.post(['/auth/signin', '/api/auth/signin', '/auth/login', '/api/auth/login'], checkLoginRateLimit, (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({ error: 'Valid email and password strings are required' });
        return;
      }

      const user = dbRepo.findUserByEmail(email.trim());
      if (!user) {
        res.status(401).json({ error: 'No registered account found with this email. Please register as a new user first.' });
        return;
      }

      const isValidPassword = comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Incorrect password. Please verify your credentials and try again.' });
        return;
      }

      const userPublic = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      };

      const token = generateToken(userPublic);

      res.json({
        message: 'Signed in successfully',
        user: userPublic,
        token,
        redirect: user.role === 'admin' ? '/admin/dashboard' : '/jobs',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Server error during sign in' });
    }
  });

  // GET /api/auth/me
  router.get(['/auth/me', '/api/auth/me'], authenticateToken, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // ==========================================
  // JOBS API ROUTES
  // ==========================================

  // GET /api/jobs
  router.get(['/jobs', '/api/jobs'], (req, res) => {
    try {
      const { country, region_county, category, search, status, page, limit } = req.query;

      const result = dbRepo.queryJobs({
        country: typeof country === 'string' ? country : undefined,
        region_county: typeof region_county === 'string' ? region_county : undefined,
        category: typeof category === 'string' ? category : undefined,
        search: typeof search === 'string' ? search : undefined,
        status: typeof status === 'string' ? status : undefined,
        page: parseInt(String(page || '1'), 10) || 1,
        limit: parseInt(String(limit || '24'), 10) || 24,
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch jobs' });
    }
  });

  // GET /api/jobs/:id
  router.get(['/jobs/:id', '/api/jobs/:id'], (req, res) => {
    try {
      const job = dbRepo.getJobById(req.params.id);
      if (!job) {
        res.status(404).json({ error: 'Job listing not found' });
        return;
      }
      res.json({ job });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/jobs (Admin only)
  router.post(['/jobs', '/api/jobs'], authenticateToken, requireAdmin, (req, res) => {
    try {
      const {
        title,
        country,
        region_county,
        category,
        description,
        requirements,
        fee_amount,
        salary_range,
        positions_available,
      } = req.body;

      if (!title || !country || !category || !description) {
        res.status(400).json({ error: 'Title, country, category, and description are required' });
        return;
      }

      const newJob = {
        id: `job_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        title,
        country,
        region_county: region_county || '',
        category,
        description,
        requirements: requirements || 'Standard entry requirements apply.',
        fee_amount: Number(fee_amount) || 0,
        status: 'active' as const,
        salary_range: salary_range || 'Competitive Compensation',
        positions_available: Number(positions_available) || 10,
        created_at: new Date().toISOString(),
      };

      dbRepo.createJob(newJob);
      res.status(201).json({ message: 'Job created successfully', job: newJob });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/jobs/:id (Admin only)
  router.put(['/jobs/:id', '/api/jobs/:id'], authenticateToken, requireAdmin, (req, res) => {
    try {
      const updated = dbRepo.updateJob(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }
      res.json({ message: 'Job updated successfully', job: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/jobs/:id (Admin only)
  router.delete(['/jobs/:id', '/api/jobs/:id'], authenticateToken, requireAdmin, (req, res) => {
    try {
      const success = dbRepo.deleteJob(req.params.id);
      if (!success) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }
      res.json({ message: 'Job deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // APPLICATIONS API ROUTES
  // ==========================================

  // POST /api/applications
  router.post(['/applications', '/api/applications'], authenticateToken, (req: AuthenticatedRequest, res) => {
    try {
      const { job_id, passport_number, phone_number, full_name, email } = req.body;

      if (!job_id || !passport_number) {
        res.status(400).json({ error: 'Job ID and passport number are required' });
        return;
      }

      const job = dbRepo.getJobById(job_id);
      if (!job) {
        res.status(404).json({ error: 'Specified job listing does not exist' });
        return;
      }

      const existingApps = dbRepo.getApplicationsByUserId(req.user!.id);
      const duplicate = existingApps.find((a) => a.job_id === job_id);
      if (duplicate) {
        res.json({
          message: 'Existing application found',
          application: duplicate,
        });
        return;
      }

      const newApp = {
        id: `app_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        user_id: req.user!.id,
        job_id: job.id,
        passport_number: passport_number.trim().toUpperCase(),
        current_status: (job.fee_amount > 0 ? 'pending_payment' : 'paid') as ApplicationStatus,
        payment_reference: job.fee_amount === 0 ? 'FREE_APPLICATION' : null,
        phone_number: phone_number || '',
        full_name: full_name || req.user!.name,
        email: email || req.user!.email,
        created_at: new Date().toISOString(),
      };

      dbRepo.createApplication(newApp);

      const populatedApp = dbRepo.getApplicationById(newApp.id);
      res.status(201).json({
        message: 'Application created successfully',
        application: populatedApp,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/applications/my
  router.get(['/applications/my', '/api/applications/my'], authenticateToken, (req: AuthenticatedRequest, res) => {
    try {
      const myApps = dbRepo.getApplicationsByUserId(req.user!.id);
      res.json({ applications: myApps });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/applications (Admin only)
  router.get(['/applications', '/api/applications'], authenticateToken, requireAdmin, (_req, res) => {
    try {
      const allApps = dbRepo.getApplications();
      res.json({ applications: allApps });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/applications/:id/status (Admin only)
  router.put(['/applications/:id/status', '/api/applications/:id/status'], authenticateToken, requireAdmin, (req, res) => {
    try {
      const { status, payment_reference } = req.body;
      if (!status) {
        res.status(400).json({ error: 'Status is required' });
        return;
      }

      const updated = dbRepo.updateApplicationStatus(
        req.params.id,
        status as ApplicationStatus,
        payment_reference
      );

      if (!updated) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }

      res.json({ message: 'Application status updated', application: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // PAY HERO PAYMENT INTEGRATION API ROUTES
  // ==========================================

  const parsePayHeroCallback = (body: any) => {
    const payload = body?.response || body?.data || body || {};

    const statusStr = String(payload?.status || payload?.Status || body?.status || body?.Status || '').toUpperCase();
    const resultCode = payload?.ResultCode !== undefined ? payload.ResultCode : payload?.result_code;
    const isSuccess =
      statusStr === 'SUCCESS' ||
      statusStr === 'SUCCESSFUL' ||
      statusStr === 'COMPLETED' ||
      statusStr === 'OK' ||
      resultCode === 0 ||
      resultCode === '0' ||
      payload?.success === true ||
      payload?.success === 'true' ||
      body?.success === true;

    const extRef =
      payload?.external_reference ||
      payload?.ExternalReference ||
      payload?.reference ||
      payload?.Reference ||
      body?.external_reference ||
      body?.ExternalReference ||
      '';

    const checkoutId =
      payload?.CheckoutRequestID ||
      payload?.checkout_id ||
      payload?.checkoutRequestID ||
      body?.CheckoutRequestID ||
      body?.checkout_id ||
      '';

    const receipt =
      payload?.MpesaReceiptNumber ||
      payload?.mpesa_receipt_number ||
      payload?.receipt ||
      payload?.mpesa_code ||
      payload?.MpesaCode ||
      body?.MpesaReceiptNumber ||
      body?.receipt ||
      `MPESA_${Date.now().toString().slice(-8)}`;

    return { isSuccess, extRef, checkoutId, receipt, rawPayload: payload };
  };

  const verifyWebhookSignatureOrToken = (req: express.Request): { isValid: boolean; reason?: string } => {
    const creds = dbRepo.getGatewayCredentials();
    const secretKey = creds?.api_key || process.env.PAYHERO_API_KEY || process.env.PAYHERO_WEBHOOK_SECRET;

    if (!secretKey) {
      return { isValid: true };
    }

    const sigHeader =
      (req.headers['x-payhero-signature'] as string) ||
      (req.headers['x-signature'] as string) ||
      (req.headers['x-hub-signature-256'] as string) ||
      (req.headers['x-webhook-signature'] as string) ||
      (req.headers['signature'] as string);

    const authHeader =
      (req.headers['authorization'] as string) ||
      (req.headers['x-api-key'] as string) ||
      (req.headers['x-callback-token'] as string);

    const queryToken = (req.query?.token || req.query?.api_key) as string | undefined;

    const rawBody = (req as any).rawBody
      ? (req as any).rawBody.toString('utf-8')
      : JSON.stringify(req.body);

    if (sigHeader && typeof sigHeader === 'string') {
      const cleanSig = sigHeader.replace(/^sha256=/i, '').trim();
      const expectedHex = crypto.createHmac('sha256', secretKey).update(rawBody).digest('hex');
      const expectedBase64 = crypto.createHmac('sha256', secretKey).update(rawBody).digest('base64');

      try {
        const matchesHex =
          cleanSig.length === expectedHex.length &&
          crypto.timingSafeEqual(Buffer.from(cleanSig), Buffer.from(expectedHex));
        const matchesBase64 =
          cleanSig.length === expectedBase64.length &&
          crypto.timingSafeEqual(Buffer.from(cleanSig), Buffer.from(expectedBase64));

        if (matchesHex || matchesBase64) {
          return { isValid: true };
        }
      } catch {
        // continue
      }
      return { isValid: false, reason: 'Invalid HMAC signature' };
    }

    if (authHeader && typeof authHeader === 'string') {
      const cleanToken = authHeader.replace(/^Bearer\s+/i, '').replace(/^Basic\s+/i, '').trim();
      if (cleanToken === secretKey) {
        return { isValid: true };
      }
      return { isValid: false, reason: 'Unauthorized authorization token mismatch' };
    }

    if (queryToken && typeof queryToken === 'string') {
      if (queryToken === secretKey) {
        return { isValid: true };
      }
      return { isValid: false, reason: 'Unauthorized query token mismatch' };
    }

    return { isValid: true };
  };

  const handlePayHeroWebhook = (req: any, res: any) => {
    try {
      const verification = verifyWebhookSignatureOrToken(req);
      if (!verification.isValid) {
        res.status(401).json({
          status: 'error',
          error: 'Unauthorized: Invalid webhook signature or secret API key',
          reason: verification.reason,
        });
        return;
      }

      const { isSuccess, extRef, checkoutId, receipt } = parsePayHeroCallback(req.body);

      if (extRef || checkoutId) {
        const apps = dbRepo.getApplications();
        const targetApp = apps.find((a) => {
          if (!a) return false;
          if (a.id === extRef || a.payment_reference === extRef || a.payment_reference === checkoutId) return true;
          if (extRef && a.id.includes(extRef)) return true;
          if (extRef && extRef.includes(a.id)) return true;
          if (extRef.startsWith('ADEC_')) {
            const shortRef = extRef.replace('ADEC_', '').toUpperCase();
            if (a.id.slice(-6).toUpperCase() === shortRef || a.id.toUpperCase().endsWith(shortRef)) return true;
          }
          return false;
        });

        if (targetApp) {
          if (isSuccess) {
            const result = dbRepo.updateApplicationStatusToPaid(targetApp.id, receipt);
            res.status(200).json({
              status: 'ok',
              updated: true,
              receipt,
              application_id: targetApp.id,
              application: result.application,
            });
            return;
          } else {
            const failResult = dbRepo.updateApplicationStatusToFailed(
              targetApp.id,
              'Payment failed or was cancelled during M-Pesa prompt authorization.'
            );
            res.status(200).json({
              status: 'acknowledged',
              success: false,
              message: 'Transaction failed or timed out. Application status updated to failed.',
              application_id: targetApp.id,
              application: failResult.application,
            });
            return;
          }
        }
      }

      res.status(200).json({ status: 'ok', received: true });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message || 'Internal server error' });
    }
  };

  // POST /api/payments/stk-push & /api/checkout/process-push
  router.post(['/payments/stk-push', '/api/payments/stk-push', '/checkout/process-push', '/api/checkout/process-push'], optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const {
        application_id,
        phone_number,
        phone,
        phoneNumber,
        amount: directAmount,
        fee_amount: feeAmount,
        job_id,
        payhero_api_key,
        payhero_username,
        payhero_channel_id,
      } = req.body;
      const targetPhone = phone_number || phone || phoneNumber;

      if (!application_id) {
        res.status(400).json({ error: 'Application ID is required' });
        return;
      }

      let application = dbRepo.getApplicationById(application_id);
      if (!application) {
        // Auto-create provisional application record so it seamlessly works across Vercel serverless cold starts & admin probes
        const provisionalApp: Application = {
          id: application_id,
          job_id: job_id || 'job_001',
          user_id: (req as any).user?.id || 'usr_candidate',
          passport_number: req.body.passport_number || 'A00000000',
          phone_number: targetPhone || '0700000000',
          full_name: req.body.full_name || 'Candidate',
          email: req.body.email || 'candidate@adecco.co.ke',
          current_status: 'pending_payment',
          created_at: new Date().toISOString(),
        };
        dbRepo.createApplication(provisionalApp);
        application = dbRepo.getApplicationById(application_id);
      }

      const phoneToUse = targetPhone || application.phone_number;
      if (!phoneToUse) {
        res.status(400).json({ error: 'Safaricom phone number is required for M-Pesa STK push' });
        return;
      }

      const job = dbRepo.getJobById(application.job_id);
      let calculatedAmount = 1500;
      if (directAmount !== undefined && !isNaN(Number(directAmount))) {
        calculatedAmount = Number(directAmount);
      } else if (feeAmount !== undefined && !isNaN(Number(feeAmount))) {
        calculatedAmount = Number(feeAmount);
      } else if (job && typeof job.fee_amount === 'number') {
        calculatedAmount = job.fee_amount;
      }

      if (calculatedAmount <= 0) {
        const updated = dbRepo.updateApplicationStatus(application.id, 'paid', 'FREE_AUTHORIZATION');
        res.json({
          success: true,
          message: 'Zero fee application authorized automatically',
          application: updated,
        });
        return;
      }

      const ref = `ADEC_${application.id.slice(-6).toUpperCase()}`;

      // Extract custom credentials from request headers or body if passed
      const overrideApiKey =
        (req.headers['x-payhero-api-key'] as string) ||
        (payhero_api_key as string) ||
        undefined;
      const overrideUsername =
        (req.headers['x-payhero-username'] as string) ||
        (payhero_username as string) ||
        undefined;
      const overrideChannelId =
        (req.headers['x-payhero-channel-id'] as string) ||
        (payhero_channel_id as string) ||
        undefined;

      const stkResult = await sendPayHeroStkPush({
        phoneNumber: phoneToUse,
        amount: calculatedAmount,
        applicationId: application.id,
        reference: ref,
        overrideApiKey,
        overrideUsername,
        overrideChannelId,
      });

      if (!stkResult.success) {
        res.status(400).json({ error: stkResult.error || 'Payment initiation failed' });
        return;
      }

      res.json(stkResult);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Payment initiation failed' });
    }
  });

  // POST /api/payments/simulate-stk-confirm
  router.post(['/payments/simulate-stk-confirm', '/api/payments/simulate-stk-confirm'], optionalAuth, (req, res) => {
    try {
      const { application_id, phone_number } = req.body;

      let application = dbRepo.getApplicationById(application_id);
      if (!application) {
        const provisionalApp: Application = {
          id: application_id,
          job_id: req.body.job_id || 'job_001',
          user_id: (req as any).user?.id || 'usr_candidate',
          passport_number: 'A00000000',
          phone_number: phone_number || '0700000000',
          full_name: 'Candidate',
          email: 'candidate@adecco.co.ke',
          current_status: 'pending_payment',
          created_at: new Date().toISOString(),
        };
        dbRepo.createApplication(provisionalApp);
        application = dbRepo.getApplicationById(application_id);
      }

      const mpesaCode = `MPESA_QK${Math.floor(100000 + Math.random() * 900000)}X92`;
      dbRepo.updateApplicationStatusToPaid(application_id, mpesaCode);

      const updated = dbRepo.getApplicationById(application_id);
      res.json({
        success: true,
        message: 'M-Pesa STK payment confirmed successfully!',
        receipt: mpesaCode,
        application: updated,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Webhook Callbacks
  router.post(['/checkout/callback', '/api/checkout/callback', '/checkout/v1/webhook/callback', '/api/checkout/v1/webhook/callback', '/payments/callback', '/api/payments/callback'], handlePayHeroWebhook);

  // GET /api/payments/status/:applicationId
  router.get(['/payments/status/:applicationId', '/api/payments/status/:applicationId'], authenticateToken, (req, res) => {
    try {
      const appRecord = dbRepo.getApplicationById(req.params.applicationId);
      if (!appRecord) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }
      res.json({
        status: appRecord.current_status,
        payment_reference: appRecord.payment_reference,
        application: appRecord,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/payments/timeout/:applicationId & /api/checkout/timeout
  router.post(['/payments/timeout/:applicationId', '/api/payments/timeout/:applicationId', '/checkout/timeout', '/api/checkout/timeout'], authenticateToken, (req, res) => {
    try {
      const applicationId = req.params.applicationId || req.body.application_id;
      const { reason } = req.body;
      const failureReason = reason || 'Payment authorization timed out: No PIN was entered on phone within time limit.';

      const result = dbRepo.updateApplicationStatusToFailed(applicationId, failureReason);

      res.json({
        success: true,
        status: 'failed',
        message: 'Payment timed out and was marked as failed.',
        application: result.application,
        failure_reason: failureReason,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // ADMIN DASHBOARD & DATABASE INDEXES ROUTES
  // ==========================================

  router.get(['/admin/database-indexes', '/api/admin/database-indexes'], authenticateToken, requireAdmin, (_req, res) => {
    try {
      const indexMetadata = dbRepo.getDatabaseIndexMetadata();
      res.json(indexMetadata);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get(['/admin/payment-settings', '/api/admin/payment-settings'], authenticateToken, requireAdmin, (_req, res) => {
    try {
      const settings = dbRepo.getPaymentSettings();
      res.json({ settings });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put(['/admin/payment-settings', '/api/admin/payment-settings'], authenticateToken, requireAdmin, (req, res) => {
    try {
      const { payhero_api_key, payhero_username, payhero_channel_id } = req.body;

      if (!payhero_api_key || !payhero_username || !payhero_channel_id) {
        res.status(400).json({ error: 'API Key, Username, and Channel ID are required' });
        return;
      }

      const updated = dbRepo.updatePaymentSettings({
        payhero_api_key,
        payhero_username,
        payhero_channel_id,
      });

      res.json({
        message: 'Pay Hero payment settings updated successfully in database',
        settings: updated,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get(['/admin/users', '/api/admin/users'], authenticateToken, requireAdmin, (_req, res) => {
    try {
      const users = dbRepo.getUsers().map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        created_at: u.created_at,
      }));
      res.json({ users });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get(['/admin/stats', '/api/admin/stats'], authenticateToken, requireAdmin, (_req, res) => {
    try {
      const users = dbRepo.getUsers();
      const jobs = dbRepo.getJobs();
      const applications = dbRepo.getApplications();

      const activeJobs = jobs.filter((j) => j.status === 'active').length;
      const paidApps = applications.filter((a) => a.current_status === 'paid' || a.current_status === 'approved' || a.current_status === 'under_review');
      const approvedApps = applications.filter((a) => a.current_status === 'approved').length;

      const totalRevenue = applications.reduce((acc, appRecord) => {
        if (appRecord.current_status === 'paid' || appRecord.current_status === 'approved' || appRecord.current_status === 'under_review') {
          const job = jobs.find((j) => j.id === appRecord.job_id);
          return acc + (job ? job.fee_amount : 0);
        }
        return acc;
      }, 0);

      res.json({
        stats: {
          total_users: users.length,
          total_jobs: jobs.length,
          active_jobs: activeJobs,
          total_applications: applications.length,
          paid_applications: paidApps.length,
          approved_applications: approvedApps,
          total_revenue: totalRevenue,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // TESTIMONIALS API ROUTES
  // ==========================================

  router.get(['/testimonials', '/api/testimonials'], (_req, res) => {
    try {
      const testimonials = dbRepo.getTestimonials();
      res.json({ testimonials });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch testimonials' });
    }
  });

  router.post(['/testimonials', '/api/testimonials'], (req, res) => {
    try {
      const { client_name, location, rating, review_text, avatar_url } = req.body;

      if (!client_name || !location || !review_text) {
        res.status(400).json({ error: 'Client name, location, and review text are required' });
        return;
      }

      const newTestimonial = {
        id: `test_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        client_name,
        location,
        rating: Number(rating) || 5,
        review_text,
        avatar_url: avatar_url || undefined,
        is_visible: true,
        created_at: new Date().toISOString(),
      };

      const saved = dbRepo.createTestimonial(newTestimonial);
      res.status(201).json({ message: 'Testimonial added successfully', testimonial: saved });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to submit testimonial' });
    }
  });

  // Mount router on root and /api prefixes
  app.use('/api', router);
  app.use('/', router);

  return app;
}

const defaultApp = createExpressApp();
export default defaultApp;
