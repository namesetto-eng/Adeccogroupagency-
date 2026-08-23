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

  // Validate Kenyan Safaricom / M-Pesa phone number format (2547XXXXXXXX or 2541XXXXXXXX, 12 digits or 10 digits starting with 07/01)
  if (!/^254[0-9]\d{8}$/.test(formattedPhone)) {
    return {
      success: false,
      error: `Invalid M-Pesa phone number (${phoneNumber}). Please provide a valid Kenyan phone number (e.g. 0712345678 or 254712345678).`,
      status: 'failed',
    };
  }

  const numericAmount = Math.round(Number(amount));
  if (isNaN(numericAmount) || numericAmount < 0) {
    return {
      success: false,
      error: `Invalid fee amount (${amount}). Must be a valid non-negative number.`,
      status: 'failed',
    };
  }

  // Derive robust HTTPS callback URL for Vercel / Production environments
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

  // Determine if this is a configured custom API key or default demo
  const isCustomKey = apiKey && apiKey.length > 8 && !apiKey.toLowerCase().includes('demo');

  if (isCustomKey) {
    // Generate auth headers to try
    let authHeader = '';
    if (apiKey.startsWith('Basic ') || apiKey.startsWith('Bearer ')) {
      authHeader = apiKey;
    } else if (username && apiKey) {
      authHeader = 'Basic ' + Buffer.from(`${username}:${apiKey}`).toString('base64');
    } else if (apiKey.includes(':')) {
      authHeader = 'Basic ' + Buffer.from(apiKey).toString('base64');
    } else {
      authHeader = 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64');
    }

    console.log(`[PayHero STK Push] Initiating Live STK Push to ${localPhone} (${formattedPhone}) for KES ${numericAmount} on channel ${parsedChannelId}...`);

    // We will attempt with localPhone first ('07XXXXXXXX'), and if needed try formattedPhone ('2547XXXXXXXX')
    const phoneVariants = [localPhone, formattedPhone];
    const endpoints = [
      'https://backend.payhero.co.ke/api/v2/payments',
      'https://backend.payhero.co.ke/api/v2/pushes',
    ];

    let lastError: any = null;
    let lastStatus: number = 0;

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
          console.log(`[PayHero Endpoint ${endpoint}] Status: ${response.status}`, data);

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
            return {
              success: true,
              message: `M-Pesa STK Prompt sent to ${phoneToTry}. Please enter your M-Pesa PIN on your phone to complete KES ${numericAmount.toLocaleString()}.`,
              checkout_id: data.checkout_id || data.reference || data.CheckoutRequestID || checkoutId,
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

          // If 401 Unauthorized, try alternate basic auth encoding (apiKey:username vs username:apiKey)
          if (response.status === 401 && username && !authHeader.startsWith('Bearer ')) {
            const altAuth = 'Basic ' + Buffer.from(`${apiKey}:${username}`).toString('base64');
            const retryRes = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': altAuth,
              },
              body: JSON.stringify(payheroPayload),
            });
            const retryData: any = await retryRes.json().catch(() => ({}));
            if (retryRes.ok && (retryData.success || retryData.status === 'SUCCESS' || retryData.status === 'QUEUED' || retryData.status === 'PENDING')) {
              return {
                success: true,
                message: `M-Pesa STK Prompt sent to ${phoneToTry}. Please enter your M-Pesa PIN on your phone to complete KES ${numericAmount.toLocaleString()}.`,
                checkout_id: retryData.checkout_id || retryData.reference || retryData.CheckoutRequestID || checkoutId,
                status: 'pending',
                phone_prompted: phoneToTry,
                raw: retryData,
              };
            }
          }
        } catch (fetchErr: any) {
          lastError = { message: fetchErr.message };
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

  // Demo / Simulation Mode when no live custom PayHero key is configured yet
  console.log(`[PayHero Simulator Mode] STK prompt generated for ${localPhone} (KES ${numericAmount}).`);
  return {
    success: true,
    message: `M-Pesa STK Prompt sent to ${localPhone}. Please enter your M-Pesa PIN on your phone to complete KES ${numericAmount.toLocaleString()}.`,
    checkout_id: checkoutId,
    status: 'pending',
    phone_prompted: localPhone,
    is_demo: true,
  };
}


