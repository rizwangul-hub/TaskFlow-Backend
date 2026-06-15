import nodemailer from "nodemailer";
import logger from "./logger.js";

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const port = parseInt(process.env.EMAIL_PORT, 10) || 587;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

/**
 * Send an email using the shared Nodemailer transporter.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_FROM) {
    throw new Error("Email configuration is incomplete");
  }

  const message = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  };

  const info = await getTransporter().sendMail(message);
  logger.info(`Email sent to ${to} [${info.messageId}]`);
  return info;
};

/**
 * Send email without interrupting the caller on failure.
 */
export const sendEmailSafe = async (options) => {
  try {
    await sendEmail(options);
  } catch (error) {
    logger.error(`Email delivery failed for ${options.to}: ${error.message}`);
  }
};

export default sendEmail;
