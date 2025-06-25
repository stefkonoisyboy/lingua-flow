import { Octokit } from '@octokit/rest';

export interface Repository {
  id: number;
  full_name: string;
  default_branch: string;
  private: boolean;
}

export interface Branch {
  name: string;
  protected: boolean;
}

export interface TranslationFile {
  path: string;
  name: string;
  type: string;
  content?: string;
}

export class GitHubService {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  async listRepositories(): Promise<Repository[]> {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });

    return data.map((repo) => ({
      id: repo.id,
      full_name: repo.full_name,
      default_branch: repo.default_branch,
      private: repo.private,
    }));
  }

  async listBranches(repository: string): Promise<Branch[]> {
    const [owner, repo] = repository.split('/');
    const { data } = await this.octokit.repos.listBranches({
      owner,
      repo,
      per_page: 100,
    });

    return data.map((branch) => ({
      name: branch.name,
      protected: branch.protected || false,
    }));
  }

  async findTranslationFiles(
    repository: string,
    branch: string,
    filePattern: string = '/**/*.{json,yaml,yml,po}'
  ): Promise<TranslationFile[]> {    
    try {
      const { data } = await this.octokit.search.code({
        q: `repo:${repository} path:${filePattern} ref:${branch}`,
      });

      return data.items.map((item) => ({
        path: item.path,
        name: item.name,
        type: item.path.split('.').pop() || 'unknown',
      }));
    } catch (error) {
      console.error('Error finding translation files:', error);
      return [];
    }
  }

  async getFileContent(
    repository: string,
    path: string,
    branch: string
  ): Promise<string | null> {
    const [owner, repo] = repository.split('/');

    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      if ('content' in data && typeof data.content === 'string') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }

      return null;
    } catch (error) {
      console.error('Error getting file content:', error);
      return null;
    }
  }
} 