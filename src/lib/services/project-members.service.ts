import { IProjectMembersService } from "../di/interfaces/service.interfaces";
import {
  IProjectMembersDAL,
  UserRole,
  IUsersDAL,
  Profile,
  IActivitiesDAL,
} from "../di/interfaces/dal.interfaces";
import { randomUUID } from "crypto";
import fetch from "node-fetch";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const SUPABASE_EDGE_FUNCTION_URL = `https://${process.env.SUPABASE_PROJECT_ID}.functions.supabase.co/functions/v1/send-invitation-email`;

async function sendInvitationEmail({
  to,
  inviter,
  project,
  role,
  token,
  expiresAt,
}: {
  to: string;
  inviter: string;
  project: string;
  role: string;
  token: string;
  expiresAt: string;
}) {
  const response = await fetch(SUPABASE_EDGE_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to,
      inviter,
      project,
      role,
      token,
      expiresAt,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send invitation email");
  }
}

export class ProjectMembersService implements IProjectMembersService {
  constructor(
    private projectMembersDal: IProjectMembersDAL,
    private usersDal: IUsersDAL,
    private activitiesDal: IActivitiesDAL
  ) {}

  // Member management
  async getProjectMembers(projectId: string) {
    return this.projectMembersDal.getProjectMembers(projectId);
  }

  async addProjectMember(projectId: string, userId: string, role: UserRole) {
    // Optionally: check for duplicates, etc.
    await this.projectMembersDal.addProjectMember(projectId, userId, role);
  }

  async updateMemberRole(projectId: string, userId: string, newRole: UserRole) {
    // Get current members to check for ownership transfer
    const members = await this.projectMembersDal.getProjectMembers(projectId);
    const targetMember = members.find((m) => m.user_id === userId);

    if (!targetMember) {
      throw new Error("Member not found");
    }

    // Check if this is an ownership transfer
    const isOwnershipTransfer =
      targetMember.role !== "owner" && newRole === "owner";

    if (isOwnershipTransfer) {
      // Find the current owner
      const currentOwner = members.find((m) => m.role === "owner");

      if (currentOwner) {
        // Demote the current owner to translator
        await this.projectMembersDal.updateProjectMemberRole(
          projectId,
          currentOwner.user_id,
          "translator"
        );
      }
    }

    // Update the target member's role
    await this.projectMembersDal.updateProjectMemberRole(
      projectId,
      userId,
      newRole
    );

    // Log activity for role change
    await this.activitiesDal.logActivity(projectId, userId, "member_updated", {
      action: "role_changed",
      memberName:
        targetMember.profiles?.full_name ||
        targetMember.profiles?.email ||
        "Unknown",
      oldRole: targetMember.role,
      newRole: newRole,
      isOwnershipTransfer: isOwnershipTransfer,
    });
  }

  async removeMember(projectId: string, userId: string) {
    // Get member details before removal for activity logging
    const members = await this.projectMembersDal.getProjectMembers(projectId);
    const memberToRemove = members.find((m) => m.user_id === userId);

    if (!memberToRemove) {
      throw new Error("Member not found");
    }

    await this.projectMembersDal.removeProjectMember(projectId, userId);

    // Log activity for member removal
    await this.activitiesDal.logActivity(projectId, userId, "member_removed", {
      action: "member_removed",
      memberName:
        memberToRemove.profiles?.full_name ||
        memberToRemove.profiles?.email ||
        "Unknown",
      memberRole: memberToRemove.role,
    });
  }

  // Invitation management
  async createInvitation(
    projectId: string,
    inviterId: string,
    inviteeEmail: string,
    role: UserRole,
    expiresAt: string
  ) {
    // 1. Check if invitee is already a team member
    const members = await this.projectMembersDal.getProjectMembers(projectId);

    const memberWithEmail = members.find(
      (m) => m.profiles?.email?.toLowerCase() === inviteeEmail.toLowerCase()
    );

    if (memberWithEmail) {
      throw new Error("This user is already a team member.");
    }

    // 2. Check for existing non-expired, pending invitation
    const existingInvitations =
      await this.projectMembersDal.getInvitationsByProject(projectId);

    const now = new Date();

    const duplicate = existingInvitations.find(
      (inv) =>
        inv.invitee_email.toLowerCase() === inviteeEmail.toLowerCase() &&
        inv.status === "pending" &&
        new Date(inv.expires_at) > now
    );

    if (duplicate) {
      throw new Error("A pending invitation for this email already exists.");
    }

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

    // Fetch inviter and project details using DAL
    const inviterProfile = await this.projectMembersDal.getProfileById(
      inviterId
    );

    const project = await this.projectMembersDal.getProjectById(projectId);

    await sendInvitationEmail({
      to: inviteeEmail,
      inviter:
        inviterProfile?.full_name || inviterProfile?.email || "A team member",
      project: project?.name || "Project",
      role,
      token,
      expiresAt,
    });

    // Log activity for invitation sent
    await this.activitiesDal.logActivity(
      projectId,
      inviterId,
      "invitation_sent",
      {
        action: "invitation_sent",
        inviteeEmail: inviteeEmail,
        role: role,
        projectName: project?.name || "Project",
      }
    );

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

    // Log activity for invitation accepted
    await this.activitiesDal.logActivity(
      invitation.project_id,
      userId,
      "invitation_accepted",
      {
        action: "invitation_accepted",
        inviteeEmail: invitation.invitee_email,
        role: invitation.role,
      }
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

    // Log activity for invitation rejected
    await this.activitiesDal.logActivity(
      invitation.project_id,
      invitation.inviter_id,
      "invitation_rejected",
      {
        action: "invitation_rejected",
        inviteeEmail: invitation.invitee_email,
        role: invitation.role,
      }
    );
  }

  async cancelInvitation(invitationId: string, projectId: string) {
    // Get invitation details before deletion for activity logging
    const invitations = await this.projectMembersDal.getInvitationsByProject(
      projectId
    );
    const invitation = invitations.find((inv) => inv.id === invitationId);

    if (invitation) {
      // Log activity for invitation cancelled
      await this.activitiesDal.logActivity(
        projectId,
        invitation.inviter_id,
        "invitation_cancelled",
        {
          action: "invitation_cancelled",
          inviteeEmail: invitation.invitee_email,
          role: invitation.role,
        }
      );
    }

    await this.projectMembersDal.deleteInvitation(invitationId);
  }

  async createUserAndAcceptInvitation(
    email: string,
    password: string,
    token: string
  ) {
    // 1. Validate invitation
    const invitation = await this.getInvitationByToken(token);

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation is not pending");
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error("Invitation has expired");
    }

    if (invitation.invitee_email.toLowerCase() !== email.toLowerCase()) {
      throw new Error("Email does not match invitation");
    }

    // 2. Create user via Admin API
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError || !userData || !userData.user) {
      throw createError || new Error("Failed to create user");
    }

    // 3. Accept invitation
    await this.acceptInvitation(token, userData.user.id);

    // 4. Return user profile
    return {
      user: userData.user as unknown as Profile,
    };
  }

  // Permission checks
  async getUserProjectRole(projectId: string, userId: string) {
    const members = await this.projectMembersDal.getProjectMembers(projectId);
    const member = members.find((m) => m.user_id === userId);
    return member ? member.role : null;
  }

  async getInvitationByToken(token: string) {
    return await this.projectMembersDal.getInvitationByToken(token);
  }

  async findByEmail(email: string) {
    return await this.usersDal.getUserByEmail(email);
  }
}
