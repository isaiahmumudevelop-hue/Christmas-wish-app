import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // NOT your regular password, use an App Password
  },
});

export async function sendVerificationEmail(to: string, token: string) {
  const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000"}/api/auth/verify?token=${token}`;
  
  await transporter.sendMail({
    from: `"Christmas Wish" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Verify your email for Christmas Wish",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e11d48;">Welcome to Christmas Wish!</h1>
        <p>Please click the button below to verify your email address and activate your account.</p>
        <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background: #e11d48; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
          Verify Email Address
        </a>
        <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link:</p>
        <p style="color: #666; font-size: 14px;">${verifyLink}</p>
      </div>
    `,
  });
}
