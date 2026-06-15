import { sendEmail, sendEmailSafe } from "../utils/sendEmail.js";
import welcomeEmail from "../emails/templates/welcomeEmail.js";
import taskAssignedEmail from "../emails/templates/taskAssignedEmail.js";
import resetPasswordEmail from "../emails/templates/resetPasswordEmail.js";
import deadlineReminderEmail from "../emails/templates/deadlineReminderEmail.js";

export const sendWelcomeEmail = async (user) => {
  const template = welcomeEmail({ name: user.name });
  await sendEmailSafe({
    to: user.email,
    ...template,
  });
};

export const sendTaskAssignedEmail = async ({
  assignee,
  task,
  board,
  assignedBy,
}) => {
  if (!assignee?.email) return;

  const template = taskAssignedEmail({
    assigneeName: assignee.name,
    taskTitle: task.title,
    boardTitle: board.title,
    priority: task.priority,
    dueDate: task.dueDate,
    assignedByName: assignedBy.name,
    taskId: task._id,
  });

  await sendEmailSafe({
    to: assignee.email,
    ...template,
  });
};

export const sendResetPasswordEmail = async (user, resetToken) => {
  const template = resetPasswordEmail({
    name: user.name,
    resetToken,
  });

  await sendEmail({
    to: user.email,
    ...template,
  });
};

export const sendDeadlineReminderEmail = async ({
  assignee,
  task,
  board,
  hoursRemaining,
}) => {
  if (!assignee?.email) return;

  const template = deadlineReminderEmail({
    assigneeName: assignee.name,
    taskTitle: task.title,
    boardTitle: board.title,
    priority: task.priority,
    dueDate: task.dueDate,
    taskId: task._id,
    hoursRemaining,
  });

  await sendEmail({
    to: assignee.email,
    ...template,
  });
};
