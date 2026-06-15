export const taskAssignedEmail = ({
  assigneeName,
  taskTitle,
  boardTitle,
  priority,
  dueDate,
  assignedByName,
  taskId,
}) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const taskUrl = `${frontendUrl}/tasks/${taskId}`;
  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not set";

  const subject = `New task assigned: ${taskTitle}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">You have been assigned a task</h2>
      <p>Hi ${assigneeName},</p>
      <p><strong>${assignedByName}</strong> assigned you a new task on board <strong>${boardTitle}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Task</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${taskTitle}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Priority</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${priority}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Due Date</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formattedDueDate}</td></tr>
      </table>
      <p>
        <a href="${taskUrl}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">
          View Task
        </a>
      </p>
    </div>
  `;

  const text = `Hi ${assigneeName}, ${assignedByName} assigned you "${taskTitle}" on ${boardTitle}. Priority: ${priority}. Due: ${formattedDueDate}. View: ${taskUrl}`;

  return { subject, html, text };
};

export default taskAssignedEmail;
