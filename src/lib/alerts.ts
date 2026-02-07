/**
 * Alert system for Clawer
 * Sends notifications when things go wrong
 */

const ALERT_PHONE = process.env.ALERT_PHONE || '+18606815315';

/**
 * Send an alert via console log (can be extended to WhatsApp/email later)
 * For now, just logs with a distinctive prefix for monitoring
 */
export async function sendAlert(message: string, severity: 'info' | 'warn' | 'error' = 'error') {
  const timestamp = new Date().toISOString();
  const prefix = severity === 'error' ? '🚨 ALERT' : severity === 'warn' ? '⚠️ WARNING' : 'ℹ️ INFO';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
  
  // TODO: Add WhatsApp notification when container WhatsApp is available
  // For now, alerts go to console/logs which can be monitored
  
  // Could also add email notification:
  // await sendEmail(ALERT_EMAIL, `Clawer Alert: ${severity}`, message);
}

/**
 * Send alert on container failure
 */
export async function alertContainerFailure(userId: string, error: string) {
  await sendAlert(`Container failed for user ${userId}: ${error}`);
}

/**
 * Send alert on provisioning failure
 */
export async function alertProvisioningFailure(userId: string, error: string) {
  await sendAlert(`Failed to provision container for user ${userId}: ${error}`);
}

/**
 * Send alert on API error
 */
export async function alertApiError(route: string, error: string) {
  await sendAlert(`API error in ${route}: ${error}`);
}
