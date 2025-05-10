// A simple script to test the email functionality
import '../lib/email.js'; // Just to ensure it compiles
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a test transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Test email function
async function sendTestEmail() {
  console.log('Testing email functionality with the following configuration:');
  console.log(`- Host: ${process.env.EMAIL_HOST}`);
  console.log(`- Port: ${process.env.EMAIL_PORT}`);
  console.log(`- User: ${process.env.EMAIL_USER}`);
  
  // Test email address - REPLACE WITH YOUR OWN or use EMAIL_USER
  const testEmail = process.env.EMAIL_USER;
  
  if (!testEmail) {
    console.error('No test email address available. Please set EMAIL_USER in your .env file.');
    return false;
  }
  
  const templateHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h1 style="color: #6b46c1; text-align: center;">Test Email</h1>
      <p>This is a test email to verify that your email configuration is working properly.</p>
      <div style="background-color: #f8f4ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h2 style="color: #6b46c1; margin-top: 0;">Configuration Details</h2>
        <p><strong>Host:</strong> ${process.env.EMAIL_HOST}</p>
        <p><strong>Port:</strong> ${process.env.EMAIL_PORT}</p>
        <p><strong>User:</strong> ${process.env.EMAIL_USER}</p>
        <p><strong>Secure:</strong> ${process.env.EMAIL_SECURE}</p>
      </div>
      <p>If you're seeing this email, your configuration is correct!</p>
      <p>Best regards,<br>The Vocea Campusului Team</p>
    </div>
  `;
  
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Vocea Campusului'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: 'Email Configuration Test',
      text: 'This is a test email to verify that your email configuration is working properly.',
      html: templateHtml,
    });
    
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    return false;
  }
}

// Execute the test
sendTestEmail()
  .then((success) => {
    console.log(success ? 'Email test completed successfully!' : 'Email test failed.');
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Unexpected error in email test:', err);
    process.exit(1);
  }); 