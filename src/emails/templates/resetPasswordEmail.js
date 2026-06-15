export const resetPasswordEmail = ({ name, resetToken }) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
  const expireMinutes =
    parseInt(process.env.RESET_PASSWORD_EXPIRE_MS, 10) / 60000 || 10;

  const subject = "TaskFlow Password Reset";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to choose a new password.</p>
      <p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">
          Reset Password
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">This link expires in ${expireMinutes} minutes.</p>
      <p style="color: #6b7280; font-size: 14px;">If you did not request a password reset, you can safely ignore this email.</p>
    </div>
  `;

  const text = `Hi ${name}, reset your password: ${resetUrl}. This link expires in ${expireMinutes} minutes.`;

  return { subject, html, text };
};

export default resetPasswordEmail;
