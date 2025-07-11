import { IVersionHistoryDAL } from "../di/interfaces/dal.interfaces";
import {
  IVersionHistoryService,
  VersionHistoryEntry,
} from "../di/interfaces/service.interfaces";
import { Database } from "../types/database.types";

type VersionHistoryRow = Database["public"]["Tables"]["version_history"]["Row"];

export class VersionHistoryService implements IVersionHistoryService {
  constructor(private versionHistoryDal: IVersionHistoryDAL) {}

  private mapToVersionHistoryEntry(
    dbEntry: VersionHistoryRow
  ): VersionHistoryEntry {
    return {
      id: dbEntry.id,
      translationId: dbEntry.translation_id,
      versionNumber: dbEntry.version_number,
      content: dbEntry.content,
      changedBy: dbEntry.changed_by,
      versionName: dbEntry.version_name,
      createdAt: dbEntry.created_at,
      updatedAt: dbEntry.updated_at,
    };
  }

  async getVersionHistory(
    translationId: string
  ): Promise<VersionHistoryEntry[]> {
    const history = await this.versionHistoryDal.getVersionHistory(
      translationId
    );
    return history.map(this.mapToVersionHistoryEntry);
  }

  async getVersionHistoryForTranslations(
    translationIds: string[]
  ): Promise<VersionHistoryEntry[]> {
    const history =
      await this.versionHistoryDal.getVersionHistoryForTranslations(
        translationIds
      );
    return history.map(this.mapToVersionHistoryEntry);
  }

  async createVersion(
    translationId: string,
    content: string,
    changedBy: string,
    versionName: string
  ): Promise<VersionHistoryEntry> {
    const version = await this.versionHistoryDal.createVersion(
      translationId,
      content,
      changedBy,
      versionName
    );
    return this.mapToVersionHistoryEntry(version);
  }
}
