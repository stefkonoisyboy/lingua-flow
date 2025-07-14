import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import {
  IPaginationDAL,
  IProjectsDAL,
  ProjectWithLanguages,
} from "../di/interfaces/dal.interfaces";
import { ITranslationsDAL } from "../di/interfaces/dal.interfaces";
import { DEFAULT_PAGE_SIZE } from "./pagination";

export class ProjectsDAL implements IProjectsDAL {
  constructor(
    private supabase: SupabaseClient<Database>,
    private translationsDal: ITranslationsDAL,
    private paginationDal: IPaginationDAL
  ) {}

  async getProjectsForUser(userId: string) {
    const { data: projectMembers, error: membersError } = await this.supabase
      .from("project_members")
      .select(
        `
        projects (
          id,
          name,
          description,
          status,
          created_at,
          updated_at,
          default_language_id,
          created_by
        )
      `
      )
      .eq("user_id", userId);

    if (membersError) {
      throw new Error(`Error fetching projects: ${membersError.message}`);
    }

    return (
      projectMembers?.map(({ projects }) => ({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        created_at: projects.created_at,
        updated_at: projects.updated_at,
        default_language_id: projects.default_language_id,
        created_by: projects.created_by,
        languages: [], // Will be populated by the service layer
        missingTranslations: 0, // Will be calculated by the service layer
      })) || []
    );
  }

  async getProjectLanguages(projectIds: string[]) {
    const { data: projectLanguages, error: languagesError } =
      await this.supabase
        .from("project_languages")
        .select(
          `
          project_id,
          language_id,
          created_at,
          updated_at,
          is_default,
          languages (
            id,
            name,
            code,
            flag_url,
            is_rtl,
            created_at,
            updated_at
          )
        `
        )
        .in("project_id", projectIds);

    if (languagesError) {
      throw new Error(`Error fetching languages: ${languagesError.message}`);
    }

    return (projectLanguages || []) as ProjectWithLanguages[];
  }

