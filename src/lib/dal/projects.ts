import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import { IProjectsDAL } from "../di/interfaces/dal.interfaces";
import { ITranslationsDAL } from "../di/interfaces/dal.interfaces";

export class ProjectsDAL implements IProjectsDAL {
  constructor(
    private supabase: SupabaseClient<Database>,
    private translationsDal: ITranslationsDAL
  ) {}

  async getProjectsForUser(userId: string) {
    const { data: projectMembers, error: membersError } = await this.supabase
      .from("project_members")
      .select(
        `
        project_id,
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

    return projectMembers;
  }

  async getProjectLanguages(projectIds: string[]) {
    const { data: projectLanguages, error: languagesError } =
      await this.supabase
        .from("project_languages")
        .select(
          `
        project_id,
        language_id,
        languages (
          id,
          name,
          code,
          flag_url,
          is_rtl
        )
      `
        )
        .in("project_id", projectIds);

    if (languagesError) {
      throw new Error(`Error fetching languages: ${languagesError.message}`);
    }

    return projectLanguages;
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
    name: string,
    description: string | undefined,
    userId: string,
    defaultLanguageId: string
  ) {
    const { data: project, error: projectError } = await this.supabase
      .from("projects")
      .insert({
        name,
        description,
        created_by: userId,
        status: "active" as const,
        default_language_id: defaultLanguageId,
      })
      .select()
      .single();

    if (projectError) {
      throw new Error(`Error creating project: ${projectError.message}`);
    }

    return project;
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

    const { data: translations } = await this.supabase
      .from("translations")
      .select("key_id, status")
      .in("status", ["pending", "in_progress", "reviewed"])
      .in(
        "key_id",
        translationKeys.map((key) => key.id)
      );

    const missingTranslationsByProject = new Map<string, number>();

    translations?.forEach((translation) => {
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

  async deleteProject(projectId: string): Promise<void> {
    // Delete project and all related data will be cascaded due to foreign key constraints
    await this.supabase.from("projects").delete().eq("id", projectId);
  }
}
