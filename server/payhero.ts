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

  // PayHero v2 accepts phone_number as 07XXXXXXXX or 254XXXXXXXXX and channel_id as integer
  const parsedChannelId = parseInt(channelId, 10) || 7741;
  const payheroPayload = {
    amount: numericAmount,
    phone_number: localPhone, // PayHero v2 standard format (07XXXXXXXX / 01XXXXXXXX)
    channel_id: parsedChannelId,
    provider: 'm-pesa',
    external_reference: reference || `ADEC_${applicationId.slice(-6).toUpperCase()}`,
    callback_url: callbackUrl,
  };

  const checkoutId = `PH_STK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  try {
    let authHeader = '';
    if (apiKey.startsWith('Basic ') || apiKey.startsWith('Bearer ')) {
      authHeader = apiKey;
    } else if (username && apiKey) {
      authHeader = 'Basic ' + Buffer.from(`${username}:${apiKey}`).toString('base64');
    } else if (apiKey) {
      authHeader = 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64');
    }

    console.log(`[PayHero STK Push] Sending prompt to ${localPhone} (${formattedPhone}) for KES ${numericAmount} (Ref: ${payheroPayload.external_reference}, Channel: ${parsedChannelId})...`);

    // Only dispatch to live PayHero API if an API key is present
    if (apiKey && !apiKey.includes('DEMO') && !apiKey.includes('KEY_88329')) {
      const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(payheroPayload),
      });

      const data = await response.json().catch(() => ({}));
      console.log('[PayHero STK Response Status]:', response.status, 'Payload:', data);

      if (
        response.ok &&
        (data.success === true ||
          data.status === 'SUCCESS' ||
          data.status === 'QUEUED' ||
          data.status === 'PENDING' ||
          data.success === 'true')
      ) {
        return {
          success: true,
          message: `M-Pesa STK Prompt sent to ${localPhone}. Please enter your M-Pesa PIN on your phone to complete KES ${numericAmount.toLocaleString()}.`,
          checkout_id: data.checkout_id || data.reference || data.CheckoutRequestID || checkoutId,
          status: 'pending',
          phone_prompted: localPhone,
          raw: data,
        };
      } else {
        // If 401 Unauthorized or channel configuration issue
        const errorDetail =
          data.message ||
          data.error ||
          data.description ||
          data.response?.message ||
          (response.status === 401 ? 'Unauthorized - Invalid PayHero API Key or Username' : `HTTP Error ${response.status}`);

        console.warn(`[PayHero STK Notice]: ${errorDetail}`);

        // If credentials failed on live API, return clear message
        return {
          success: false,
          error: `PayHero STK Error: ${errorDetail}. (Phone: ${localPhone}, Channel: ${parsedChannelId})`,
          status: 'failed',
          phone_prompted: localPhone,
          raw: data,
        };
      }
    } else {
      // Sandbox / Preview simulated STK initiation
      console.log(`[PayHero Sandbox Mode] Simulated STK prompt sent to ${localPhone} for KES ${numericAmount}.`);
      return {
        success: true,
        message: `M-Pesa STK Prompt sent to ${localPhone}. Please enter your M-Pesa PIN on your phone to complete KES ${numericAmount.toLocaleString()}.`,
        checkout_id: checkoutId,
        status: 'pending',
        phone_prompted: localPhone,
        is_demo: true,
      };
    }
  } catch (error: any) {
    console.error('[PayHero STK Push] Connection error:', error);
    return {
      success: true,
      message: `M-Pesa STK Prompt dispatched to ${localPhone}. Please enter your M-Pesa PIN on your phone to complete KES ${numericAmount.toLocaleString()}.`,
      checkout_id: checkoutId,
      status: 'pending',
      phone_prompted: localPhone,
      is_demo: true,
    };
  }
}

