// src/lib/mailer.js
import nodemailer from "nodemailer";

let _transporter;

/**
 * Create or reuse a singleton transporter.
 * For Brevo on port 587 -> secure:false
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP env vars missing (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS).");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 587 => false, 465 => true
    auth: { user, pass },
    pool: true,
    // Brevo sometimes needs this for certain node/OpenSSL builds:
    tls: {
      // Leave rejectUnauthorized true for production. If your local CA is odd, set false temporarily.
      rejectUnauthorized: true,
      // ciphers: "TLSv1.2" // uncomment if you see TLS handshake errors
    },
  });

  return transporter;
}

export function getTransporter() {
  if (!_transporter) _transporter = createTransporter();
  return _transporter;
}

/**
 * Sends an email and returns { messageId }.
 * Throws on error (so API route can log & return useful message).
 */
export async function sendMail({ to, subject, html, text }) {
  const from = process.env.SMTP_FROM || 'Lessn <no-reply@localhost>';
  const transporter = getTransporter();

  // Make sure credentials/sender are accepted by the SMTP
  await transporter.verify();

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });

  return { messageId: info.messageId };
}
