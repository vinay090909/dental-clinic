const nodemailer = require('nodemailer');

// Setup Transporter with real or automated test fallback
const createTransporter = async () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // Default: Return a test transporter with jsonTransport or console log
    return nodemailer.createTransport({
        jsonTransport: true
    });
};

const sendBookingConfirmationEmail = async (appointment) => {
    try {
        const transporter = await createTransporter();

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
            .email-card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #0284c7, #0d9488); padding: 32px 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
            .header p { margin: 6px 0 0; opacity: 0.9; font-size: 14px; }
            .badge { display: inline-block; background: #dcfce7; color: #166534; font-weight: 700; font-size: 13px; padding: 6px 14px; border-radius: 20px; margin-top: 16px; }
            .content { padding: 28px 24px; }
            .receipt-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 18px; margin-bottom: 24px; }
            .receipt-title { font-size: 13px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
            .receipt-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; }
            .receipt-row.total { border-top: 1.5px dashed #bae6fd; padding-top: 10px; margin-top: 10px; font-weight: 800; font-size: 16px; color: #0369a1; }
            .details-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px; }
            .detail-item { margin-bottom: 12px; }
            .detail-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; }
            .detail-value { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px; }
            .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="email-card">
            <div class="header">
              <h1>SmileCare Dental Clinic</h1>
              <p>Specialist Dental & Implant Center</p>
              <div class="badge">Payment Received & Appointment Confirmed</div>
            </div>

            <div class="content">
              <p style="font-size: 15px; line-height: 1.5;">
                Dear <strong>${appointment.patientName}</strong>,<br>
                Thank you for choosing SmileCare. Your appointment has been scheduled and your consultation fee has been processed successfully.
              </p>

              <!-- Payment Receipt -->
              <div class="receipt-box">
                <div class="receipt-title">Payment Receipt & Transaction Summary</div>
                <div class="receipt-row">
                  <span style="color: #64748b;">Transaction ID:</span>
                  <strong style="font-family: monospace;">${appointment.transactionId || 'TXN-DIRECT'}</strong>
                </div>
                <div class="receipt-row">
                  <span style="color: #64748b;">Payment Method:</span>
                  <strong>${appointment.paymentMethod || 'UPI / Online'}</strong>
                </div>
                <div class="receipt-row">
                  <span style="color: #64748b;">Payment Status:</span>
                  <span style="color: #166534; font-weight: 800;">${appointment.paymentStatus || 'Paid'} &#x2705;</span>
                </div>
                <div class="receipt-row total">
                  <span>Amount Paid:</span>
                  <span>&#x20B9;${appointment.amountPaid || appointment.consultationFee || 500}</span>
                </div>
              </div>

              <!-- Appointment Slip -->
              <div class="details-box">
                <div class="receipt-title" style="color: #0d9488;">Consultation Schedule</div>
                <div class="detail-item">
                  <div class="detail-label">Appointment Token ID</div>
                  <div class="detail-value" style="color: #0284c7; font-family: monospace;">${appointment.appointmentId}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Specialist Doctor</div>
                  <div class="detail-value">${appointment.doctorName}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Scheduled Date & Time</div>
                  <div class="detail-value">${appointment.date} at ${appointment.timeSlot}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Treatment / Reason</div>
                  <div class="detail-value">${appointment.serviceType}</div>
                </div>
                <div class="detail-item" style="margin-bottom: 0;">
                  <div class="detail-label">Clinic Location</div>
                  <div class="detail-value" style="font-weight: 500; font-size: 14px;">42, Health Avenue, Medical Enclave, Punjab</div>
                </div>
              </div>

              <p style="font-size: 13px; color: #64748b; text-align: center;">
                Need to reschedule or have an emergency? Call our 24/7 hotline at <strong>+91 1800-419-DENT</strong>.
              </p>
            </div>

            <div class="footer">
              &copy; 2026 SmileCare Dental Clinic. All rights reserved.<br>
              This is an automated payment receipt and booking confirmation.
            </div>
          </div>
        </body>
        </html>
        `;

        const mailOptions = {
            from: process.env.SMTP_FROM || '"SmileCare Dental Clinic" <appointments@smilecare.com>',
            to: appointment.userEmail,
            subject: `🦷 SmileCare Clinic - Appointment Confirmed & Payment Receipt (${appointment.appointmentId})`,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 [EMAIL SENT] Confirmation & Payment receipt delivered to ${appointment.userEmail}`);
        console.log(`   Appointment: ${appointment.appointmentId} | Txn: ${appointment.transactionId}`);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error('⚠️ Failed to send confirmation email:', err.message);
        return { success: false, error: err.message };
    }
};

module.exports = {
    sendBookingConfirmationEmail
};
