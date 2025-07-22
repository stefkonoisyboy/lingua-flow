import { IVersionHistoryDAL } from "../di/interfaces/dal.interfaces";
import { IVersionHistoryService } from "../di/interfaces/service.interfaces";
import { ITranslationsDAL } from "../di/interfaces/dal.interfaces";

export class VersionHistoryService implements IVersionHistoryService {
  constructor(
    private versionHistoryDal: IVersionHistoryDAL,
    private translationsDal: ITranslationsDAL
  ) {}

  async getVersionHistory(translationId: string) {
    const history = await this.versionHistoryDal.getVersionHistory(
      translationId
    );

    return history;
  }

  async getVersionHistoryForTranslations(translationIds: string[]) {
    const history =
      await this.versionHistoryDal.getVersionHistoryForTranslations(
        translationIds
      );

    return history;
  }

  async createVersion(
    translationId: string,
    content: string,
    changedBy: string,
    versionName: string
  ) {
    const version = await this.versionHistoryDal.createVersion(
      translationId,
      content,
      changedBy,
      versionName
    );

    return version;
  }

  async revertTranslationToVersion(
    translationId: string,
    versionId: string,
    userId: string
  ): Promise<{ success: boolean }> {
    // 1. Fetch the target version entry
    const version = await this.versionHistoryDal.getVersionHistoryEntry(
      versionId
    );

    if (!version) {
      throw new Error("Version not found");
    }

    // 2. Update the translation to the content of the target version
    await this.translationsDal.updateTranslation(
      translationId,
      version.content,
      userId
    );

    // 3. (Optional) Log activity here if needed
    return { success: true };
  }
}
