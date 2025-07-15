import { Octokit } from "@octokit/rest";

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
      sort: "updated",
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
    const [owner, repo] = repository.split("/");

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
    filePattern: string = "/**/*.{json,yaml,yml,po}"
  ): Promise<TranslationFile[]> {
    try {
      const [owner, repo] = repository.split("/");

      // Process the file pattern to extract path and extensions
      const pathMatch = filePattern.match(/^(.*\/)?([^/]*)$/);

      const basePath = (pathMatch?.[1] || "/")
        .replace(/^\/+|\/+$/g, "") // Remove leading/trailing slashes
        .replace(/\/+/g, "/"); // Normalize multiple slashes to single slash

      const fileGlob = pathMatch?.[2] || "*.{json,yaml,yml,po}";

      // Extract extensions from the glob pattern
      const extensions = fileGlob
        .replace(/^\*\./, "") // Remove leading *. if present
        .replace(/[{}]/g, "") // Remove curly braces
        .split(",")
        .map((ext) => ext.trim().toLowerCase());

      try {
        // Get repository contents for the specified path
        const response = await this.octokit.repos.getContent({
          owner,
          repo,
          path: basePath || ".", // Use "." for root path instead of undefined
          ref: branch,
        });

        if (!Array.isArray(response.data)) {
          return [];
        }

        // Filter files based on extensions
        return response.data
          .filter((item) => {
            if (item.type !== "file") {
              return false;
            }

            const fileExt = item.name.split(".").pop()?.toLowerCase() || "";
            return extensions.includes(fileExt);
          })
          .map((item) => ({
            path: item.path,
            name: item.name,
            type: item.name.split(".").pop()?.toLowerCase() || "unknown",
          }));
      } catch (error) {
        // If path not found, return empty array
        if (error instanceof Error && error.message.includes("Not Found")) {
          return [];
        }
        throw error;
      }
    } catch (error) {
      console.error("Error finding translation files:", error);

      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }

      throw error;
    }
  }

  async getFileContent(
    repository: string,
    path: string,
    branch: string
  ): Promise<string | null> {
    const [owner, repo] = repository.split("/");

    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      if ("content" in data && typeof data.content === "string") {
        return Buffer.from(data.content, "base64").toString("utf-8");
      }

      return null;
    } catch (error) {
      console.error("Error getting file content:", error);
      return null;
    }
  }

  async createBranch(
    repository: string,
    baseBranch: string,
    newBranch: string
  ): Promise<void> {
    const [owner, repo] = repository.split("/");

    try {
      // Get the SHA of the base branch
      const { data: ref } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`,
      });

      // Create new branch from the base branch's SHA
      await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${newBranch}`,
        sha: ref.object.sha,
      });
    } catch (error) {
      console.error("Error creating branch:", error);
      throw new Error(
        `Failed to create branch: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async createOrUpdateFile(
    repository: string,
    branch: string,
    path: string,
    content: string,
    message: string
  ): Promise<void> {
    const [owner, repo] = repository.split("/");

    // Remove leading slash from path if present
    const normalizedPath = path.replace(/^\/+/, "");

    try {
      let sha: string | undefined;

      // Try to get existing file to get its SHA
      try {
        const { data: existingFile } = await this.octokit.repos.getContent({
          owner,
          repo,
          path: normalizedPath,
          ref: branch,
        });

        if ("sha" in existingFile) {
          sha = existingFile.sha;
        }
      } catch (error) {
        // File doesn't exist yet, which is fine
        console.error("File doesn't exist yet, which is fine: ", error);
      }

      // Create or update file
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: normalizedPath,
        message,
        content: Buffer.from(content).toString("base64"),
        branch,
        ...(sha ? { sha } : {}),
      });
    } catch (error) {
      console.error("Error creating/updating file:", error);

      throw new Error(
        `Failed to create/update file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async createPullRequest(
    repository: string,
    baseBranch: string,
    headBranch: string,
    title: string,
    body: string
  ): Promise<{ number: number; url: string }> {
    const [owner, repo] = repository.split("/");

    try {
      const { data } = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        head: headBranch,
        base: baseBranch,
      });

      return {
        number: data.number,
        url: data.html_url,
      };
    } catch (error) {
      console.error("Error creating pull request:", error);
      throw new Error(
        `Failed to create pull request: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
