import { IProjectsDAL } from "../di/interfaces/dal.interfaces";
import { IActivitiesDAL } from "../di/interfaces/dal.interfaces";
import { ITranslationsDAL } from "../di/interfaces/dal.interfaces";
import { IIntegrationsService } from "../di/interfaces/service.interfaces";
import {
  IProjectsService,
  Project,
  GitHubConfig,
} from "../di/interfaces/service.interfaces";

export class ProjectsService implements IProjectsService {
  constructor(
    private projectsDal: IProjectsDAL,
    private activitiesDal: IActivitiesDAL,
    private translationsDal: ITranslationsDAL,
    private integrationsService: IIntegrationsService
  ) {}

  async getProjectStats(userId: string) {
    const projectMembers = await this.projectsDal.getProjectsForUser(userId);
    const projectIds = projectMembers?.map((p) => p.id) || [];

    const projectLanguages = await this.projectsDal.getProjectLanguages(
      projectIds
    );
    const uniqueLanguages = new Set(
      projectLanguages?.map((pl) => pl.language_id)
    );

    const translations = await this.translationsDal.getProjectTranslations(
      projectIds
    );
    const totalTranslations = translations?.length || 0;
    const approvedTranslations =
      translations?.filter((t) => t.status === "approved").length || 0;

    return {
      projectsCount: projectMembers?.length || 0,
      languagesCount: uniqueLanguages.size,
      translationsCount: totalTranslations,
      completionPercentage: totalTranslations
        ? Math.round((approvedTranslations / totalTranslations) * 100)
        : 0,
    };
  }

  async getProjects(userId: string) {
    const projectMembers = await this.projectsDal.getProjectsForUser(userId);
    const projectIds = projectMembers?.map((p) => p.id) || [];

    const projectLanguages = await this.projectsDal.getProjectLanguages(
      projectIds
    );
    const translations = await this.translationsDal.getProjectTranslations(
      projectIds
    );

    return (
      (projectMembers
        ?.map((project) => {
          if (!project) return null;

          const projectLangs =
            projectLanguages?.filter((pl) => pl.project_id === project.id) ||
            [];
          const projectTranslations =
            translations?.filter(
              (t) => t.translation_keys.project_id === project.id
            ) || [];

          const totalTranslations = projectTranslations.length;
          const approvedTranslations = projectTranslations.filter(
            (t) => t.status === "approved"
          ).length;
          const progress = totalTranslations
            ? Math.round((approvedTranslations / totalTranslations) * 100)
            : 0;

          return {
            id: project.id,
            name: project.name,
            description: project.description || "",
            status: project.status,
            languageCount: projectLangs.length,
            languages: projectLangs.map((pl) => ({
              id: pl.languages?.id || "",
              name: pl.languages?.name || "",
              code: pl.languages?.code || "",
              flagUrl: pl.languages?.flag_url || null,
              isRtl: pl.languages?.is_rtl || false,
            })),
            progress,
            updatedAt: project.updated_at,
          };
        })
        .filter(Boolean) as Project[]) || []
    );
  }

  async createProject(
    name: string,
    description: string | undefined,
    userId: string,
    defaultLanguageId: string,
    githubConfig?: GitHubConfig
  ) {
    const project = await this.projectsDal.createProject({
      name,
      description: description ?? null,
      status: "active",
      created_by: userId,
      default_language_id: defaultLanguageId,
    });

    // Add default language to project languages
    await this.projectsDal.addProjectLanguage(
      project.id,
      defaultLanguageId,
      true
    );

    // Add creator as project owner
    await this.projectsDal.addProjectMember(project.id, userId, "owner");

    // Create GitHub integration if config is provided
    if (githubConfig) {
      await this.integrationsService.createGitHubIntegration(
        project.id,
        githubConfig
      );

      // Log GitHub integration activity
      await this.activitiesDal.logActivity(
        project.id,
        userId,
        "integration_connected",
        {
          action: "connected_github",
          repository: githubConfig.repository,
        }
      );
    }

    // Log project creation activity
    await this.activitiesDal.logActivity(project.id, userId, "member_added", {
      action: "created_project",
      projectName: project.name,
    });

    return {
      id: project.id,
      name: project.name,
      description: project.description || "",
      status: project.status,
      languageCount: 1, // Just created with default language
      languages: [], // Languages will be loaded separately
      progress: 0, // No translations yet
      updatedAt: project.updated_at,
    };
  }

  async getRecentActivity(userId: string) {
    const userProjects = await this.projectsDal.getProjectMemberProjects(
      userId
    );

    const projectIds = userProjects?.map((p) => p.project_id) || [];

    const activities = await this.activitiesDal.getRecentActivities(projectIds);

    return activities.map((activity) => ({
      id: activity.id,
      type: activity.activity_type,
      details: activity.details as Record<string, unknown> | null,
      projectName: activity.projects?.name || "",
      projectId: activity.projects?.id || "",
      resourceId: activity.resource_id,
      resourceType: activity.resource_type,
      timestamp: activity.created_at,
    }));
  }

  async getAll(userId: string) {
    return await this.projectsDal.getAll(userId);
  }

  async deleteProject(projectId: string) {
    await this.projectsDal.deleteProject(projectId);
  }

  async getProjectById(projectId: string) {
    return await this.projectsDal.getProjectById(projectId);
  }

  async getProjectLanguages(projectId: string) {
    return await this.projectsDal.getProjectLanguagesById(projectId);
  }
}
