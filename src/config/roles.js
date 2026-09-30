/**
 * FlowBoard Role-Based Access Control (RBAC) Configuration
 *
 * Roles:
 *   Admin           — Full system control
 *   Project Manager — Project-level management
 *   Developer       — Work on assigned issues
 *   Reporter        — Create & track issues
 *
 * Each role maps to a set of permission strings that are
 * checked by the `checkPermission` middleware.
 */

const ROLES = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  DEVELOPER: "Developer",
  REPORTER: "Reporter",
};

const PERMISSIONS = {
  // ── User & System Administration ──
  MANAGE_USERS: "manage_users",
  MANAGE_PERMISSIONS: "manage_permissions",
  VIEW_SYSTEM_ACTIVITY: "view_system_activity",

  // ── Projects ──
  CREATE_PROJECT: "create_project",
  MANAGE_PROJECT: "manage_project",
  DELETE_PROJECT: "delete_project",
  VIEW_PROJECT: "view_project",

  // ── Teams ──
  MANAGE_TEAMS: "manage_teams",
  MANAGE_PROJECT_MEMBERS: "manage_project_members",

  // ── Epics ──
  CREATE_EPIC: "create_epic",

  // ── Issues ──
  CREATE_ISSUE: "create_issue",
  VIEW_ISSUE: "view_issue",
  UPDATE_ISSUE: "update_issue",
  DELETE_ISSUE: "delete_issue",
  MOVE_ISSUE: "move_issue",
  ASSIGN_ISSUE: "assign_issue",

  // ── Subtasks ──
  WORK_SUBTASKS: "work_subtasks",

  // ── Sprints & Backlog ──
  CREATE_SPRINT: "create_sprint",
  MANAGE_BACKLOG: "manage_backlog",

  // ── Comments & Attachments ──
  ADD_COMMENT: "add_comment",
  UPLOAD_ATTACHMENT: "upload_attachment",

  // ── Reports ──
  VIEW_REPORTS: "view_reports",

  // ── Progress Tracking ──
  TRACK_PROGRESS: "track_progress",
};

/**
 * Permission matrix — maps each role to the permissions it owns.
 */
const ROLE_PERMISSIONS = {
  // ─── Admin: unrestricted ───
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_PERMISSIONS,
    PERMISSIONS.VIEW_SYSTEM_ACTIVITY,
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.MANAGE_PROJECT,
    PERMISSIONS.DELETE_PROJECT,
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.MANAGE_TEAMS,
    PERMISSIONS.MANAGE_PROJECT_MEMBERS,
    PERMISSIONS.CREATE_EPIC,
    PERMISSIONS.CREATE_ISSUE,
    PERMISSIONS.VIEW_ISSUE,
    PERMISSIONS.UPDATE_ISSUE,
    PERMISSIONS.DELETE_ISSUE,
    PERMISSIONS.MOVE_ISSUE,
    PERMISSIONS.ASSIGN_ISSUE,
    PERMISSIONS.WORK_SUBTASKS,
    PERMISSIONS.CREATE_SPRINT,
    PERMISSIONS.MANAGE_BACKLOG,
    PERMISSIONS.ADD_COMMENT,
    PERMISSIONS.UPLOAD_ATTACHMENT,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.TRACK_PROGRESS,
  ],

  // ─── Project Manager ───
  [ROLES.PROJECT_MANAGER]: [
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.MANAGE_PROJECT,
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.MANAGE_PROJECT_MEMBERS,
    PERMISSIONS.CREATE_EPIC,
    PERMISSIONS.CREATE_ISSUE,
    PERMISSIONS.VIEW_ISSUE,
    PERMISSIONS.UPDATE_ISSUE,
    PERMISSIONS.MOVE_ISSUE,
    PERMISSIONS.ASSIGN_ISSUE,
    PERMISSIONS.WORK_SUBTASKS,
    PERMISSIONS.CREATE_SPRINT,
    PERMISSIONS.MANAGE_BACKLOG,
    PERMISSIONS.ADD_COMMENT,
    PERMISSIONS.UPLOAD_ATTACHMENT,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.TRACK_PROGRESS,
  ],

  // ─── Developer ───
  [ROLES.DEVELOPER]: [
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.VIEW_ISSUE,
    PERMISSIONS.UPDATE_ISSUE,
    PERMISSIONS.MOVE_ISSUE,
    PERMISSIONS.WORK_SUBTASKS,
    PERMISSIONS.ADD_COMMENT,
    PERMISSIONS.UPLOAD_ATTACHMENT,
    PERMISSIONS.TRACK_PROGRESS,
  ],

  // ─── Reporter ───
  [ROLES.REPORTER]: [
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.CREATE_ISSUE,
    PERMISSIONS.VIEW_ISSUE,
    PERMISSIONS.ADD_COMMENT,
    PERMISSIONS.TRACK_PROGRESS,
  ],
};

/**
 * Check whether a given role owns a specific permission.
 */
const hasPermission = (role, permission) => {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
};

/**
 * Return the full list of permissions for a role.
 */
const getPermissionsForRole = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  getPermissionsForRole,
};
