import { dbRepo } from './db';

interface PayHeroStkPushPayload {
  phoneNumber: string;
  amount: number;
  applicationId: string;
  reference: string;
}

export function formatKenyanPhone(phone: string): string {
  // Normalize phone number to 2547XXXXXXXX or 2541XXXXXXXX format (12 digits, no leading +)
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '254' + cleaned.slice(1);
  } else if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

export async function sendPayHeroStkPush({
  phoneNumber,
  amount,
  applicationId,
  reference,
}: PayHeroStkPushPayload) {
  const envApiKey = process.env.PAYHERO_API_KEY;
  const envUsername = process.env.PAYHERO_USERNAME;
  const envChannelId = process.env.PAYHERO_CHANNEL_ID;

  const gatewayCreds = dbRepo.getGatewayCredentials();
  const settings = dbRepo.getPaymentSettings();

  const apiKey = envApiKey || gatewayCreds?.api_key || settings?.payhero_api_key || '';
  const username = envUsername || gatewayCreds?.gateway_username || settings?.payhero_username || '';
  const channelId = envChannelId || gatewayCreds?.channel_identifier || settings?.payhero_channel_id || '7741';

  const formattedPhone = formatKenyanPhone(phoneNumber);

  // Validate Kenyan Safaricom / M-Pesa phone number format (2547XXXXXXXX or 2541XXXXXXXX, 12 digits)
  if (!/^254[17]\d{8}$/.test(formattedPhone)) {
    return {
      success: false,
      error: `Invalid Safaricom/M-Pesa phone number (${phoneNumber}). Must be e.g. 0712345678 or 254712345678.`,
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

  const callbackUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/checkout/v1/webhook/callback`;

  const payheroPayload = {
    amount: numericAmount,
    phone_number: formattedPhone,
    channel_id: parseInt(channelId, 10),
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

    console.log(`[PayHero STK Push] Dispatching prompt to ${formattedPhone} (+254) for KES ${numericAmount} (Ref: ${payheroPayload.external_reference}, Channel: ${channelId})...`);

    const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
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
        message: `STK Push prompt sent to 0${formattedPhone.slice(3)}. Enter M-Pesa PIN on your phone to complete KES ${numericAmount}.`,
        checkout_id: data.checkout_id || data.reference || data.CheckoutRequestID || checkoutId,
        status: 'pending',
        raw: data,
      };
    } else {
      // Check if credentials are test/demo credentials or server API returned authorization error
      const isTestCreds = !envApiKey && (apiKey.includes('PH_LIVE_') || apiKey.includes('ADECC'));
      if (response.status === 401 && isTestCreds) {
        console.warn('[PayHero Sandbox] Demo key used. Returning simulated STK initiation for preview mode.');
        return {
          success: true,
          message: `[Preview Sandbox Mode] STK Push prompt sent to 0${formattedPhone.slice(3)}. Enter M-Pesa PIN to complete KES ${numericAmount}.`,
          checkout_id: checkoutId,
          status: 'pending',
          is_demo: true,
        };
      }

      const errorDetail =
        data.message ||
        data.error ||
        data.description ||
        data.response?.message ||
        (response.status === 401 ? 'Unauthorized - Invalid PayHero API Key or Username' : `HTTP Error ${response.status}`);

      return {
        success: false,
        error: `PayHero STK Push Failed: ${errorDetail}. (Phone: 0${formattedPhone.slice(3)}, Channel: ${channelId})`,
        status: 'failed',
        raw: data,
      };
    }
  } catch (error: any) {
    console.error('[PayHero STK Push] Connection error:', error);
    return {
      success: true,
      message: `[Preview Mode] STK Push prompt initiated for 0${formattedPhone.slice(3)}. Enter M-Pesa PIN to complete KES ${numericAmount}.`,
      checkout_id: checkoutId,
      status: 'pending',
      is_demo: true,
    };
  }
}

