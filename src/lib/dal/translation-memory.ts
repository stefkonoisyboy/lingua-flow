import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Json } from "../types/database.types";
import { ITranslationMemoryDAL } from "../di/interfaces/dal.interfaces";

export class TranslationMemoryDAL implements ITranslationMemoryDAL {
  constructor(private supabase: SupabaseClient<Database>) {}

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
    const { data: memory, error } = await this.supabase
      .from("translation_memory")
      .insert({
        project_id: data.projectId,
        source_language_id: data.sourceLanguageId,
        target_language_id: data.targetLanguageId,
        source_text: data.sourceText,
        target_text: data.targetText,
        translation_key_name: data.translationKeyName,
        context: data.context,
        quality_score: data.qualityScore,
        created_by: data.createdBy,
        usage_count: 0,
        last_used: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return memory;
  }

  async findExactMatch(
    projectId: string,
    sourceText: string,
    targetLanguageId: string
  ) {
    const { data, error } = await this.supabase
      .from("translation_memory")
      .select("*")
      .eq("project_id", projectId)
      .eq("source_text", sourceText)
      .eq("target_language_id", targetLanguageId)
      .order("quality_score", { ascending: false })
      .order("usage_count", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data;
  }

  async findSimilarMatches(
    projectId: string,
    sourceText: string,
    targetLanguageId: string,
    threshold: number = 0.7,
    limit: number = 5
  ) {
    // First try exact match
    const exactMatch = await this.findExactMatch(
      projectId,
      sourceText,
      targetLanguageId
    );

    if (exactMatch) {
      return [exactMatch];
    }

    // Get candidates for similarity matching
    const { data: candidates, error } = await this.supabase
      .from("translation_memory")
      .select("*")
      .eq("project_id", projectId)
      .eq("target_language_id", targetLanguageId)
      .order("quality_score", { ascending: false })
      .order("usage_count", { ascending: false })
      .limit(100); // Limit candidates for performance

    if (error) throw error;

    // Calculate similarity scores and filter by threshold
    const matches = candidates
      .map((candidate) => ({
        ...candidate,
        similarity: this.calculateSimilarity(sourceText, candidate.source_text),
      }))
      .filter((match) => match.similarity >= threshold)
      .sort((a, b) => {
        // Sort by similarity first, then by quality and usage
        if (Math.abs(a.similarity - b.similarity) > 0.1) {
          return b.similarity - a.similarity;
        }

        return (b.quality_score || 0) - (a.quality_score || 0);
      })
      .slice(0, limit)
      .map(({ ...candidate }) => candidate);

    return matches;
  }

  async updateUsageCount(memoryId: string): Promise<void> {
    // First get the current usage count
    const { data: currentMemory, error: fetchError } = await this.supabase
      .from("translation_memory")
      .select("usage_count")
      .eq("id", memoryId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Update with incremented count
    const { error } = await this.supabase
      .from("translation_memory")
      .update({
        usage_count: (currentMemory?.usage_count || 0) + 1,
        last_used: new Date().toISOString(),
      })
      .eq("id", memoryId);

    if (error) {
      throw error;
    }
  }

  async getMemoryStats(projectId: string) {
    // Get total entries
    const { count: totalEntries, error: countError } = await this.supabase
      .from("translation_memory")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    if (countError) {
      throw countError;
    }

    // Get average quality
    const { data: qualityData, error: qualityError } = await this.supabase
      .from("translation_memory")
      .select("quality_score")
      .eq("project_id", projectId)
      .not("quality_score", "is", null);

    if (qualityError) {
      throw qualityError;
    }

    const averageQuality =
      qualityData.length > 0
        ? qualityData.reduce(
            (sum, entry) => sum + (entry.quality_score || 0),
            0
          ) / qualityData.length
        : 0;

    // Get most used entries
    const { data: mostUsedEntries, error: usageError } = await this.supabase
      .from("translation_memory")
      .select("*")
      .eq("project_id", projectId)
      .order("usage_count", { ascending: false })
      .order("quality_score", { ascending: false })
      .limit(10);

    if (usageError) {
      throw usageError;
    }

    return {
      totalEntries: totalEntries || 0,
      averageQuality,
      mostUsedEntries: mostUsedEntries || [],
    };
  }

  async cleanupOldEntries(projectId: string, olderThanDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { count, error } = await this.supabase
      .from("translation_memory")
      .delete()
      .eq("project_id", projectId)
      .lt("created_at", cutoffDate.toISOString())
      .lt("quality_score", 0.5) // Only delete low-quality entries
      .lt("usage_count", 1); // Only delete unused entries

    if (error) {
      throw error;
    }

    return count || 0;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(
      text1.toLowerCase(),
      text2.toLowerCase()
    );

    const maxLength = Math.max(text1.length, text2.length);

    if (maxLength === 0) {
      return 1.0;
    }

    return 1 - distance / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string) {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}
