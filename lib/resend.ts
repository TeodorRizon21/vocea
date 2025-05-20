import { Resend } from 'resend';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface WelcomeEmailProps {
  name: string;
  email: string;
}

interface PaymentSuccessEmailProps {
  name: string;
  email: string;
  planName: string;
  amount: number;
  currency: string;
}

export async function sendWelcomeEmail({ name, email }: WelcomeEmailProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Vocea Campusului <noreply@voceacampusului.ro>',
      to: email,
      subject: 'Welcome to Vocea Campusului!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #6b46c1; text-align: center;">Welcome to Vocea Campusului!</h1>
          <p>Hello ${name},</p>
          <p>Thank you for creating an account with Vocea Campusului. We're excited to have you on board!</p>
          <div style="background-color: #f8f4ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #6b46c1; margin-top: 0;">Getting Started</h2>
            <p>Here are a few things you can do to get started:</p>
            <ul>
              <li>Complete your profile</li>
              <li>Browse our available plans</li>
              <li>Connect with other members</li>
            </ul>
          </div>
          <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The Vocea Campusului Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

export async function sendPaymentSuccessEmail({ name, email, planName, amount, currency }: PaymentSuccessEmailProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Vocea Campusului <noreply@voceacampusului.ro>',
      to: email,
      subject: 'Payment Successful - Vocea Campusului',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #6b46c1; text-align: center;">Payment Successful</h1>
          <p>Hello ${name},</p>
          <p>Thank you for your payment. Your transaction has been completed successfully.</p>
          <div style="background-color: #f8f4ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #6b46c1; margin-top: 0;">Payment Details</h2>
            <p><strong>Plan:</strong> ${planName}</p>
            <p><strong>Amount:</strong> ${amount} ${currency}</p>
            <p><strong>Status:</strong> Completed</p>
          </div>
          <p>You can now access all the features of your selected plan. If you have any questions or need assistance, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The Vocea Campusului Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending payment success email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending payment success email:', error);
    return false;
  }
} 