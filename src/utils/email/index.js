import nodemailer from 'nodemailer';

console.log('Initializing email transporter...');
console.log('Using email:', process.env.EMAIL_USER);

const emailConfigs = {
  gmail: {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true,
    logger: true
  },
  outlook: {
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    debug: true,
    logger: true
  },
  yahoo: {
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    debug: true,
    logger: true
  }
};

let transporter;

const createTransporter = () => {
  console.log('Creating email transporter...');
  
  try {
    transporter = nodemailer.createTransport(emailConfigs.gmail);
    console.log('Gmail transporter created successfully');
    return transporter;
  } catch (gmailError) {
    console.warn('Gmail configuration failed, trying Outlook...');
    console.error('Gmail error:', gmailError.message);
  }

  try {
    transporter = nodemailer.createTransport(emailConfigs.outlook);
    console.log('Outlook transporter created successfully');
    return transporter;
  } catch (outlookError) {
    console.warn('Outlook configuration failed, trying Yahoo...');
    console.error('Outlook error:', outlookError.message);
  }

  try {
    transporter = nodemailer.createTransport(emailConfigs.yahoo);
    console.log('Yahoo transporter created successfully');
    return transporter;
  } catch (yahooError) {
    console.error('All email configurations failed');
    console.error('Yahoo error:', yahooError.message);
    throw new Error('Failed to create email transporter with any provider');
  }
};

transporter = createTransporter();

const verifyEmailConnection = async (retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Verifying email connection (attempt ${i + 1}/${retries})...`);
      const success = await transporter.verify();
      console.log('Email server connection verified successfully');
      return true;
    } catch (error) {
      console.error(`Email verification failed (attempt ${i + 1}):`);
      console.error('Error code:', error.code);
      console.error('Command:', error.command);
      console.error('Response:', error.response);
      
      if (i === retries - 1) {
        console.error('All verification attempts failed');
        return false;
      }
      
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

verifyEmailConnection().then(success => {
  if (success) {
    console.log('Email service is ready!');
  } else {
    console.warn('Email service may not work properly');
  }
});

export const sendMail = async (options) => {
  console.log('Preparing to send email...');
  console.log('To:', options.to);
  console.log('Subject:', options.subject);
  
  try {
    options.from = options.from || `"Saraha App" <${process.env.EMAIL_USER}>`;
    
    console.log('From:', options.from);
    console.log('Sending email...');
    
    const info = await transporter.sendMail(options);
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    console.log('Response:', info.response);
    
    return info;
  } catch (error) {
    console.error('Failed to send email');
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Command:', error.command);
    console.error('Response:', error.response);
    console.error('Stack:', error.stack);
    
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Please check email and password');
    } else if (error.code === 'ECONNECTION') {
      console.error('Connection failed. Please check internet and firewall');
    }
    
    throw error;
  }
};

export const testEmailConnection = async () => {
  try {
    console.log('Testing email connection...');
    const testResult = await verifyEmailConnection();
    
    if (testResult) {
      const testEmail = {
        to: process.env.EMAIL_USER,
        subject: 'Saraha App - Email Test',
        text: 'This is a test email from Saraha App.',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2c3e50;">Email Test Successful!</h2>
            <p>This is a test email from Saraha App.</p>
            <p>If you received this, your email configuration is working correctly!</p>
            <p style="color: #7f8c8d; font-size: 12px;">
              Sent at: ${new Date().toLocaleString()}
            </p>
          </div>
        `
      };
      
      const result = await sendMail(testEmail);
      return {
        success: true,
        message: 'Email test completed successfully',
        messageId: result.messageId
      };
    } else {
      return {
        success: false,
        message: 'Email connection verification failed'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Email test failed: ${error.message}`,
      error: error.response || error.code
    };
  }
};

export { transporter };
