import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { GitHubService, Repository, Branch, TranslationFile } from './github.service';
import { IntegrationsDAL, IntegrationConfig } from '../dal/integrations';

export class IntegrationsService {
  private integrationsDal: IntegrationsDAL;

  constructor(supabase: SupabaseClient<Database>) {
    this.integrationsDal = new IntegrationsDAL(supabase);
  }

  async createGitHubIntegration(
    projectId: string,
    config: IntegrationConfig
  ) {
    return this.integrationsDal.createIntegration(projectId, 'github', config);
  }

  async getProjectIntegration(projectId: string) {
    return this.integrationsDal.getProjectIntegration(projectId);
  }

  async listRepositories(accessToken: string): Promise<Repository[]> {
    const githubService = new GitHubService(accessToken);
    return githubService.listRepositories();
  }

  async listBranches(accessToken: string, owner: string, repo: string): Promise<Branch[]> {
    const githubService = new GitHubService(accessToken);
    return githubService.listBranches(owner, repo);
  }

  async findTranslationFiles(
    accessToken: string,
    owner: string,
    repo: string,
    branch: string,
    path?: string
  ): Promise<TranslationFile[]> {
    const githubService = new GitHubService(accessToken);
    return githubService.findTranslationFiles(owner, repo, branch, path);
  }

  async importTranslations(
    accessToken: string,
    owner: string,
    repo: string,
    branch: string,
    files: TranslationFile[]
  ): Promise<{ [key: string]: string }> {
    const githubService = new GitHubService(accessToken);
    const translations: { [key: string]: string } = {};

    for (const file of files) {
      const content = await githubService.getFileContent(owner, repo, file.path, branch);
      translations[file.path] = content;
    }

    return translations;
  }

  async updateIntegrationConfig(integrationId: string, config: Partial<IntegrationConfig>) {
    return this.integrationsDal.updateIntegrationConfig(integrationId, config);
  }

  async updateIntegrationStatus(integrationId: string, isConnected: boolean, lastSyncedAt?: string) {
    return this.integrationsDal.updateIntegrationStatus(integrationId, isConnected, lastSyncedAt);
  }

  async deleteIntegration(integrationId: string) {
    await this.integrationsDal.deleteIntegration(integrationId);
  }
} 