import { ITranslationMemoryService } from "../di/interfaces/service.interfaces";
import {
  ITranslationMemoryDAL,
  IActivitiesDAL,
} from "../di/interfaces/dal.interfaces";
import { Json } from "../types/database.types";

export class TranslationMemoryService implements ITranslationMemoryService {
  constructor(
    private translationMemoryDAL: ITranslationMemoryDAL,
    private activitiesDAL: IActivitiesDAL
  ) {}

  async storeTranslation(data: {
    projectId: string;
    sourceLanguageId: string;
    targetLanguageId: string;
    sourceText: string;
    targetText: string;
    translationKeyName?: string;
    context?: Json;
    qualityScore: number;
    createdBy: string;
  }) {
    // Store the translation in memory
    const memoryEntry = await this.translationMemoryDAL.storeTranslation(data);

    // Log activity
    await this.activitiesDAL.logActivity(
      data.projectId,
      data.createdBy,
      "translation_updated",
      {
        sourceText: data.sourceText,
        targetText: data.targetText,
        qualityScore: data.qualityScore,
        translationKeyName: data.translationKeyName,
      }
    );

    return memoryEntry;
  }

  async findExactMatch(
    projectId: string,
    sourceText: string,
    targetLanguageId: string
  ) {
    const match = await this.translationMemoryDAL.findExactMatch(
      projectId,
      sourceText,
      targetLanguageId
    );

    if (match) {
      // Update usage count when memory is used
      await this.translationMemoryDAL.updateUsageCount(match.id);
    }

    return match;
  }

  async findSimilarMatches(
    projectId: string,
    sourceText: string,
    targetLanguageId: string,
    threshold: number = 0.7,
    limit: number = 5
  ) {
    const matches = await this.translationMemoryDAL.findSimilarMatches(
      projectId,
      sourceText,
      targetLanguageId,
      threshold,
      limit
    );

    // Update usage count for all matches
    for (const match of matches) {
      await this.translationMemoryDAL.updateUsageCount(match.id);
    }

    return matches;
  }

  async getMemoryStats(projectId: string) {
    return await this.translationMemoryDAL.getMemoryStats(projectId);
  }

  async cleanupOldEntries(projectId: string, olderThanDays: number) {
    const deletedCount = await this.translationMemoryDAL.cleanupOldEntries(
      projectId,
      olderThanDays
    );

    if (deletedCount > 0) {
      // Log cleanup activity
      await this.activitiesDAL.logActivity(
        projectId,
        "system", // System cleanup
        "translation_updated", // Using existing type
        {
          action: "cleanup",
          deletedCount,
          olderThanDays,
        }
      );
    }

    return deletedCount;
  }
}
