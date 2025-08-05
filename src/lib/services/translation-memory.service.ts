import { ITranslationMemoryService } from "../di/interfaces/service.interfaces";
import {
  ITranslationMemoryDAL,
  IActivitiesDAL,
} from "../di/interfaces/dal.interfaces";
import { Json } from "../types/database.types";
import { GoogleGenAI } from "@google/genai";

export class TranslationMemoryService implements ITranslationMemoryService {
  private ai: GoogleGenAI;

  constructor(
    private translationMemoryDAL: ITranslationMemoryDAL,
    private activitiesDAL: IActivitiesDAL
  ) {
    const apiKey = process.env.GEMINI_API_KEY || "";

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    this.ai = new GoogleGenAI({ apiKey });
  }

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
    try {
      // Generate embeddings for source and target text
      const sourceEmbedding = await this.generateEmbedding(data.sourceText);
      const targetEmbedding = await this.generateEmbedding(data.targetText);

      // Store the translation in memory with embeddings
      const memoryEntry = await this.translationMemoryDAL.storeTranslation({
        ...data,
        sourceEmbedding,
        targetEmbedding,
      });

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
    } catch (error) {
      console.error("Failed to generate embeddings:", error);

      // Fallback: store without embeddings
      const memoryEntry = await this.translationMemoryDAL.storeTranslation(
        data
      );

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
    // 1. Try exact match first (fastest)
    const exactMatch = await this.findExactMatch(
      projectId,
      sourceText,
      targetLanguageId
    );

    if (exactMatch) {
      return [exactMatch];
    }

    // 2. Try Levenshtein-based fuzzy matching (fast)
    const fuzzyMatches = await this.translationMemoryDAL.findSimilarMatches(
      projectId,
      sourceText,
      targetLanguageId,
      threshold,
      limit
    );

    if (fuzzyMatches.length > 0) {
      // Update usage count for all matches
      for (const match of fuzzyMatches) {
        await this.translationMemoryDAL.updateUsageCount(match.id);
      }

      return fuzzyMatches;
    }

    // 3. Try semantic similarity with embeddings (slower, more accurate)
    try {
      const sourceEmbedding = await this.generateEmbedding(sourceText);

      const semanticMatches =
        await this.translationMemoryDAL.findSimilarByEmbedding(
          projectId,
          sourceEmbedding,
          targetLanguageId,
          threshold,
          limit
        );

      // Update usage count for all matches
      for (const match of semanticMatches) {
        await this.translationMemoryDAL.updateUsageCount(match.id);
      }

      return semanticMatches;
    } catch (error) {
      console.error("Semantic similarity search failed:", error);
      return [];
    }
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

  private async generateEmbedding(text: string) {
    try {
      const response = await this.ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
      });

      if (!response.embeddings || response.embeddings.length === 0) {
        throw new Error("Invalid embedding response from Gemini API");
      }

      const values = response.embeddings[0].values;

      if (!values) {
        throw new Error("Invalid embedding values from Gemini API");
      }

      return values;
    } catch (error) {
      console.error("Gemini embedding API call failed:", error);
      throw new Error("Embedding generation failed");
    }
  }
}
