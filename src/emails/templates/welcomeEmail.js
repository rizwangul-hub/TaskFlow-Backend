export const welcomeEmail = ({ name }) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  const subject = "Welcome to TaskFlow";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to TaskFlow, ${name}!</h2>
      <p>Your account has been created successfully.</p>
      <p>Start organizing your work with boards, tasks, and team collaboration.</p>
      <p>
        <a href="${frontendUrl}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">
          Go to TaskFlow
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">If you did not create this account, please contact support.</p>
    </div>
  `;

  const text = `Welcome to TaskFlow, ${name}! Your account has been created. Visit ${frontendUrl} to get started.`;

  return { subject, html, text };
};

export default welcomeEmail;
