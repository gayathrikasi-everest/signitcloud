
import { toast } from 'sonner';

// This is a publishable key for client-side usage
const RESEND_API_KEY = 're_ML76kd5j_JGNRQFFxM3N48wR9ue2nMuU2';

interface SendEmailProps {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async ({ to, subject, html, from = 'onboarding@resend.dev' }: SendEmailProps) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email');
    }
    
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    toast.error('Failed to send email. Please try again.');
    throw error;
  }
};
