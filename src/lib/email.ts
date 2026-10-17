import { agencyConfig } from '@/config/agency';

export interface EnquiryEmailData {
  referenceId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  enquiryType: string;
  propertyTitle?: string | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
  message: string;
}

export interface EmailDispatchResult {
  attempted: boolean;
  delivered: boolean;
  provider?: string;
  error?: string;
}

/**
 * Dispatches an email notification to the advisory desk and optional customer receipt.
 * Uses Resend API when RESEND_API_KEY is configured in server environment variables.
 * If no transactional email provider is configured, this safely logs a notice and returns
 * without failing or interrupting database persistence.
 */
export async function dispatchEnquiryEmailNotification(data: EnquiryEmailData): Promise<EmailDispatchResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const destinationEmail = process.env.ENQUIRY_NOTIFICATION_EMAIL || agencyConfig.contact.conciergeEmail;
  const fromEmail = process.env.ENQUIRY_FROM_EMAIL || 'Atelier Estates <notifications@atelierestates.com>';

  if (!resendApiKey) {
    // No email provider is configured.
    console.info(`[email] stage=skip reason=no_provider_configured reference=${data.referenceId}`);
    return {
      attempted: false,
      delivered: false,
      error: 'RESEND_API_KEY is not configured in environment variables.',
    };
  }

  const subject = `New Advisory Enquiry: ${data.referenceId} — ${data.fullName}${data.propertyTitle ? ` (${data.propertyTitle})` : ''}`;

  const textBody = `
ATELIER ESTATES — ADVISORY DESK ENQUIRY
Reference: ${data.referenceId}
Date: ${new Date().toUTCString()}

CUSTOMER DETAILS:
Name: ${data.fullName}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}

ENQUIRY CONTEXT:
Type: ${data.enquiryType}
Property: ${data.propertyTitle || 'General Enquiry'}
${data.preferredDate ? `Preferred Viewing Date: ${data.preferredDate}` : ''}
${data.preferredTime ? `Preferred Viewing Time: ${data.preferredTime}` : ''}

MESSAGE:
${data.message}
  `.trim();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [destinationEmail],
        reply_to: data.email,
        subject,
        text: textBody,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown Resend error');
      console.error(`[email] stage=send-failed provider=resend status=${response.status} error=${errorText}`);
      return {
        attempted: true,
        delivered: false,
        provider: 'resend',
        error: `Provider rejected request with status ${response.status}`,
      };
    }

    const result = await response.json().catch(() => ({}));
    console.info(`[email] stage=delivered provider=resend reference=${data.referenceId} id=${result.id ?? 'unknown'}`);
    return {
      attempted: true,
      delivered: true,
      provider: 'resend',
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown network failure';
    console.error(`[email] stage=exception provider=resend error=${errorMessage}`);
    return {
      attempted: true,
      delivered: false,
      provider: 'resend',
      error: errorMessage,
    };
  }
}
