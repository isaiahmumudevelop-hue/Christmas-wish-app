import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Your 16-character App Password
  },
});

// 1. Verification Email (For new accounts)
export async function sendVerificationEmail(to: string, token: string) {
  const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000"}/api/auth/verify?token=${token}`;
  
  await transporter.sendMail({
    from: `"Christmas Wish" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Verify your email for Christmas Wish",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #b91c1c;">Welcome to Christmas Wish!</h1>
        <p>Please click the button below to verify your email address and activate your account.</p>
        <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background: #b91c1c; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
          Verify Email Address
        </a>
      </div>
    `,
  });
}

// 2. Guardian Consent Email (For minors)
export async function sendGuardianConsentEmail(to: string, minorName: string, consentUrl: string) {
  await transporter.sendMail({
    from: `"Christmas Wish" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Action Required: Guardian Consent for ${minorName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #b91c1c;">Guardian Consent Required</h2>
        <p>Hello,</p>
        <p><strong>${minorName}</strong> has requested to join Christmas Wish, a platform where children can ask for verified gifts from sponsors.</p>
        <p>Because they are under 18, we need your permission as their parent or legal guardian before they can submit any wishes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${consentUrl}" style="display: inline-block; padding: 14px 28px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Review & Approve Consent
          </a>
        </div>
        <p style="font-size: 14px; color: #666;">If you do not recognize this request, you can safely ignore this email. The request will expire in 7 days.</p>
      </div>
    `,
  });
}
