// backend/src/services/emailService.js
import nodemailer from 'nodemailer';
import crypto from 'crypto';

let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST) {
    // Dev mode: auto Ethereal test account — preview URL printed to terminal
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('[EmailService] Ethereal test account:', testAccount.user);
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  return transporter;
}

function generateOTP() {
  const bytes = crypto.randomBytes(3);
  return String((bytes.readUIntBE(0, 3) % 900000) + 100000);
}

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');

function buildOTPEmail(otp, name = 'there') {
  const appName = process.env.APP_NAME || 'ImageGen';
  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body{margin:0;padding:0;background:#0f0f13;font-family:'Segoe UI',Arial,sans-serif}
  .wrap{max-width:480px;margin:40px auto;background:#1a1a24;border-radius:16px;overflow:hidden}
  .head{background:linear-gradient(135deg,#7c3aed,#2563eb);padding:32px 40px;text-align:center}
  .head h1{margin:0;color:#fff;font-size:24px;font-weight:700}
  .head p{margin:6px 0 0;color:rgba(255,255,255,.75);font-size:14px}
  .body{padding:36px 40px}
  .msg{color:#e2e8f0;font-size:15px;margin:0 0 20px}
  .box{background:#0f0f18;border:2px solid #7c3aed;border-radius:12px;text-align:center;padding:24px;margin:24px 0}
  .lbl{color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px}
  .code{font-size:42px;font-weight:800;color:#a78bfa;letter-spacing:12px;margin:0;font-family:'Courier New',monospace}
  .exp{color:#64748b;font-size:13px;margin:16px 0 0}
  .note{color:#64748b;font-size:13px;line-height:1.6;margin:20px 0 0}
  .foot{border-top:1px solid #2d2d3d;padding:20px 40px;text-align:center}
  .foot p{color:#475569;font-size:12px;margin:0}
</style></head><body>
<div class="wrap">
  <div class="head"><h1>🎨 ${appName}</h1><p>AI Image Generation</p></div>
  <div class="body">
    <p class="msg">Hi ${name},</p>
    <p class="msg" style="color:#94a3b8;font-size:14px;margin-top:-10px">Enter the code below to verify your email and activate your account.</p>
    <div class="box">
      <p class="lbl">Your verification code</p>
      <p class="code">${otp}</p>
      <p class="exp">Expires in ${OTP_EXPIRY_MINUTES} minutes</p>
    </div>
    <p class="note">If you didn't request this, you can safely ignore this email.</p>
  </div>
  <div class="foot"><p>© ${new Date().getFullYear()} ${appName} · Automated message, do not reply.</p></div>
</div>
</body></html>`;
  const text = `Hi ${name},\n\nYour ${appName} verification code is: ${otp}\n\nExpires in ${OTP_EXPIRY_MINUTES} minutes.\n\nIf you didn't request this, ignore this email.`;
  return { html, text };
}

export async function sendOTPEmail(toEmail, toName) {
  const otp = generateOTP();
  const transport = await getTransporter();
  const { html, text } = buildOTPEmail(otp, toName);
  const appName = process.env.APP_NAME || 'ImageGen';

  const info = await transport.sendMail({
    from: `"${appName}" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@imagegen.ai'}>`,
    to: toEmail,
    subject: `${otp} is your ${appName} verification code`,
    text,
    html,
  });

  const previewURL = nodemailer.getTestMessageUrl(info);
  if (previewURL) console.log(`[EmailService] Preview: ${previewURL}`);

  return otp;
}

export function otpExpiresAt() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + OTP_EXPIRY_MINUTES);
  return d;
}

export { OTP_EXPIRY_MINUTES };