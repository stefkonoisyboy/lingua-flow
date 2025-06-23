import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const dashboardRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const supabase = ctx.supabase;
    const userId = ctx.user.id;

    // Get projects count where user is a member
    const { count: projectsCount, error: projectsError } = await supabase
      .from('project_members')
      .select('project_id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (projectsError) {
      throw new Error(`Error fetching projects: ${projectsError.message}`);
    }

    // Get languages count across all user's projects
    const { data: userProjects } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId);

    const projectIds = userProjects?.map(p => p.project_id) || [];

    const { data: projectLanguages, error: languagesError } = await supabase
      .from('project_languages')
      .select('language_id')
      .in('project_id', projectIds);

    if (languagesError) {
      throw new Error(`Error fetching languages: ${languagesError.message}`);
    }

    const uniqueLanguages = new Set(projectLanguages?.map(pl => pl.language_id));
    const languagesCount = uniqueLanguages.size;

    // Get translations count and status
    const { data: translationKeys } = await supabase
      .from('translation_keys')
      .select('id')
      .in('project_id', projectIds);

    const keyIds = translationKeys?.map(k => k.id) || [];

    const { data: translations, error: translationsError } = await supabase
      .from('translations')
      .select('status')
      .in('key_id', keyIds);

    if (translationsError) {
      throw new Error(`Error fetching translations: ${translationsError.message}`);
    }

    const totalTranslations = translations?.length || 0;
    const approvedTranslations = translations?.filter(t => t.status === 'approved').length || 0;

    const completionPercentage = totalTranslations ? 
      Math.round((approvedTranslations / totalTranslations) * 100) : 0;

    return {
      projectsCount: projectsCount || 0,
      languagesCount,
      translationsCount: totalTranslations,
      completionPercentage,
    };
  }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    const supabase = ctx.supabase;
    const userId = ctx.user.id;

    // Get all projects where user is a member
    const { data: projectMembers, error: membersError } = await supabase
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

    const projectIds = projectMembers?.map(pm => pm.project_id) || [];

    // Get languages for these projects
    const { data: projectLanguages, error: languagesError } = await supabase
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

    // Get translation stats for these projects
    const { data: translations, error: translationsError } = await supabase
      .from('translations')
      .select(`
        status,
        key_id,
        translation_keys!inner (
          project_id
        )
      `)
      .in('translation_keys.project_id', projectIds);

    if (translationsError) {
      throw new Error(`Error fetching translations: ${translationsError.message}`);
    }

    // Process and return the data
    return projectMembers?.map(pm => {
      const project = pm.projects;
      if (!project) return null;

      const projectLangs = projectLanguages?.filter(pl => pl.project_id === project.id) || [];
      const projectTranslations = translations?.filter(t => t.translation_keys.project_id === project.id) || [];
      
      const totalTranslations = projectTranslations.length;
      const approvedTranslations = projectTranslations.filter(t => t.status === 'approved').length;
      const progress = totalTranslations ? Math.round((approvedTranslations / totalTranslations) * 100) : 0;

      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        status: project.status,
        languageCount: projectLangs.length,
        languages: projectLangs.map(pl => ({
          id: pl.languages?.id || '',
          name: pl.languages?.name || '',
          code: pl.languages?.code || '',
          flagUrl: pl.languages?.flag_url || null,
          isRtl: pl.languages?.is_rtl || false,
        })),
        progress,
        updatedAt: project.updated_at,
      };
    }).filter(Boolean);
  }),

  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    const supabase = ctx.supabase;
    const userId = ctx.user.id;

    // Get user's projects first
    const { data: userProjects } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId);

    const projectIds = userProjects?.map(p => p.project_id) || [];

    // Get recent activities from projects where user is a member
    const { data: activities, error } = await supabase
      .from('activity_log')
      .select(`
        *,
        projects (
          id,
          name
        )
      `)
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(`Error fetching activities: ${error.message}`);
    }

    return activities.map(activity => ({
      id: activity.id,
      type: activity.activity_type,
      details: activity.details,
      projectName: activity.projects?.name || '',
      projectId: activity.projects?.id || '',
      resourceId: activity.resource_id,
      resourceType: activity.resource_type,
      timestamp: activity.created_at,
    }));
  }),

  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Project name is required'),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user.id;

      // Start a transaction
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: input.name,
          description: input.description,
          created_by: userId,
          status: 'active' as const,
          default_language_id: 'en' // Temporary default, will be updated after language creation
        })
        .select()
        .single();

      if (projectError) {
        throw new Error(`Error creating project: ${projectError.message}`);
      }

      // Add creator as project owner
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: project.id,
          user_id: userId,
          role: 'owner' as const,
        });

      if (memberError) {
        throw new Error(`Error adding project member: ${memberError.message}`);
      }

      // Log activity
      const { error: activityError } = await supabase
        .from('activity_log')
        .insert({
          project_id: project.id,
          user_id: userId,
          activity_type: 'member_added',
          details: {
            action: 'created_project',
            projectName: project.name,
          },
        });

      if (activityError) {
        throw new Error(`Error logging activity: ${activityError.message}`);
      }

      return project;
    }),
});