  async getProjectMemberProjects(userId: string) {
    const { data: userProjects, error } = await this.supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Error fetching user projects: ${error.message}`);
    }

    return userProjects;
  }

  async createProject(
    project: Omit<
      Database["public"]["Tables"]["projects"]["Row"],
      "id" | "created_at" | "updated_at"
    >
  ) {
    const { data: newProject, error: projectError } = await this.supabase
      .from("projects")
      .insert(project)
      .select()
      .single();

    if (projectError) {
      throw new Error(`Error creating project: ${projectError.message}`);
    }

    return newProject;
  }

  async addProjectMember(
    projectId: string,
    userId: string,
    role: "owner" | "translator" | "viewer"
  ) {
    const { error: memberError } = await this.supabase
      .from("project_members")
      .insert({
        project_id: projectId,
        user_id: userId,
        role,
      });

    if (memberError) {
      throw new Error(`Error adding project member: ${memberError.message}`);
    }
  }

  async addProjectLanguage(
    projectId: string,
    languageId: string,
    isDefault: boolean
  ) {
    const { error } = await this.supabase.from("project_languages").insert({
      project_id: projectId,
      language_id: languageId,
      is_default: isDefault,
    });

    if (error) {
      throw new Error(`Failed to add project language: ${error.message}`);
    }
  }

  async getProjectLanguage(projectId: string, languageId: string) {
    const { data, error } = await this.supabase
      .from("project_languages")
      .select()
      .eq("project_id", projectId)
      .eq("language_id", languageId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is the error code for no rows returned
      throw new Error(`Failed to get project language: ${error.message}`);
    }

    return data;
  }

  async ensureProjectLanguage(projectId: string, languageId: string) {
    const existingLanguage = await this.getProjectLanguage(
      projectId,
      languageId
    );

    if (!existingLanguage) {
      await this.addProjectLanguage(projectId, languageId, false);
    }
  }

  async getAll(userId: string) {
    // Get all projects where user is a member
    const { data: projectMembers } = await this.supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", userId);

    if (!projectMembers?.length) {
      return [];
    }

    const projectIds = projectMembers.map((member) => member.project_id);

    // Get projects with their languages
    const { data: projects } = await this.supabase
      .from("projects")
      .select(
        `
        id,
        name,
        status,
        updated_at,
        project_languages!inner (
          language:languages (
            id,
            name,
            code
          )
        )
      `
      )
      .in("id", projectIds)
      .order("updated_at", { ascending: false });

    if (!projects) {
      return [];
    }

    // Get missing translations count for each project
    const translationKeys =
      await this.translationsDal.getProjectTranslationKeys(projectIds);

    // Split translation keys into chunks to avoid URL length limits
    const keyIds = translationKeys.map((key) => key.id);
    const chunkSize = 100; // Adjust this value based on your needs
    const keyIdChunks = [];

    for (let i = 0; i < keyIds.length; i += chunkSize) {
      keyIdChunks.push(keyIds.slice(i, i + chunkSize));
    }

    // Fetch translations for each chunk and combine results
    const allTranslations = [];

    for (const chunk of keyIdChunks) {
      const query = this.supabase
        .from("translations")
        .select("key_id, status")
        .in("status", ["pending", "in_progress", "reviewed"])
        .in("key_id", chunk);

      const chunkTranslations = await this.paginationDal.fetchAllPages<{
        key_id: string;
        status: "pending" | "in_progress" | "reviewed" | "approved";
      }>(query, DEFAULT_PAGE_SIZE);

      allTranslations.push(...chunkTranslations);
    }

    const missingTranslationsByProject = new Map<string, number>();

    allTranslations.forEach((translation) => {
      const count = missingTranslationsByProject.get(translation.key_id) || 0;
      missingTranslationsByProject.set(translation.key_id, count + 1);
    });

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      status: project.status,
      languages: project.project_languages.map((pl) => pl.language),
      missingTranslations: missingTranslationsByProject.get(project.id) || 0,
      updatedAt: project.updated_at,
    }));
  }

  async deleteProject(projectId: string) {
    // Delete project and all related data will be cascaded due to foreign key constraints
    await this.supabase.from("projects").delete().eq("id", projectId);
  }

  async getProjectById(projectId: string) {
    const { data, error } = await this.supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async getProjectLanguagesById(projectId: string) {
    const { data, error } = await this.supabase
      .from("project_languages")
      .select("*, languages(*)")
      .eq("project_id", projectId);

    if (error) {
      throw error;
    }

    return data;
  }

  async updateProject(
    projectId: string,
    name: string,
    description?: string | null
  ) {
    const { data, error } = await this.supabase
      .from("projects")
      .update({
        name,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating project: ${error.message}`);
    }

    return data;
  }

  async removeProjectLanguage(projectId: string, languageId: string) {
    const { error } = await this.supabase
      .from("project_languages")
      .delete()
      .eq("project_id", projectId)
      .eq("language_id", languageId);

    if (error) {
      throw new Error(`Error removing project language: ${error.message}`);
    }
  }

  async setDefaultLanguage(projectId: string, languageId: string) {
    // Start a transaction using Supabase's batch operations
    const { error: updateProjectError } = await this.supabase
      .from("projects")
      .update({
        default_language_id: languageId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateProjectError) {
      throw new Error(
        `Error updating project default language: ${updateProjectError.message}`
      );
    }

    // Reset all is_default flags to false
    const { error: resetError } = await this.supabase
      .from("project_languages")
      .update({
        is_default: false,
        updated_at: new Date().toISOString(),
      })
      .eq("project_id", projectId);

    if (resetError) {
      throw new Error(
        `Error resetting default languages: ${resetError.message}`
      );
    }

    // Set the new default language
    const { error: setDefaultError } = await this.supabase
      .from("project_languages")
      .update({
        is_default: true,
        updated_at: new Date().toISOString(),
      })
      .eq("project_id", projectId)
      .eq("language_id", languageId);

    if (setDefaultError) {
      throw new Error(
        `Error setting default language: ${setDefaultError.message}`
      );
    }
  }
}
