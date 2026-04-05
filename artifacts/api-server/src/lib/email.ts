import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "Thoughts in Knots <hello@akshitkumar.com>";
const SITE_URL = process.env.SITE_URL ?? "https://akshitkumar.com";

export async function sendMagicLink(opts: {
  to: string;
  name: string;
  token: string;
  plan: string;
}) {
  const link = `${SITE_URL}/thoughtsinknots/activate?token=${opts.token}`;
  if (!resend) {
    console.log(`[email] magic-link for ${opts.to}: ${link}`);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Activate your Thoughts in Knots subscription",
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1f1a14; padding: 40px 24px;">
        <p style="font-size: 1.1rem; margin-bottom: 24px;">Hi ${opts.name},</p>
        <p style="line-height: 1.8; margin-bottom: 24px;">
          Thank you for subscribing to <em>Thoughts in Knots</em> (${opts.plan} plan). 
          Your payment has been received.
        </p>
        <p style="line-height: 1.8; margin-bottom: 32px;">
          Click the link below to set your password and activate your account. 
          This link expires in 24 hours.
        </p>
        <a href="${link}" style="display:inline-block; background:#1f1a14; color:#faf8f5; padding: 14px 28px; text-decoration:none; font-family: Georgia, serif; font-size: 0.95rem; letter-spacing: 0.05em;">
          Activate my account
        </a>
        <p style="margin-top: 40px; font-size: 0.85rem; color: #6b6560; line-height: 1.7;">
          Or paste this URL into your browser:<br/>
          <a href="${link}" style="color:#6b6560;">${link}</a>
        </p>
        <p style="margin-top: 40px; font-size: 0.9rem; line-height: 1.8;">
          Thank you for being here,<br/>
          <em>Akshit</em>
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(opts: { to: string; name: string }) {
  if (!resend) {
    console.log(`[email] welcome for ${opts.to}`);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Welcome to Thoughts in Knots",
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1f1a14; padding: 40px 24px;">
        <p style="font-size: 1.1rem; margin-bottom: 24px;">Hi ${opts.name},</p>
        <p style="line-height: 1.8; margin-bottom: 24px;">
          Your account is now active. You have full access to all issues of <em>Thoughts in Knots</em>.
        </p>
        <p style="line-height: 1.8; margin-bottom: 32px;">
          Head over to the archive to start reading.
        </p>
        <a href="${SITE_URL}/thoughtsinknots/" style="display:inline-block; background:#1f1a14; color:#faf8f5; padding: 14px 28px; text-decoration:none; font-family: Georgia, serif; font-size: 0.95rem; letter-spacing: 0.05em;">
          Read now
        </a>
        <p style="margin-top: 40px; font-size: 0.9rem; line-height: 1.8;">
          Thank you for being here,<br/>
          <em>Akshit</em>
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  token: string;
}) {
  const link = `${SITE_URL}/thoughtsinknots/reset-password?token=${opts.token}`;
  if (!resend) {
    console.log(`[email] password-reset for ${opts.to}: ${link}`);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Reset your Thoughts in Knots password",
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1f1a14; padding: 40px 24px;">
        <p style="font-size: 1.1rem; margin-bottom: 24px;">Hi ${opts.name},</p>
        <p style="line-height: 1.8; margin-bottom: 24px;">
          We received a request to reset your password.
        </p>
        <p style="line-height: 1.8; margin-bottom: 32px;">
          Click the link below to set a new password. This link expires in 1 hour.
        </p>
        <a href="${link}" style="display:inline-block; background:#1f1a14; color:#faf8f5; padding: 14px 28px; text-decoration:none; font-family: Georgia, serif; font-size: 0.95rem; letter-spacing: 0.05em;">
          Reset password
        </a>
        <p style="margin-top: 24px; font-size: 0.85rem; color: #6b6560; line-height: 1.7;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
