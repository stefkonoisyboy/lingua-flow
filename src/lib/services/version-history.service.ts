import { IVersionHistoryDAL } from "../di/interfaces/dal.interfaces";
import { IVersionHistoryService } from "../di/interfaces/service.interfaces";

export class VersionHistoryService implements IVersionHistoryService {
  constructor(private versionHistoryDal: IVersionHistoryDAL) {}

  async getVersionHistory(translationId: string) {
    const history = this.versionHistoryDal.getVersionHistory(translationId);

    return history;
  }

  async getVersionHistoryForTranslations(translationIds: string[]) {
    const history =
      this.versionHistoryDal.getVersionHistoryForTranslations(translationIds);

    return history;
  }

  async createVersion(
    translationId: string,
    content: string,
    changedBy: string,
    versionName: string
  ) {
    const version = this.versionHistoryDal.createVersion(
      translationId,
      content,
      changedBy,
      versionName
    );

    return version;
  }
}
