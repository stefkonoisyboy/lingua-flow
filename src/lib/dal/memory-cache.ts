import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import { IMemoryCacheDAL } from "../di/interfaces/dal.interfaces";

export class MemoryCacheDAL implements IMemoryCacheDAL {
  constructor(private supabase: SupabaseClient<Database>) {}

  async cacheSimilarityScore(
    memoryId: string,
    sourceTextHash: string,
    similarityScore: number
  ) {
    const { error } = await this.supabase
      .from("translation_memory_cache")
      .upsert(
        {
          memory_id: memoryId,
          source_text_hash: sourceTextHash,
          similarity_score: similarityScore,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "memory_id,source_text_hash",
        }
      );

    if (error) {
      throw error;
    }
  }

  async getCachedSimilarityScores(sourceTextHash: string, limit: number = 10) {
    const { data, error } = await this.supabase
      .from("translation_memory_cache")
      .select("memory_id, similarity_score")
      .eq("source_text_hash", sourceTextHash)
      .order("similarity_score", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []).map((entry) => ({
      memoryId: entry.memory_id!,
      similarityScore: entry.similarity_score!,
    }));
  }

  async clearCacheForMemory(memoryId: string): Promise<void> {
    const { error } = await this.supabase
      .from("translation_memory_cache")
      .delete()
      .eq("memory_id", memoryId);

    if (error) {
      throw error;
    }
  }

  async cleanupExpiredCache(olderThanHours: number) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

    const { count, error } = await this.supabase
      .from("translation_memory_cache")
      .delete()
      .lt("created_at", cutoffDate.toISOString());

    if (error) {
      throw error;
    }

    return count || 0;
  }
}
