import { Resend } from 'resend';
import AccountCreationEmail from '../emails/account-creation';
import PlanUpdateEmail from '../emails/plan-update';
import PlanCancellationEmail from '../emails/plan-cancellation';
import { ContactFormEmail } from '../emails/contact-form';

// Check if Resend API key is available
const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY && process.env.NODE_ENV === 'production') {
  console.error('Missing RESEND_API_KEY environment variable');
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Helper function to check if email service is available
function isEmailServiceAvailable() {
  if (!resend) {
    console.warn('Email service not configured - emails will not be sent');
    return false;
  }
  return true;
}

// Account Creation Email
export async function sendAccountCreationEmail({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  if (!isEmailServiceAvailable()) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const data = await resend!.emails.send({
      from: 'Vocea Campusului <contact@voceacampusului.ro>',
      to: email,
      subject: 'Bun venit la Vocea Campusului! Contul tău este gata',
      react: AccountCreationEmail({ name }),
    });

    if (data.error) {
      throw data.error;
    }
    return { success: true, data };
  } catch (error) {
    console.error('[Email] Failed to send account creation email:', error);
    return { success: false, error };
  }
}

// Plan Update Email
export async function sendPlanUpdateEmail({
  name,
  email,
  planName,
  amount,
  currency,
}: {
  name: string;
  email: string;
  planName: string;
  amount: number;
  currency: string;
}) {
  if (!isEmailServiceAvailable()) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const data = await resend!.emails.send({
      from: 'Vocea Campusului <contact@voceacampusului.ro>',
      to: email,
      subject: 'Planul tău Vocea Campusului a fost actualizat',
      react: PlanUpdateEmail({ 
        name,
        planName,
        amount,
        currency
      }),
    });

    if (data.error) {
      throw data.error;
    }
    return { success: true, data };
  } catch (error) {
    console.error('[Email] Failed to send plan update email:', error);
    return { success: false, error };
  }
}

// Plan Cancellation Email
export async function sendPlanCancellationEmail({
  name,
  email,
  planName,
  endDate,
}: {
  name: string;
  email: string;
  planName: string;
  endDate: Date;
}) {
  if (!isEmailServiceAvailable()) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const data = await resend!.emails.send({
      from: 'Vocea Campusului <contact@voceacampusului.ro>',
      to: email,
      subject: 'Confirmare anulare plan Vocea Campusului',
      react: PlanCancellationEmail({ 
        name,
        planName,
        endDate: endDate.toLocaleDateString()
      }),
    });

    if (data.error) {
      throw data.error;
    }
    return { success: true, data };
  } catch (error) {
    console.error('[Email] Failed to send plan cancellation email:', error);
    return { success: false, error };
  }
}

// Contact Form Email
export async function sendContactFormEmail({
  name,
  email,
  contactType,
  subject,
  message,
}: {
  name: string;
  email: string;
  contactType: string;
  subject: string;
  message: string;
}) {
  if (!isEmailServiceAvailable()) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const data = await resend!.emails.send({
      from: 'Vocea Campusului <contact@voceacampusului.ro>',
      to: 'contact@voceacampusului.ro',
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
      react: ContactFormEmail({ 
        name,
        email,
        contactType,
        subject,
        message
      }),
    });

    if (data.error) {
      throw data.error;
    }
    return { success: true, data };
  } catch (error) {
    console.error('[Email] Failed to send contact form email:', error);
    return { success: false, error };
  }
} 