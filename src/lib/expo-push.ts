/**
 * Expo Push Notification Client
 *
 * Handles sending push notifications via the Expo Push API.
 * Supports single messages and batched delivery (up to 100 per request).
 *
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExpoPushMessage {
  to: string;                        // Expo push token
  title?: string;
  body?: string;
  data?: Record<string, unknown>;    // Extra data passed to the app
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;                // Android notification channel
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;                      // Time-to-live in seconds
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;                       // Receipt ID (only on status: 'ok')
  message?: string;                  // Error message (only on status: 'error')
  details?: {
    error?: 'DeviceNotRegistered' | 'InvalidCredentials' | 'MessageTooBig' | 'MessageRateExceeded';
  };
}

export interface PushResult {
  success: boolean;
  ticketId?: string;
  error?: string;
  isInvalidToken?: boolean;          // true → caller should remove the token from DB
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns true if the string looks like a valid Expo push token.
 * Accepts both "ExponentPushToken[…]" and the newer "ExpoPushToken[…]" formats.
 */
export function isValidExpoPushToken(token: string): boolean {
  return /^Expo(nent)?PushToken\[.+\]$/.test(token);
}

// ── Core send ─────────────────────────────────────────────────────────────────

/**
 * Send a single push notification via the Expo Push API.
 *
 * @param pushToken  - Expo push token for the recipient device
 * @param title      - Notification title
 * @param body       - Notification body text
 * @param data       - Optional extra data payload (deep-link params, etc.)
 * @returns          PushResult describing success or failure
 */
export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<PushResult> {
  if (!isValidExpoPushToken(pushToken)) {
    console.warn(`[expo-push] Invalid token format: ${pushToken.substring(0, 40)}…`);
    return {
      success: false,
      error: 'Invalid push token format',
      isInvalidToken: true,
    };
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    title,
    body,
    sound: 'default',
    priority: 'high',
    ...(data ? { data } : {}),
  };

  try {
    const response = await fetch(EXPO_PUSH_API, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[expo-push] HTTP ${response.status}: ${text}`);
      return {
        success: false,
        error: `Expo API returned ${response.status}`,
      };
    }

    const result = await response.json();
    // The API wraps responses: { data: ExpoPushTicket | ExpoPushTicket[] }
    const ticket: ExpoPushTicket = Array.isArray(result.data) ? result.data[0] : result.data;

    if (!ticket) {
      return { success: false, error: 'Empty response from Expo API' };
    }

    if (ticket.status === 'error') {
      const isInvalidToken = ticket.details?.error === 'DeviceNotRegistered';
      console.warn(`[expo-push] Ticket error: ${ticket.message} (${ticket.details?.error})`);
      return {
        success: false,
        error: ticket.message || ticket.details?.error || 'Unknown Expo error',
        isInvalidToken,
      };
    }

    return { success: true, ticketId: ticket.id };
  } catch (err: any) {
    console.error('[expo-push] Network error:', err);
    return {
      success: false,
      error: err.message || 'Network error reaching Expo Push API',
    };
  }
}

/**
 * Send multiple push notifications in a single batch request (max 100).
 * Returns one PushResult per message in the same order.
 */
export async function sendPushNotifications(
  messages: ExpoPushMessage[]
): Promise<PushResult[]> {
  if (messages.length === 0) return [];
  if (messages.length > 100) {
    throw new Error('Expo Push API batch limit is 100 messages');
  }

  // Validate tokens upfront
  const results: PushResult[] = messages.map((m) => {
    if (!isValidExpoPushToken(m.to)) {
      return { success: false, error: 'Invalid token format', isInvalidToken: true };
    }
    return null as any; // will be filled below
  });

  const validIndices = messages
    .map((_, i) => i)
    .filter((i) => results[i] === null);

  if (validIndices.length === 0) return results;

  const validMessages = validIndices.map((i) => messages[i]);

  try {
    const response = await fetch(EXPO_PUSH_API, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validMessages),
    });

    if (!response.ok) {
      const text = await response.text();
      const err = { success: false as const, error: `Expo API returned ${response.status}` };
      validIndices.forEach((i) => { results[i] = err; });
      return results;
    }

    const payload = await response.json();
    const tickets: ExpoPushTicket[] = Array.isArray(payload.data) ? payload.data : [payload.data];

    validIndices.forEach((originalIdx, ticketIdx) => {
      const ticket = tickets[ticketIdx];
      if (!ticket) {
        results[originalIdx] = { success: false, error: 'Missing ticket in response' };
        return;
      }
      if (ticket.status === 'error') {
        results[originalIdx] = {
          success: false,
          error: ticket.message || ticket.details?.error,
          isInvalidToken: ticket.details?.error === 'DeviceNotRegistered',
        };
      } else {
        results[originalIdx] = { success: true, ticketId: ticket.id };
      }
    });
  } catch (err: any) {
    const networkErr = { success: false as const, error: err.message || 'Network error' };
    validIndices.forEach((i) => { results[i] = networkErr; });
  }

  return results;
}
