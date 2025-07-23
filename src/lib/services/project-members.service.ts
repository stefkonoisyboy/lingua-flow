import { IProjectMembersService } from "../di/interfaces/service.interfaces";
import { IProjectMembersDAL, UserRole } from "../di/interfaces/dal.interfaces";
import { randomUUID } from "crypto";

export class ProjectMembersService implements IProjectMembersService {
  constructor(private projectMembersDal: IProjectMembersDAL) {}

  // Member management
  async getProjectMembers(projectId: string) {
    return this.projectMembersDal.getProjectMembers(projectId);
  }

  async addProjectMember(projectId: string, userId: string, role: UserRole) {
    // Optionally: check for duplicates, etc.
    await this.projectMembersDal.addProjectMember(projectId, userId, role);
  }

  async updateMemberRole(projectId: string, userId: string, newRole: UserRole) {
    await this.projectMembersDal.updateProjectMemberRole(
      projectId,
      userId,
      newRole
    );
  }

  async removeMember(projectId: string, userId: string) {
    await this.projectMembersDal.removeProjectMember(projectId, userId);
  }

  // Invitation management
  async createInvitation(
    projectId: string,
    inviterId: string,
    inviteeEmail: string,
    role: UserRole,
    expiresAt: string
  ) {
    // Generate a secure token
    const token = randomUUID();

    await this.projectMembersDal.createInvitation(
      projectId,
      inviterId,
      inviteeEmail,
      role,
      token,
      expiresAt
    );

    // TODO: send email notification here
    return token;
  }

  async getProjectInvitations(projectId: string) {
    return this.projectMembersDal.getInvitationsByProject(projectId);
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.projectMembersDal.getInvitationByToken(token);

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation is not pending");
    }

    // Add member to project
    await this.projectMembersDal.addProjectMember(
      invitation.project_id,
      userId,
      invitation.role
    );

    // Set invitee_id
    await this.projectMembersDal.setInvitationInviteeId(invitation.id, userId);

    // Update status
    await this.projectMembersDal.updateInvitationStatus(
      invitation.id,
      "accepted"
    );
  }

  async rejectInvitation(token: string) {
    const invitation = await this.projectMembersDal.getInvitationByToken(token);

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation is not pending");
    }

    await this.projectMembersDal.updateInvitationStatus(
      invitation.id,
      "rejected"
    );
  }

  async cancelInvitation(invitationId: string) {
    await this.projectMembersDal.deleteInvitation(invitationId);
  }

  // Permission checks
  async getUserProjectRole(projectId: string, userId: string) {
    const members = await this.projectMembersDal.getProjectMembers(projectId);
    const member = members.find((m) => m.user_id === userId);
    return member ? member.role : null;
  }

  async hasPermission(projectId: string, userId: string, permission: string) {
    // Simple RBAC logic, can be extended
    const role = await this.getUserProjectRole(projectId, userId);

    if (!role) {
      return false;
    }

    if (role === "owner") {
      return true;
    }

    if (role === "translator") {
      return ["read", "translate", "comment"].includes(permission);
    }

    if (role === "viewer") {
      return ["read", "comment"].includes(permission);
    }

    return false;
  }
}
