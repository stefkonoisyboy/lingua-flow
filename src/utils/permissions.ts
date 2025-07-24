export type UserRole = "owner" | "translator" | "viewer";

const PERMISSIONS = {
  // Project management
  viewProject: ["owner", "translator", "viewer"],
  editProject: ["owner"],
  deleteProject: ["owner"],
  addProjectLanguage: ["owner"],
  removeProjectLanguage: ["owner"],
  setDefaultLanguage: ["owner"],

  // Members
  viewMembers: ["owner", "translator", "viewer"],
  inviteMember: ["owner"],
  updateMemberRole: ["owner"],
  removeMember: ["owner"],
  viewInvitations: ["owner"],
  cancelInvitation: ["owner"],

  // Translations
  viewTranslations: ["owner", "translator", "viewer"],
  createTranslationKey: ["owner", "translator"],
  updateTranslationKey: ["owner", "translator"],
  updateTranslation: ["owner", "translator"],
  createTranslation: ["owner", "translator"],
  importTranslations: ["owner"],
  exportTranslations: ["owner"],

  // Comments
  viewComments: ["owner", "translator", "viewer"],
  addComment: ["owner", "translator", "viewer"],
  deleteComment: ["owner", "translator", "viewer"],

  // Integrations
  viewIntegrations: ["owner"],
  updateIntegrationStatus: ["owner"],
  importProjectTranslations: ["owner"],
  createGitHubIntegration: ["owner"],
  exportIntegrations: ["owner"],
  pullAndDetectConflicts: ["owner"],
  resolveConflicts: ["owner"],

  // Sync history
  viewSyncHistory: ["owner", "translator", "viewer"],
  createSyncHistory: ["owner"],

  // Version history
  viewVersionHistory: ["owner", "translator", "viewer"],
  revertTranslationVersion: ["owner", "translator"],

  // Settings
  viewSettings: ["owner"],
} as const;

export type PermissionAction = keyof typeof PERMISSIONS;

export function hasPermission(
  role: UserRole,
  action: PermissionAction
): boolean {
  return (PERMISSIONS[action] as readonly UserRole[]).includes(role);
}
