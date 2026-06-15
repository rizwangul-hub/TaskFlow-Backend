// src/utils/permissions.js
import { ROLES } from "./roles.js";

export const PERMISSIONS = {
  [ROLES.ADMIN]: [
    "manage_users",
    "manage_boards",
    "view_all_boards",
    "delete_any_board",
    "update_any_board",
    "assign_roles",
  ],
  [ROLES.PROJECT_MANAGER]: [
    "create_board",
    "update_own_board",
    "invite_members",
    "remove_members",
    "create_tasks",
    "assign_tasks",
    "manage_tasks",
  ],
  [ROLES.TEAM_MEMBER]: [
    "view_assigned_tasks",
    "update_task_status",
    "add_comments",
    "upload_files",
    "view_boards",
  ],
};
