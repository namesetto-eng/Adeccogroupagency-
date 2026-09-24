import { dbRepo } from './db';

interface PayHeroStkPushPayload {
  phoneNumber: string;
  amount: number;
  applicationId: string;
  reference: string;
  overrideApiKey?: string;
  overrideUsername?: string;
  overrideChannelId?: string;
}

export function formatKenyanPhone(phone: string): string {
  // Normalize phone number to 2547XXXXXXXX or 2541XXXXXXXX format (12 digits, no leading +)
  let cleaned = phone.replace(/\D/g, '');

  // Handle +25407... or 25407... (remove extra zero)
  if (cleaned.startsWith('2540') && cleaned.length === 13) {
    cleaned = '254' + cleaned.slice(4);
  }
  // Handle 00254...
  if (cleaned.startsWith('00254')) {
    cleaned = cleaned.slice(2);
  }
  // Handle 07... or 01... (10 digits)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '254' + cleaned.slice(1);
  }
  // Handle 7... or 1... (9 digits)
  else if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

export function getLocalKenyanPhone(phone: string): string {
  const intl = formatKenyanPhone(phone);
  if (intl.startsWith('254') && intl.length === 12) {
    return '0' + intl.slice(3);
  }
  return phone;
}

function getCandidateAuthHeaders(apiKey: string, username?: string): string[] {
  const headers: string[] = [];
  const cleanKey = apiKey.trim();

  // 1. If user already included Basic or Bearer prefix
  if (cleanKey.startsWith('Basic ') || cleanKey.startsWith('Bearer ')) {
    headers.push(cleanKey);
    return headers;
  }

  // 2. If it looks like a base64 token copied directly from PayHero dashboard (>= 16 chars, no spaces)
  if (/^[A-Za-z0-9+/=]{16,}$/.test(cleanKey)) {
    headers.push(`Basic ${cleanKey}`);
  }

  // 3. Username + API key combinations
  if (username && cleanKey) {
    headers.push('Basic ' + Buffer.from(`${username.trim()}:${cleanKey}`).toString('base64'));
    headers.push('Basic ' + Buffer.from(`${cleanKey}:${username.trim()}`).toString('base64'));
  }

  // 4. API Key containing colon
  if (cleanKey.includes(':')) {
    headers.push('Basic ' + Buffer.from(cleanKey).toString('base64'));
  }

  // 5. Raw key with trailing colon or as Bearer
  headers.push('Basic ' + Buffer.from(`${cleanKey}:`).toString('base64'));
  headers.push(`Bearer ${cleanKey}`);

  return headers;
}

