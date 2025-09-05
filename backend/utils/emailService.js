const nodemailer = require('nodemailer');

/**
 * Email Service for Notifications
 * Handles sending email notifications to teachers
 * Uses nodemailer with SMTP configuration
 */

// Email configuration - should be moved to environment variables in production
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

/**
 * Send email notification to teacher
 * @param {Object} notificationData - Notification data
 * @param {number} notificationData.teacherId - Teacher ID
 * @param {string} notificationData.studentName - Student name
 * @param {string} notificationData.studentEmail - Student email
 * @param {string} notificationData.rollNumber - Student roll number
 * @param {string} notificationData.batchName - Batch name
 * @param {string} notificationData.type - Notification type
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {number} notificationData.submissionId - Submission ID (if applicable)
 * @param {number} notificationData.batchId - Batch ID
 */
const sendEmailNotification = async (notificationData) => {
  try {
    const {
      teacherId,
      studentName,
      studentEmail,
      rollNumber,
      batchName,
      type,
      title,
      message,
      submissionId,
      batchId
    } = notificationData;

    // Get teacher email from database
    const teacherEmail = await getTeacherEmail(teacherId);
    if (!teacherEmail) {
      console.error('Teacher email not found for ID:', teacherId);
      return;
    }

    // Generate email content based on notification type
    const emailContent = generateEmailContent({
      studentName,
      studentEmail,
      rollNumber,
      batchName,
      type,
      title,
      message,
      submissionId,
      batchId
    });

    // Email options
    const mailOptions = {
      from: `"Practical Portal" <${emailConfig.auth.user}>`,
      to: teacherEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email notification sent:', info.messageId);

    return info;

  } catch (error) {
    console.error('Error sending email notification:', error);
    throw error;
  }
};

/**
 * Get teacher email from database
 * @param {number} teacherId - Teacher ID
 * @returns {string|null} Teacher email
 */
const getTeacherEmail = async (teacherId) => {
  try {
    const { pool } = require('../db/connection');
    const query = 'SELECT email FROM users WHERE user_id = ? AND role = "teacher"';
    const [result] = await pool.execute(query, [teacherId]);
    
    return result.length > 0 ? result[0].email : null;
  } catch (error) {
    console.error('Error fetching teacher email:', error);
    return null;
  }
};

/**
 * Generate email content based on notification type
 * @param {Object} data - Notification data
 * @returns {Object} Email content with subject, html, and text
 */
const generateEmailContent = (data) => {
  const {
    studentName,
    studentEmail,
    rollNumber,
    batchName,
    type,
    title,
    message,
    submissionId,
    batchId
  } = data;

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const submissionUrl = submissionId 
    ? `${baseUrl}/teachers/batch/${batchId}?submission=${submissionId}`
    : `${baseUrl}/teachers/batch/${batchId}`;

  let subject, actionText, icon;

  switch (type) {
    case 'submission':
      subject = `New Submission from ${studentName} in ${batchName}`;
      actionText = 'submitted a new post';
      icon = '📝';
      break;
    case 'announcement':
      subject = `New Announcement in ${batchName}`;
      actionText = 'created an announcement';
      icon = '📢';
      break;
    case 'batch_join':
      subject = `${studentName} joined ${batchName}`;
      actionText = 'joined the batch';
      icon = '👋';
      break;
    default:
      subject = `New Notification in ${batchName}`;
      actionText = 'performed an action';
      icon = '🔔';
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .icon {
          font-size: 48px;
          margin-bottom: 10px;
        }
        .title {
          color: #2c3e50;
          margin: 0;
          font-size: 24px;
        }
        .content {
          margin-bottom: 30px;
        }
        .student-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .student-name {
          font-weight: bold;
          color: #2c3e50;
          font-size: 18px;
        }
        .student-details {
          color: #6c757d;
          font-size: 14px;
          margin-top: 5px;
        }
        .message {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #2196f3;
          margin: 20px 0;
        }
        .cta-button {
          display: inline-block;
          background: #007bff;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 20px 0;
        }
        .cta-button:hover {
          background: #0056b3;
        }
        .footer {
          text-align: center;
          color: #6c757d;
          font-size: 12px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">${icon}</div>
          <h1 class="title">${subject}</h1>
        </div>
        
        <div class="content">
          <div class="student-info">
            <div class="student-name">${studentName}</div>
            <div class="student-details">
              ${rollNumber ? `Roll Number: ${rollNumber}<br>` : ''}
              Email: ${studentEmail}<br>
              Batch: ${batchName}
            </div>
          </div>
          
          <p><strong>${studentName}</strong> ${actionText} in <strong>${batchName}</strong>.</p>
          
          ${message ? `
            <div class="message">
              <strong>Message:</strong><br>
              ${message}
            </div>
          ` : ''}
          
          <p>Click the button below to view and respond to this notification:</p>
          
          <a href="${submissionUrl}" class="cta-button">
            View in Practical Portal
          </a>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from Practical Portal.</p>
          <p>You can manage your notification preferences in your account settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${subject}

${studentName} ${actionText} in ${batchName}.

Student Details:
${rollNumber ? `Roll Number: ${rollNumber}` : ''}
Email: ${studentEmail}
Batch: ${batchName}

${message ? `Message: ${message}` : ''}

View this notification: ${submissionUrl}

---
This is an automated notification from Practical Portal.
You can manage your notification preferences in your account settings.
  `;

  return { subject, html, text };
};

/**
 * Test email configuration
 * @returns {Promise<boolean>} Success status
 */
const testEmailConfiguration = async () => {
  try {
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

module.exports = {
  sendEmailNotification,
  testEmailConfiguration
};
