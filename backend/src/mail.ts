import nodemailer from 'nodemailer';

import { config } from './config.js';

function hasMailConfig() {
  return Boolean(config.mailUser && config.mailPass && config.mailFrom);
}

const transporter = hasMailConfig()
  ? nodemailer.createTransport({
      host: config.mailHost,
      port: config.mailPort,
      secure: config.mailSecure,
      auth: {
        user: config.mailUser,
        pass: config.mailPass,
      },
    })
  : null;

export async function sendVerificationEmail(email: string, code: string) {
  if (!transporter) {
    console.log(`[MAIL MOCK] ${email} üçün təsdiq kodu: ${code}`);
    return;
  }

  await transporter.sendMail({
    from: config.mailFrom,
    to: email,
    subject: 'City Problem - Email təsdiq kodu',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Qeydiyyat təsdiqi</h2>
        <p>Hesabınızı təsdiqləmək üçün aşağıdakı kodu tətbiqə daxil edin:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 2px;">${code}</p>
        <p>Bu kod 10 dəqiqə etibarlıdır.</p>
      </div>
    `,
  });
}

