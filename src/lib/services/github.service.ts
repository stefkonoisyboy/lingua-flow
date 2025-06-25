import { Octokit } from '@octokit/rest';

export interface Repository {
  id: number;
  name: string;
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
      direction: 'desc',
      per_page: 100,
    });

    return data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      default_branch: repo.default_branch,
      private: repo.private,
    }));
  }

  async listBranches(owner: string, repo: string): Promise<Branch[]> {
    const { data } = await this.octokit.repos.listBranches({
      owner,
      repo,
      protected: false,
      per_page: 100,
    });

    return data.map(branch => ({
      name: branch.name,
      protected: branch.protected,
    }));
  }

  async findTranslationFiles(
    owner: string, 
    repo: string, 
    branch: string, 
    path: string = ''
  ): Promise<TranslationFile[]> {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      ref: branch,
      path,
    });

    const files: TranslationFile[] = [];
    const items = Array.isArray(data) ? data : [data];

    for (const item of items) {
      if (item.type === 'file' && this.isTranslationFile(item.name)) {
        files.push({
          path: item.path,
          name: item.name,
          type: this.getFileType(item.name),
        });
      } else if (item.type === 'dir') {
        const subFiles = await this.findTranslationFiles(owner, repo, branch, item.path);
        files.push(...subFiles);
      }
    }

    return files;
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    branch: string
  ): Promise<string> {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if ('content' in data && typeof data.content === 'string') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }

    throw new Error('Could not get file content');
  }

  private isTranslationFile(filename: string): boolean {
    const supportedExtensions = ['.json', '.yaml', '.yml', '.po'];
    return supportedExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  private getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ext === 'yml' ? 'yaml' : ext;
  }
} 