export async function sendPayHeroStkPush({
  phoneNumber,
  amount,
  applicationId,
  reference,
  overrideApiKey,
  overrideUsername,
  overrideChannelId,
}: PayHeroStkPushPayload) {
  const envApiKey = process.env.PAYHERO_API_KEY;
  const envUsername = process.env.PAYHERO_USERNAME;
  const envChannelId = process.env.PAYHERO_CHANNEL_ID;

  const gatewayCreds = dbRepo.getGatewayCredentials();
  const settings = dbRepo.getPaymentSettings();

  const apiKey = (overrideApiKey || envApiKey || gatewayCreds?.api_key || settings?.payhero_api_key || '').trim();
  const username = (overrideUsername || envUsername || gatewayCreds?.gateway_username || settings?.payhero_username || '').trim();
  const channelId = (overrideChannelId || envChannelId || gatewayCreds?.channel_identifier || settings?.payhero_channel_id || '7741').trim();

  const formattedPhone = formatKenyanPhone(phoneNumber);
  const localPhone = getLocalKenyanPhone(phoneNumber);

  // Validate Kenyan Safaricom / M-Pesa phone number format (2547XXXXXXXX or 2541XXXXXXXX)
  if (!/^254[0-9]\d{8}$/.test(formattedPhone)) {
    return {
      success: false,
      error: `Invalid Safaricom M-Pesa phone number (${phoneNumber}). Please provide a valid 10-digit number (e.g. 0712345678 or 0143115691).`,
      status: 'failed',
    };
  }

  const numericAmount = Math.round(Number(amount));
  if (isNaN(numericAmount) || numericAmount < 0) {
    return {
      success: false,
      error: `Invalid fee amount (${amount}). Must be a valid positive number.`,
      status: 'failed',
    };
  }

  // Derive robust HTTPS callback URL for Webhooks
  let baseUrl = process.env.APP_URL || '';
  if (!baseUrl && process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  }
  if (!baseUrl && process.env.NEXT_PUBLIC_VERCEL_URL) {
    baseUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  if (!baseUrl) {
    baseUrl = 'https://adecco.co.ke';
  }
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }

  const callbackUrl = `${baseUrl.replace(/\/+$/, '')}/api/checkout/v1/webhook/callback`;
  const parsedChannelId = parseInt(channelId, 10) || 7741;
  const externalRef = reference || `ADEC_${applicationId.slice(-6).toUpperCase()}`;
  const checkoutId = `PH_STK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Determine if credentials are valid live credentials vs dummy placeholder
  const isPlaceholderKey =
    !apiKey ||
    apiKey.startsWith('PH_LIVE_ADECC_') ||
    apiKey.toLowerCase().includes('demo') ||
    apiKey.length < 8;

  if (!isPlaceholderKey) {
    const authHeadersToTry = getCandidateAuthHeaders(apiKey, username);
    console.log(`[PayHero STK Push] Dispatching live prompt to ${localPhone} (${formattedPhone}) for KES ${numericAmount} on channel ${parsedChannelId}...`);

    // Phone variants: local '07XXXXXXXX' / '01XXXXXXXX' and international '254XXXXXXXXX'
    const phoneVariants = [localPhone, formattedPhone];
    const endpoints = [
      'https://backend.payhero.co.ke/api/v2/payments',
      'https://backend.payhero.co.ke/api/v2/pushes',
    ];

    let lastError: any = null;
    let lastStatus: number = 0;

    for (const authHeader of authHeadersToTry) {
      for (const phoneToTry of phoneVariants) {
        for (const endpoint of endpoints) {
          try {
            const payheroPayload = {
              amount: numericAmount,
              phone_number: phoneToTry,
              channel_id: parsedChannelId,
              provider: 'm-pesa',
              external_reference: externalRef,
              callback_url: callbackUrl,
            };

            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': authHeader,
              },
              body: JSON.stringify(payheroPayload),
            });

            lastStatus = response.status;
            const data: any = await response.json().catch(() => ({}));
            console.log(`[PayHero Endpoint ${endpoint}] Auth: ${authHeader.slice(0, 15)}... Phone: ${phoneToTry} Status: ${response.status}`, data);

            if (
              response.ok &&
              (data.success === true ||
                data.status === 'SUCCESS' ||
                data.status === 'QUEUED' ||
                data.status === 'PENDING' ||
                data.success === 'true' ||
                data.CheckoutRequestID ||
                data.checkout_id ||
                data.reference)
            ) {
              const activeCheckoutId = data.checkout_id || data.reference || data.CheckoutRequestID || checkoutId;

              // Save the active reference to application record
              try {
                dbRepo.updateApplicationPaymentReference(applicationId, activeCheckoutId);
              } catch {}

              return {
                success: true,
                message: `M-Pesa STK Prompt sent to ${phoneToTry}. Please check your phone and enter your secret M-Pesa PIN to authorize KES ${numericAmount.toLocaleString()}.`,
                checkout_id: activeCheckoutId,
                reference: externalRef,
                status: 'pending',
                phone_prompted: phoneToTry,
                raw: data,
              };
            }

            lastError = data;

            // If 404 on endpoint, try next endpoint
            if (response.status === 404) {
              continue;
            }

            // If PayHero explicitly returned an error message, capture it
            if (data?.error || data?.message || data?.description) {
              lastError = data;
            }
          } catch (fetchErr: any) {
            lastError = { message: fetchErr.message };
          }
        }
      }
    }

    // If live call returned an error from PayHero
    const errorDetail =
      lastError?.message ||
      lastError?.error ||
      lastError?.description ||
      lastError?.response?.message ||
      (lastStatus === 401
        ? 'PayHero Authorization Failed: Check your API Key, Username, and Channel ID in Payment Settings.'
        : `PayHero returned HTTP status ${lastStatus || 'error'}`);

    return {
      success: false,
      error: errorDetail,
      status: 'failed',
      phone_prompted: localPhone,
      raw: lastError,
    };
  }

  // If no live custom PayHero key is configured yet, guide the admin/user
  console.log(`[PayHero Notice] No live PayHero credentials saved in Admin Settings.`);
  return {
    success: false,
    error: 'PayHero Gateway is not configured. Please save your live PayHero API Key, Username, and Channel ID in the Admin Dashboard (Payment Settings) to dispatch live M-Pesa STK push prompts.',
    status: 'failed',
    phone_prompted: localPhone,
  };
}

export async function queryPayHeroTransactionStatus(
  referenceOrCheckoutId: string,
  credentials?: { apiKey?: string; username?: string }
): Promise<{
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  receipt?: string;
  amount?: number;
  reason?: string;
  raw?: any;
}> {
  if (!referenceOrCheckoutId || !referenceOrCheckoutId.trim()) {
    return { success: false, status: 'PENDING' };
  }

  const envApiKey = process.env.PAYHERO_API_KEY;
  const envUsername = process.env.PAYHERO_USERNAME;
  const gatewayCreds = dbRepo.getGatewayCredentials();
  const settings = dbRepo.getPaymentSettings();

  const apiKey = (credentials?.apiKey || envApiKey || gatewayCreds?.api_key || settings?.payhero_api_key || '').trim();
  const username = (credentials?.username || envUsername || gatewayCreds?.gateway_username || settings?.payhero_username || '').trim();

  // If no live key is configured or is placeholder, return PENDING
  if (!apiKey || apiKey.length < 8 || apiKey.startsWith('PH_LIVE_ADECC_')) {
    return { success: false, status: 'PENDING' };
  }

  const authHeadersToTry = getCandidateAuthHeaders(apiKey, username);
  const endpoints = [
    `https://backend.payhero.co.ke/api/v2/transaction-status?reference=${encodeURIComponent(referenceOrCheckoutId)}`,
    `https://backend.payhero.co.ke/api/v2/payments/${encodeURIComponent(referenceOrCheckoutId)}`,
    `https://backend.payhero.co.ke/api/v2/transactions/${encodeURIComponent(referenceOrCheckoutId)}`,
  ];

  for (const authHeader of authHeadersToTry) {
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': authHeader,
          },
        });

        if (res.status === 401 || res.status === 404) continue;
        const data: any = await res.json().catch(() => ({}));

        const statusStr = String(data.status || data.PaymentStatus || data.result_desc || '').toUpperCase();
        const resultCode =
          data.result_code !== undefined
            ? Number(data.result_code)
            : data.ResultCode !== undefined
            ? Number(data.ResultCode)
            : null;

        if (
          statusStr.includes('SUCCESS') ||
          statusStr.includes('COMPLETE') ||
          resultCode === 0 ||
          data.success === true ||
          data.success === 'true'
        ) {
          const receipt =
            data.mpesa_code ||
            data.MpesaReceiptNumber ||
            data.mpesa_receipt_number ||
            data.receipt ||
            data.reference ||
            `MPESA_${Date.now().toString().slice(-8)}`;
          const amount = Number(data.amount || data.Amount || 0);
          return {
            success: true,
            status: 'SUCCESS',
            receipt,
            amount,
            raw: data,
          };
        }

        if (
          statusStr.includes('FAIL') ||
          statusStr.includes('CANCEL') ||
          statusStr.includes('REJECT') ||
          statusStr.includes('EXPIRE') ||
          (resultCode !== null && resultCode !== 0)
        ) {
          const reason =
            data.result_desc ||
            data.ResultDesc ||
            data.message ||
            data.error ||
            'M-Pesa payment failed or cancelled by user';
          return {
            success: false,
            status: 'FAILED',
            reason,
            raw: data,
          };
        }

        if (statusStr.includes('QUEUED') || statusStr.includes('PENDING') || statusStr.includes('INITIAT')) {
          return {
            success: false,
            status: 'PENDING',
            raw: data,
          };
        }
      } catch {
        // try next endpoint
      }
    }
  }

  return { success: false, status: 'PENDING' };
}
