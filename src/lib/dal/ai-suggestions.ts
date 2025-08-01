import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import {
  ContextUsedJson,
  IAISuggestionsDAL,
} from "../di/interfaces/dal.interfaces";

export class AISuggestionsDAL implements IAISuggestionsDAL {
  constructor(private supabase: SupabaseClient<Database>) {}

  async cacheSuggestion(data: {
    translationKeyId: string;
    sourceLanguageId: string;
    targetLanguageId: string;
    sourceText: string;
    suggestedText: string;
    modelName: string;
    confidenceScore: number;
    contextUsed: ContextUsedJson;
  }) {
    const { data: suggestion, error } = await this.supabase
      .from("ai_translation_suggestions")
      .insert({
        translation_key_id: data.translationKeyId,
        source_language_id: data.sourceLanguageId,
        target_language_id: data.targetLanguageId,
        source_text: data.sourceText,
        suggested_text: data.suggestedText,
        model_name: data.modelName,
        confidence_score: data.confidenceScore,
        context_used: data.contextUsed,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to cache suggestion: ${error.message}`);
    }

    return suggestion;
  }

  async getCachedSuggestion(
    translationKeyId: string,
    sourceLanguageId: string,
    targetLanguageId: string
  ) {
    const { data, error } = await this.supabase
      .from("ai_translation_suggestions")
      .select("*")
      .eq("translation_key_id", translationKeyId)
      .eq("source_language_id", sourceLanguageId)
      .eq("target_language_id", targetLanguageId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is the error code for no rows returned
      throw new Error(`Failed to get cached suggestion: ${error.message}`);
    }

    return data;
  }

  async deleteExpiredSuggestions() {
    const { error } = await this.supabase
      .from("ai_translation_suggestions")
      .delete()
      .lt("expires_at", new Date().toISOString());

    if (error) {
      throw new Error(`Failed to delete expired suggestions: ${error.message}`);
    }
  }
}
