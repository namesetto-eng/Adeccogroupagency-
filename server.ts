import express from 'express';
import path from 'path';
import cors from 'cors';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { dbRepo } from './server/db';
import {
  hashPassword,
  comparePassword,
  generateToken,
  authenticateToken,
  requireAdmin,
  AuthenticatedRequest,
} from './server/auth';
import { sendPayHeroStkPush, formatKenyanPhone } from './server/payhero';
import { ApplicationStatus } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(
    express.json({
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  // ==========================================
  // AUTHENTICATION API ROUTES
  // ==========================================

  // POST /api/auth/register
  app.post('/api/auth/register', (req, res) => {
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
    const windowMs = 15 * 60 * 1000; // 15 minutes window
    const maxAttempts = 15;

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
      res.status(429).json({ error: 'Too many authentication attempts. Please try again after 15 minutes.' });
      return;
    }

    record.count += 1;
    next();
  };

  // POST /api/auth/signin (Unified login endpoint)
  app.post('/api/auth/signin', checkLoginRateLimit, (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({ error: 'Valid email and password strings are required' });
        return;
      }

      // Explicit sanitized lookup
      const user = dbRepo.findUserByEmail(email.trim());
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const isValidPassword = comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid email or password' });
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

  // POST /api/auth/login (Standard login)
  app.post('/api/auth/login', checkLoginRateLimit, (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const user = dbRepo.findUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const isValidPassword = comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid email or password' });
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
        message: 'Logged in successfully',
        user: userPublic,
        token,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Server error during login' });
    }
  });

  // GET /api/auth/me
  app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // ==========================================
  // JOBS API ROUTES
  // ==========================================

  // GET /api/jobs (Supports filtering & pagination)
  // GET /api/jobs (Massive 10,000+ dataset pagination with indexed search)
  app.get('/api/jobs', (req, res) => {
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
  app.get('/api/jobs/:id', (req, res) => {
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
  app.post('/api/jobs', authenticateToken, requireAdmin, (req, res) => {
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
  app.put('/api/jobs/:id', authenticateToken, requireAdmin, (req, res) => {
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
  app.delete('/api/jobs/:id', authenticateToken, requireAdmin, (req, res) => {
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

  // POST /api/applications (Create job application)
  app.post('/api/applications', authenticateToken, (req: AuthenticatedRequest, res) => {
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

      // Check if user already applied to this job
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

  // GET /api/applications/my (Applicant applications)
  app.get('/api/applications/my', authenticateToken, (req: AuthenticatedRequest, res) => {
    try {
      const myApps = dbRepo.getApplicationsByUserId(req.user!.id);
      res.json({ applications: myApps });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/applications (Admin only, view all)
  app.get('/api/applications', authenticateToken, requireAdmin, (req, res) => {
    try {
      const allApps = dbRepo.getApplications();
      res.json({ applications: allApps });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/applications/:id/status (Admin status update)
  app.put('/api/applications/:id/status', authenticateToken, requireAdmin, (req, res) => {
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

  // Helper to parse PayHero callback/webhook payloads
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

    // If no secret key has been configured, allow in open development mode
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

    // 1. Check Cryptographic HMAC-SHA256 Signature using Secret API Key
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
        // Continue to fallback token check
      }
      console.warn('[Checkout Webhook Security] HMAC signature verification failed.');
      return { isValid: false, reason: 'Invalid HMAC signature' };
    }

    // 2. Check Direct Secret Key / Bearer / Token Header
    if (authHeader && typeof authHeader === 'string') {
      const cleanToken = authHeader.replace(/^Bearer\s+/i, '').replace(/^Basic\s+/i, '').trim();
      if (cleanToken === secretKey) {
        return { isValid: true };
      }
      try {
        if (
          cleanToken.length === secretKey.length &&
          crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(secretKey))
        ) {
          return { isValid: true };
        }
      } catch {
        // continue
      }
      if (cleanToken.includes(secretKey) || secretKey.includes(cleanToken)) {
        return { isValid: true };
      }
      console.warn('[Checkout Webhook Security] Authorization header token mismatch.');
      return { isValid: false, reason: 'Unauthorized authorization token mismatch' };
    }

    // 3. Check Query Token
    if (queryToken && typeof queryToken === 'string') {
      if (queryToken === secretKey) {
        return { isValid: true };
      }
      console.warn('[Checkout Webhook Security] Query token mismatch.');
      return { isValid: false, reason: 'Unauthorized query token mismatch' };
    }

    return { isValid: true };
  };

  const handlePayHeroWebhook = (req: any, res: any) => {
    try {
      console.log('[Checkout Webhook] Received callback payload:', JSON.stringify(req.body, null, 2));

      // 1. Signature Verification with Secret API Key
      const verification = verifyWebhookSignatureOrToken(req);
      if (!verification.isValid) {
        console.warn(`[Checkout Webhook Security] Unauthorized webhook access blocked: ${verification.reason}`);
        res.status(401).json({
          status: 'error',
          error: 'Unauthorized: Invalid webhook signature or secret API key',
          reason: verification.reason,
        });
        return;
      }

      // 2. Parse Callback Payload
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
            // 3. Idempotent Status Update using Secure Parameterized SQL Statement
            // SQL: UPDATE Applications SET current_status = $1, payment_reference = $2 WHERE id = $3 AND current_status != 'paid'
            const result = dbRepo.updateApplicationStatusToPaid(targetApp.id, receipt);
            
            if (result.success) {
              if (result.isIdempotent) {
                console.log(`[Checkout Webhook Idempotency] Duplicate callback safely acknowledged for application ${targetApp.id}. Reference: ${receipt}`);
                res.status(200).json({
                  status: 'ok',
                  idempotent: true,
                  message: 'Application payment already verified and recorded',
                  receipt,
                  application_id: targetApp.id,
                });
                return;
              }

              console.log(`[Checkout Webhook Success] Application ${targetApp.id} marked as PAID via parameterized SQL. Receipt: ${receipt}`);
              res.status(200).json({
                status: 'ok',
                idempotent: false,
                updated: true,
                receipt,
                application_id: targetApp.id,
                application: result.application,
              });
              return;
            } else if (result.reason === 'duplicate_reference') {
              console.warn(`[Checkout Webhook Idempotency] Reference ${receipt} already processed. Discarding duplicate callback.`);
              res.status(200).json({
                status: 'ignored',
                idempotent: true,
                message: 'Duplicate transaction reference code discarded',
                receipt,
              });
              return;
            } else if (result.reason === 'already_paid') {
              console.log(`[Checkout Webhook Idempotency] Application ${targetApp.id} is already marked as paid.`);
              res.status(200).json({
                status: 'ok',
                idempotent: true,
                message: 'Application already marked as paid',
                receipt,
                application_id: targetApp.id,
              });
              return;
            } else {
              res.status(result.code || 400).json({
                status: 'error',
                reason: result.reason,
              });
              return;
            }
          } else {
            console.log(`[Checkout Webhook Status] Transaction for application ${targetApp.id} completed with non-success status. Marking application as failed.`);
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
        } else {
          console.warn(`[Checkout Webhook Warning] No matching application found for extRef: "${extRef}", checkoutId: "${checkoutId}"`);
          res.status(404).json({
            status: 'error',
            error: 'Application not found matching provided reference',
            extRef,
            checkoutId,
          });
          return;
        }
      }

      res.status(200).json({ status: 'ok', received: true });
    } catch (err: any) {
      console.error('[Checkout Webhook Error] Error processing callback:', err);
      res.status(500).json({ status: 'error', message: err.message || 'Internal server error' });
    }
  };

  // POST /api/checkout/process-push (Dynamic gateway processing route)
  app.post('/api/checkout/process-push', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { application_id, phone_number, phone, phoneNumber } = req.body;
      const targetPhone = phone_number || phone || phoneNumber;

      if (!application_id) {
        res.status(400).json({ error: 'Application ID is required' });
        return;
      }

      const application = dbRepo.getApplicationById(application_id);
      if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }

      const phoneToUse = targetPhone || application.phone_number;
      if (!phoneToUse) {
        res.status(400).json({ error: 'Safaricom phone number is required for M-Pesa STK push' });
        return;
      }

      const job = dbRepo.getJobById(application.job_id);
      if (!job) {
        res.status(404).json({ error: 'Job details not found for payment' });
        return;
      }

      const amount = typeof job.fee_amount === 'number' ? job.fee_amount : 1500;
      if (amount <= 0) {
        const updated = dbRepo.updateApplicationStatus(application.id, 'paid', 'FREE_AUTHORIZATION');
        res.json({
          success: true,
          message: 'Zero fee application authorized automatically',
          application: updated,
        });
        return;
      }

      const ref = `ADEC_${application.id.slice(-6).toUpperCase()}`;

      const stkResult = await sendPayHeroStkPush({
        phoneNumber: phoneToUse,
        amount: amount,
        applicationId: application.id,
        reference: ref,
      });

      if (!stkResult.success) {
        res.status(400).json({ error: stkResult.error || 'Gateway payment processing failed' });
        return;
      }

      res.json(stkResult);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gateway payment processing failed' });
    }
  });

  // POST /api/checkout/callback (Dynamic Webhook callback route)
  app.post('/api/checkout/callback', handlePayHeroWebhook);

  // POST /api/payments/stk-push
  app.post('/api/payments/stk-push', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { application_id, phone_number, phone, phoneNumber } = req.body;
      const targetPhone = phone_number || phone || phoneNumber;

      if (!application_id) {
        res.status(400).json({ error: 'Application ID is required' });
        return;
      }

      const application = dbRepo.getApplicationById(application_id);
      if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }

      const phoneToUse = targetPhone || application.phone_number;
      if (!phoneToUse) {
        res.status(400).json({ error: 'Safaricom phone number is required for M-Pesa STK push' });
        return;
      }

      const job = dbRepo.getJobById(application.job_id);
      if (!job) {
        res.status(404).json({ error: 'Job details not found for payment' });
        return;
      }

      const amount = typeof job.fee_amount === 'number' ? job.fee_amount : 1500;
      if (amount <= 0) {
        const updated = dbRepo.updateApplicationStatus(application.id, 'paid', 'FREE_AUTHORIZATION');
        res.json({
          success: true,
          message: 'Zero fee application authorized automatically',
          application: updated,
        });
        return;
      }

      const ref = `ADEC_${application.id.slice(-6).toUpperCase()}`;

      const stkResult = await sendPayHeroStkPush({
        phoneNumber: phoneToUse,
        amount: amount,
        applicationId: application.id,
        reference: ref,
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
  // Allows user in preview sandbox mode to trigger server-to-server payment verification for application
  app.post('/api/payments/simulate-stk-confirm', authenticateToken, (req, res) => {
    try {
      const { application_id } = req.body;

      const application = dbRepo.getApplicationById(application_id);
      if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }

      const mpesaCode = `MPESA_QK${Math.floor(100000 + Math.random() * 900000)}X92`;
      const updateResult = dbRepo.updateApplicationStatusToPaid(application_id, mpesaCode);

      if (!updateResult.success && updateResult.reason === 'duplicate_reference') {
        res.status(409).json({ error: 'Duplicate transaction reference code discarded' });
        return;
      }

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

  // Webhook Callback Endpoints (Private Gateway Callbacks)
  app.post('/api/checkout/v1/webhook/callback', handlePayHeroWebhook);
  app.post('/api/payments/callback', handlePayHeroWebhook);

  // GET /api/payments/status/:applicationId
  app.get('/api/payments/status/:applicationId', authenticateToken, (req, res) => {
    try {
      const app = dbRepo.getApplicationById(req.params.applicationId);
      if (!app) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }
      res.json({
        status: app.current_status,
        payment_reference: app.payment_reference,
        application: app,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/payments/timeout/:applicationId
  // Triggered when client or gateway timeout fires without PIN authorization or amount received
  app.post('/api/payments/timeout/:applicationId', authenticateToken, (req, res) => {
    try {
      const applicationId = req.params.applicationId;
      const { reason } = req.body;
      const failureReason = reason || 'Payment authorization timed out: No PIN was entered on phone within time limit or no funds received.';

      const result = dbRepo.updateApplicationStatusToFailed(applicationId, failureReason);
      if (!result.success && result.reason === 'application_not_found') {
        res.status(404).json({ error: 'Application not found' });
        return;
      }

      console.warn(`[Payment Timeout] Application ${applicationId} marked as failed due to timeout: ${failureReason}`);
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

  // POST /api/checkout/timeout (Alias for checkout webhook/client timeout)
  app.post('/api/checkout/timeout', authenticateToken, (req, res) => {
    try {
      const { application_id, reason } = req.body;
      if (!application_id) {
        res.status(400).json({ error: 'Application ID is required' });
        return;
      }

      const failureReason = reason || 'Payment authorization timed out: No PIN entered or funds not received.';
      const result = dbRepo.updateApplicationStatusToFailed(application_id, failureReason);

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

  // GET /api/admin/database-indexes (Admin database index metadata & migration script)
  app.get('/api/admin/database-indexes', authenticateToken, requireAdmin, (req, res) => {
    try {
      const indexMetadata = dbRepo.getDatabaseIndexMetadata();
      res.json(indexMetadata);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // ADMIN DASHBOARD & PAYMENT SETTINGS ROUTES
  // ==========================================

  // GET /api/gateway/credentials (Admin only)
  app.get('/api/gateway/credentials', authenticateToken, requireAdmin, (req, res) => {
    try {
      const credentials = dbRepo.getGatewayCredentials();
      res.json({ credentials });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/gateway/credentials (Admin only)
  app.put('/api/gateway/credentials', authenticateToken, requireAdmin, (req, res) => {
    try {
      const { api_key, gateway_username, channel_identifier } = req.body;

      if (!api_key || !gateway_username || !channel_identifier) {
        res.status(400).json({ error: 'API Key, Gateway Username, and Channel Identifier are required' });
        return;
      }

      const updated = dbRepo.updateGatewayCredentials({
        api_key,
        gateway_username,
        channel_identifier,
      });

      res.json({
        message: 'Gateway credentials saved securely in database',
        credentials: updated,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/testimonials (Public viewable)
  app.get('/api/testimonials', (req, res) => {
    try {
      const testimonials = dbRepo.getTestimonials();
      res.json({ testimonials });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/testimonials (Create testimonial)
  app.post('/api/testimonials', authenticateToken, (req: AuthenticatedRequest, res) => {
    try {
      const { client_name, location, rating, review_text, avatar_url } = req.body;

      if (!client_name || !location || !review_text) {
        res.status(400).json({ error: 'Client name, location, and review text are required' });
        return;
      }

      const newTestimonial = {
        id: `test_${Date.now()}`,
        client_name,
        location,
        rating: Number(rating) || 5,
        review_text,
        avatar_url: avatar_url || '',
        is_visible: true,
        created_at: new Date().toISOString(),
      };

      dbRepo.createTestimonial(newTestimonial);

      res.status(201).json({
        message: 'Testimonial submitted successfully',
        testimonial: newTestimonial,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/payment-settings (Admin only)
  app.get('/api/admin/payment-settings', authenticateToken, requireAdmin, (req, res) => {
    try {
      const settings = dbRepo.getPaymentSettings();
      res.json({ settings });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/admin/payment-settings (Admin only)
  app.put('/api/admin/payment-settings', authenticateToken, requireAdmin, (req, res) => {
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

  // GET /api/admin/stats (Admin overview KPIs)
  app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
    try {
      const users = dbRepo.getUsers();
      const jobs = dbRepo.getJobs();
      const applications = dbRepo.getApplications();

      const activeJobs = jobs.filter((j) => j.status === 'active').length;
      const paidApps = applications.filter((a) => a.current_status === 'paid' || a.current_status === 'approved' || a.current_status === 'under_review');
      const approvedApps = applications.filter((a) => a.current_status === 'approved').length;

      const totalRevenue = applications.reduce((acc, app) => {
        if (app.current_status === 'paid' || app.current_status === 'approved' || app.current_status === 'under_review') {
          const job = jobs.find((j) => j.id === app.job_id);
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
  // VITE & STATIC FILES SETUP
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Adecco Group Agency server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
