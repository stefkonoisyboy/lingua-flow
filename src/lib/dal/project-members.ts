import {
  IProjectMembersDAL,
  UserRole,
  ProjectInvitation,
  Profile,
} from "../di/interfaces/dal.interfaces";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";

export class ProjectMembersDAL implements IProjectMembersDAL {
  constructor(private supabase: SupabaseClient<Database>) {}

  // Project Members
  async getProjectMembers(projectId: string) {
    const { data, error } = await this.supabase
      .from("project_members")
      .select(`*, profiles(*)`)
      .eq("project_id", projectId);

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async addProjectMember(projectId: string, userId: string, role: UserRole) {
    const { error } = await this.supabase.from("project_members").insert([
      {
        project_id: projectId,
        user_id: userId,
        role,
      },
    ]);

    if (error) {
      throw error;
    }
  }

  async updateProjectMemberRole(
    projectId: string,
    userId: string,
    role: UserRole
  ) {
    const { error } = await this.supabase
      .from("project_members")
      .update({ role })
      .eq("project_id", projectId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }
  }

  async removeProjectMember(projectId: string, userId: string) {
    const { error } = await this.supabase
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }
  }

  // Project Invitations
  async createInvitation(
    projectId: string,
    inviterId: string,
    inviteeEmail: string,
    role: UserRole,
    token: string,
    expiresAt: string
  ) {
    const { error } = await this.supabase.from("project_invitations").insert([
      {
        project_id: projectId,
        inviter_id: inviterId,
        invitee_email: inviteeEmail,
        role,
        token,
        expires_at: expiresAt,
        status: "pending" as ProjectInvitation["status"],
      },
    ]);

    if (error) {
      throw error;
    }
  }

  async getInvitationsByProject(projectId: string) {
    const { data, error } = await this.supabase
      .from("project_invitations")
      .select("*")
      .eq("project_id", projectId);

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async getInvitationByToken(token: string) {
    const { data, error } = await this.supabase
      .from("project_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error; // PGRST116: No rows found
    }

    return data ?? null;
  }

  async updateInvitationStatus(
    invitationId: string,
    status: ProjectInvitation["status"]
  ) {
    const { error } = await this.supabase
      .from("project_invitations")
      .update({ status })
      .eq("id", invitationId);

    if (error) {
      throw error;
    }
  }

  async setInvitationInviteeId(invitationId: string, inviteeId: string) {
    const { error } = await this.supabase
      .from("project_invitations")
      .update({ invitee_id: inviteeId })
      .eq("id", invitationId);

    if (error) {
      throw error;
    }
  }

  async deleteInvitation(invitationId: string) {
    const { error } = await this.supabase
      .from("project_invitations")
      .delete()
      .eq("id", invitationId);

    if (error) {
      throw error;
    }
  }

  async getProfileById(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data ?? null;
  }

  async getProjectById(projectId: string): Promise<{ name: string } | null> {
    const { data, error } = await this.supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data ?? null;
  }
}
