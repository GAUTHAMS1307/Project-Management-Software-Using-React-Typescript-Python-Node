import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set - email functionality will be disabled");
} else if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
  console.warn("SENDGRID_API_KEY does not appear to be a valid SendGrid API key (should start with 'SG.') - email functionality may not work");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_API_KEY.startsWith('SG.')) {
    console.error('SendGrid API key is not properly configured');
    return false;
  }

  try {
    await sgMail.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendTeamInvitation(email: string, teamName: string, inviterName: string): Promise<boolean> {
  const subject = `You're invited to join ${teamName}`;
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">Team Invitation</h2>
      <p>Hello!</p>
      <p><strong>${inviterName}</strong> has invited you to join the team <strong>${teamName}</strong> on Smart Project Pulse.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">What's Smart Project Pulse?</h3>
        <p>A comprehensive project management platform that helps teams collaborate, track tasks, and manage workflows efficiently.</p>
      </div>
      
      <p style="margin: 20px 0;">
        <a href="${process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/register" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Accept Invitation & Register
        </a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        If you're unable to click the button, copy and paste this link into your browser:<br>
        ${process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/register
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        This invitation was sent by ${inviterName} through Smart Project Pulse. 
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  `;
  
  const text = `
    Team Invitation
    
    Hello!
    
    ${inviterName} has invited you to join the team ${teamName} on Smart Project Pulse.
    
    Smart Project Pulse is a comprehensive project management platform that helps teams collaborate, track tasks, and manage workflows efficiently.
    
    To accept this invitation and register, visit: ${process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/register
    
    This invitation was sent by ${inviterName} through Smart Project Pulse. 
    If you didn't expect this invitation, you can safely ignore this email.
  `;

  return await sendEmail({
    to: email,
    from: 'noreply@smartprojectpulse.com', // You may need to verify this domain in SendGrid
    subject,
    html,
    text
  });
}