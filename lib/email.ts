import nodemailer from 'nodemailer';

// Configure the email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Types
interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface SubscriptionEmailData {
  name: string;
  planName: string;
  endDate: Date;
  isRecurring: boolean;
  language?: string;
}

/**
 * Send a generic email
 */
export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Vocea Campusului'}" <${process.env.EMAIL_FROM || 'noreply@voceacampusului.ro'}>`,
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a subscription confirmation email
 */
export async function sendSubscriptionConfirmationEmail(
  to: string,
  data: SubscriptionEmailData
): Promise<boolean> {
  const { name, planName, endDate, isRecurring, language = 'en' } = data;
  
  // Format date based on locale
  const formattedDate = endDate.toLocaleDateString(language === 'ro' ? 'ro-RO' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Create email content based on language
  const subject = language === 'ro' 
    ? `Confirmare abonament ${planName}` 
    : `${planName} Subscription Confirmation`;

  // Multilingual templates
  let html: string;
  
  if (language === 'ro') {
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #6b46c1; text-align: center;">Confirmare Abonament</h1>
        <p>Salut ${name},</p>
        <p>Îți mulțumim pentru achiziționarea abonamentului <strong>${planName}</strong>.</p>
        <div style="background-color: #f8f4ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h2 style="color: #6b46c1; margin-top: 0;">Detalii Abonament</h2>
          <p><strong>Plan:</strong> ${planName}</p>
          <p><strong>Status:</strong> Activ</p>
          ${isRecurring 
            ? `<p><strong>Reînnoire automată:</strong> Da, pe ${formattedDate}</p>` 
            : `<p><strong>Valabil până la:</strong> ${formattedDate}</p>`}
        </div>
        <p>Acum poți să te bucuri de toate beneficiile planului tău. Dacă ai întrebări sau ai nevoie de asistență, te rugăm să ne contactezi.</p>
        <p>Cu stimă,<br>Echipa Vocea Campusului</p>
      </div>
    `;
  } else {
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #6b46c1; text-align: center;">Subscription Confirmation</h1>
        <p>Hello ${name},</p>
        <p>Thank you for purchasing the <strong>${planName}</strong> subscription.</p>
        <div style="background-color: #f8f4ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h2 style="color: #6b46c1; margin-top: 0;">Subscription Details</h2>
          <p><strong>Plan:</strong> ${planName}</p>
          <p><strong>Status:</strong> Active</p>
          ${isRecurring 
            ? `<p><strong>Auto-renewal:</strong> Yes, on ${formattedDate}</p>` 
            : `<p><strong>Valid until:</strong> ${formattedDate}</p>`}
        </div>
        <p>You can now enjoy all the benefits of your plan. If you have any questions or need assistance, please contact us.</p>
        <p>Best regards,<br>The Vocea Campusului Team</p>
      </div>
    `;
  }

  // Plain text fallback
  const text = language === 'ro'
    ? `Confirmare Abonament\n\nSalut ${name},\n\nÎți mulțumim pentru achiziționarea abonamentului ${planName}.\n\nDetalii Abonament:\nPlan: ${planName}\nStatus: Activ\n${isRecurring ? `Reînnoire automată: Da, pe ${formattedDate}` : `Valabil până la: ${formattedDate}`}\n\nAcum poți să te bucuri de toate beneficiile planului tău. Dacă ai întrebări sau ai nevoie de asistență, te rugăm să ne contactezi.\n\nCu stimă,\nEchipa Vocea Campusului`
    : `Subscription Confirmation\n\nHello ${name},\n\nThank you for purchasing the ${planName} subscription.\n\nSubscription Details:\nPlan: ${planName}\nStatus: Active\n${isRecurring ? `Auto-renewal: Yes, on ${formattedDate}` : `Valid until: ${formattedDate}`}\n\nYou can now enjoy all the benefits of your plan. If you have any questions or need assistance, please contact us.\n\nBest regards,\nThe Vocea Campusului Team`;

  return sendEmail({
    to,
    subject,
    text,
    html,
  });
}

/**
 * Send a payment failed notification email
 */
export async function sendPaymentFailedEmail(
  to: string,
  planName: string,
  language: string = 'en'
): Promise<boolean> {
  const subject = language === 'ro' 
    ? `Plată eșuată pentru abonamentul ${planName}` 
    : `Payment Failed for ${planName} Subscription`;

  let html: string;
  
  if (language === 'ro') {
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #e53e3e; text-align: center;">Plată Eșuată</h1>
        <p>Ne pare rău, dar plata pentru abonamentul <strong>${planName}</strong> nu a putut fi procesată.</p>
        <p>Te rugăm să verifici detaliile de plată și să încerci din nou. Dacă problema persistă, contactează-ne pentru asistență.</p>
        <p>Cu stimă,<br>Echipa Vocea Campusului</p>
      </div>
    `;
  } else {
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #e53e3e; text-align: center;">Payment Failed</h1>
        <p>We're sorry, but the payment for your <strong>${planName}</strong> subscription could not be processed.</p>
        <p>Please check your payment details and try again. If the problem persists, contact us for assistance.</p>
        <p>Best regards,<br>The Vocea Campusului Team</p>
      </div>
    `;
  }

  const text = language === 'ro'
    ? `Plată Eșuată\n\nNe pare rău, dar plata pentru abonamentul ${planName} nu a putut fi procesată.\n\nTe rugăm să verifici detaliile de plată și să încerci din nou. Dacă problema persistă, contactează-ne pentru asistență.\n\nCu stimă,\nEchipa Vocea Campusului`
    : `Payment Failed\n\nWe're sorry, but the payment for your ${planName} subscription could not be processed.\n\nPlease check your payment details and try again. If the problem persists, contact us for assistance.\n\nBest regards,\nThe Vocea Campusului Team`;

  return sendEmail({
    to,
    subject,
    text,
    html,
  });
} 