export const deadlineReminderEmail = ({
  assigneeName,
  taskTitle,
  boardTitle,
  priority,
  dueDate,
  taskId,
  hoursRemaining,
}) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const taskUrl = `${frontendUrl}/tasks/${taskId}`;
  const formattedDueDate = new Date(dueDate).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const subject = `Reminder: "${taskTitle}" is due soon`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Deadline Reminder</h2>
      <p>Hi ${assigneeName},</p>
      <p>Your task <strong>${taskTitle}</strong> on board <strong>${boardTitle}</strong> is due in approximately <strong>${hoursRemaining} hour(s)</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Priority</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${priority}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Due Date</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formattedDueDate}</td></tr>
      </table>
      <p>
        <a href="${taskUrl}" style="display: inline-block; padding: 10px 20px; background: #dc2626; color: #fff; text-decoration: none; border-radius: 6px;">
          View Task
        </a>
      </p>
    </div>
  `;

  const text = `Reminder: "${taskTitle}" on ${boardTitle} is due in ~${hoursRemaining}h (${formattedDueDate}). Priority: ${priority}. View: ${taskUrl}`;

  return { subject, html, text };
};

export default deadlineReminderEmail;
