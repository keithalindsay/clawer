/**
 * Alert system for Clawer.ai
 * 
 * Sends notifications when things go wrong.
 * Uses email via Resend API (degrades to console.log if not configured).
 */

const ALERT_EMAIL = process.env.ALERT_EMAIL || 'vavier@gmail.com';

/**
 * Send an alert via email + console log
 */
export async function sendAlert(message: string, severity: 'info' | 'warn' | 'error' = 'error') {
  const timestamp = new Date().toISOString();
  const prefix = severity === 'error' ? '🚨 ALERT' : severity === 'warn' ? '⚠️ WARNING' : 'ℹ️ INFO';
  
  // Always log to console for server monitoring
  console.log(`${prefix} [${timestamp}] ${message}`);
  
  // Send email for warnings and errors
  if (severity !== 'info') {
    try {
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      if (!RESEND_API_KEY) {
        console.log(`📧 [Alert - No Email] Would email ${ALERT_EMAIL}: ${message}`);
        return;
      }

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Clawer.ai Alerts <alerts@clawer.ai>',
          to: [ALERT_EMAIL],
          subject: `${prefix} Clawer.ai: ${message.substring(0, 80)}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2 style="color: ${severity === 'error' ? '#dc2626' : '#d97706'};">${prefix}</h2>
              <p><strong>Time:</strong> ${timestamp}</p>
              <p><strong>Severity:</strong> ${severity.toUpperCase()}</p>
              <pre style="background: #f3f4f6; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${message}</pre>
            </div>
          `,
          text: `${prefix}\nTime: ${timestamp}\nSeverity: ${severity}\n\n${message}`,
        }),
      });
    } catch (emailError) {
      console.error('Failed to send alert email:', emailError);
      // Non-blocking — the console log above is the fallback
    }
  }
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

/**
 * Send alert on payment failure
 */
export async function alertPaymentFailure(customerId: string, reason: string) {
  await sendAlert(`Payment failed for customer ${customerId}: ${reason}`, 'warn');
}
