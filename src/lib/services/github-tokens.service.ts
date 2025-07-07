import { IGitHubTokensDAL } from "../di/interfaces/dal.interfaces";
import { IGitHubTokensService } from "../di/interfaces/service.interfaces";

export class GitHubTokensService implements IGitHubTokensService {
  constructor(private githubTokensDAL: IGitHubTokensDAL) {}

  async getAccessToken(userId: string): Promise<string | null> {
    return this.githubTokensDAL.getAccessToken(userId);
  }

  async saveAccessToken(userId: string, accessToken: string): Promise<void> {
    await this.githubTokensDAL.saveAccessToken(userId, accessToken);
  }
}
