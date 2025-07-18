import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Types and interfaces
interface PersonalInfo {
  email?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

interface ApplicationData {
  id: string;
  licenseType: string;
  status: string;
  submittedAt: string;
  reviewNotes?: string | null;
  personal_info?: PersonalInfo;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface BatchEmailResult {
  applicationId: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

type ApplicationAction = 'APPROVED' | 'REJECTED';

// Create transporter with actual credentials
const createTransporter = (): Transporter => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'himbazaalain022@gmail.com',
      pass: 'cchvwmsrqzffcczo',
    },
  });
};

// Email templates
const getEmailTemplate = (action: ApplicationAction, applicationData: ApplicationData): EmailTemplate => {
  const isApproved = action === 'APPROVED';
  const status = isApproved ? 'approved' : 'rejected';
  const statusColor = isApproved ? '#10B981' : '#EF4444';
  
  return {
    subject: `License Application ${isApproved ? 'Approved' : 'Rejected'} - ${applicationData.licenseType}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>License Application ${status}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">License Application ${isApproved ? 'Approved' : 'Rejected'}</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: ${statusColor}; color: white; padding: 15px 30px; border-radius: 50px; display: inline-block; font-weight: bold; font-size: 16px;">
                ${isApproved ? '✅ APPROVED' : '❌ REJECTED'}
              </div>
            </div>
            
            <h2 style="color: #374151; margin-bottom: 20px;">Application Details</h2>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 10px 0;"><strong>Application ID:</strong> ${applicationData.id}</p>
              <p style="margin: 10px 0;"><strong>License Type:</strong> ${applicationData.licenseType}</p>
              <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${applicationData.status}</span></p>
              <p style="margin: 10px 0;"><strong>Submitted:</strong> ${new Date(applicationData.submittedAt).toLocaleDateString()}</p>
              <p style="margin: 10px 0;"><strong>Processed:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            ${applicationData.reviewNotes ? `
              <h3 style="color: #374151; margin-bottom: 15px;">Review Notes</h3>
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <p style="margin: 0; font-style: italic;">${applicationData.reviewNotes}</p>
              </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              ${isApproved ? `
                <h3 style="color: #10B981; margin-bottom: 15px;">🎉 Congratulations!</h3>
                <p>Your license application has been approved. You can now proceed with the next steps in the licensing process.</p>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="http://localhost:3000/application/${applicationData.id}" style="background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    View in Dashboard
                  </a>
                </div>
              ` : `
                <h3 style="color: #EF4444; margin-bottom: 15px;">Application Status</h3>
                <p>Unfortunately, your license application has been rejected. Please review the notes above and consider resubmitting with the necessary corrections.</p>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="http://localhost:3000/apply" style="background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Submit New Application
                  </a>
                </div>
              `}
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p>If you have any questions, please contact our support team.</p>
              <p>© ${new Date().getFullYear()} License Management System</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      License Application ${status.toUpperCase()}
      
      Dear Applicant,
      
      Your license application has been ${status}.
      
      Application Details:
      - Application ID: ${applicationData.id}
      - License Type: ${applicationData.licenseType}
      - Status: ${applicationData.status}
      - Submitted: ${new Date(applicationData.submittedAt).toLocaleDateString()}
      - Processed: ${new Date().toLocaleDateString()}
      
      ${applicationData.reviewNotes ? `Review Notes: ${applicationData.reviewNotes}` : ''}
      
      ${isApproved ? 
        'Congratulations! Your license application has been approved.' : 
        'Unfortunately, your license application has been rejected. Please review the notes and consider resubmitting.'
      }
      
      Best regards,
      License Management System
    `
  };
};

// Send email function
export const sendApplicationStatusEmail = async (
  email: string, 
  action: ApplicationAction, 
  applicationData: ApplicationData
): Promise<EmailResult> => {
  try {
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    
    const emailTemplate = getEmailTemplate(action, applicationData);
    
    const mailOptions = {
      from: `"License Management System" <no-reply@dlvburundi.com>`,
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

// Batch email function
export const sendBatchApplicationStatusEmails = async (
  applications: ApplicationData[], 
  action: ApplicationAction
): Promise<BatchEmailResult[]> => {
  const results: BatchEmailResult[] = [];
  
  for (const app of applications) {
    try {
      const email = app.personal_info?.email;
      if (!email) {
        console.warn(`⚠️ No email found for application ${app.id}`);
        results.push({ applicationId: app.id, success: false, error: 'No email address' });
        continue;
      }
      
      const result = await sendApplicationStatusEmail(email, action, app);
      results.push({ applicationId: app.id, ...result });
      
      // Add delay between emails to avoid overwhelming SMTP server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error sending email for application ${app.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ applicationId: app.id, success: false, error: errorMessage });
    }
  }
  
  return results;
};

// Test email function (useful for development)
export const testEmailConnection = async (): Promise<EmailResult> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    console.log('✅ SMTP connection successful');
    return { success: true };
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

// Export types for use in other files
export type {
  ApplicationData,
  EmailResult,
  BatchEmailResult,
  ApplicationAction,
  PersonalInfo
};