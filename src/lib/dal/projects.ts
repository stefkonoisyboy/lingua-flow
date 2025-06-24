import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

export class ProjectsDAL {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getProjectsForUser(userId: string) {
    const { data: projectMembers, error: membersError } = await this.supabase
      .from('project_members')
      .select(`
        project_id,
        projects (
          id,
          name,
          description,
          status,
          created_at,
          updated_at,
          default_language_id
        )
      `)
      .eq('user_id', userId);

    if (membersError) {
      throw new Error(`Error fetching projects: ${membersError.message}`);
    }

    return projectMembers;
  }

  async getProjectLanguages(projectIds: string[]) {
    const { data: projectLanguages, error: languagesError } = await this.supabase
      .from('project_languages')
      .select(`
        project_id,
        language_id,
        languages (
          id,
          name,
          code,
          flag_url,
          is_rtl
        )
      `)
      .in('project_id', projectIds);

    if (languagesError) {
      throw new Error(`Error fetching languages: ${languagesError.message}`);
    }

    return projectLanguages;
  }

  async getProjectMemberProjects(userId: string) {
    const { data: userProjects, error } = await this.supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error fetching user projects: ${error.message}`);
    }

    return userProjects;
  }

  async createProject(name: string, description: string | undefined, userId: string, defaultLanguageId: string) {
    const { data: project, error: projectError } = await this.supabase
      .from('projects')
      .insert({
        name,
        description,
        created_by: userId,
        status: 'active' as const,
        default_language_id: defaultLanguageId
      })
      .select()
      .single();

    if (projectError) {
      throw new Error(`Error creating project: ${projectError.message}`);
    }

    return project;
  }

  async addProjectMember(projectId: string, userId: string, role: 'owner' | 'translator' | 'viewer') {
    const { error: memberError } = await this.supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role,
      });

    if (memberError) {
      throw new Error(`Error adding project member: ${memberError.message}`);
    }
  }

  async addProjectLanguage(projectId: string, languageId: string, isDefault: boolean) {
    const { error } = await this.supabase
      .from('project_languages')
      .insert({
        project_id: projectId,
        language_id: languageId,
        is_default: isDefault
      });

    if (error) {
      throw new Error(`Error adding project language: ${error.message}`);
    }
  }
} 