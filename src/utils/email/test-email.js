import { sendMail } from './index.js';

/**
 * Test email functionality without sending actual emails
 * This will log the email content to console for testing
 */
export const testEmailSending = async () => {
  console.log('🧪 Testing email functionality...');
  
  try {
    // Test email configuration
    const testEmail = {
      to: 'test@example.com',
      subject: 'Saraha App - Test Email',
      text: 'This is a test email from Saraha App. OTP: 123456',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #2c3e50;">Email Test Successful!</h2>
          <p>This is a test email from Saraha App.</p>
          <p><strong>OTP Code: 123456</strong></p>
          <p>If you received this, your email configuration is working correctly!</p>
          <p style="color: #7f8c8d; font-size: 12px;">
            Sent at: ${new Date().toLocaleString()}
          </p>
        </div>
      `
    };
    
    console.log('📧 Email details:');
    console.log('- To:', testEmail.to);
    console.log('- Subject:', testEmail.subject);
    console.log('- Text content:', testEmail.text);
    console.log('- HTML content preview:', testEmail.html.substring(0, 100) + '...');
    
    // Try to send the email (will fail if email not configured, but that's expected)
    try {
      const result = await sendMail(testEmail);
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', result.messageId);
      return true;
    } catch (emailError) {
      console.log('⚠️  Email sending failed (expected during development):');
      console.log('Error:', emailError.message);
      console.log('📝 Email content would have been:');
      console.log(JSON.stringify(testEmail, null, 2));
      console.log('💡 To enable actual email sending, configure EMAIL_USER and EMAIL_PASS in .env file');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    return false;
  }
};

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEmailSending().then(success => {
    process.exit(success ? 0 : 1);
  });
}
