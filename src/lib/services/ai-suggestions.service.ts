import { GoogleGenAI } from "@google/genai";
import {
  IAISuggestionsDAL,
  ITranslationsDAL,
  IProjectsDAL,
  IActivitiesDAL,
  ILanguagesDAL,
} from "../di/interfaces/dal.interfaces";
import {
  IAISuggestionsService,
  TranslationSuggestion,
  ITranslationMemoryService,
} from "../di/interfaces/service.interfaces";
import { Database } from "../types/database.types";

export class AISuggestionsService implements IAISuggestionsService {
  private ai: GoogleGenAI;

  constructor(
    private suggestionsDAL: IAISuggestionsDAL,
    private translationsDAL: ITranslationsDAL,
    private projectsDAL: IProjectsDAL,
    private activitiesDAL: IActivitiesDAL,
    private languagesDAL: ILanguagesDAL,
    private translationMemoryService: ITranslationMemoryService
  ) {
    const apiKey = process.env.GEMINI_API_KEY || "";

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    this.ai = new GoogleGenAI({ apiKey });
  }

  async getSuggestion(
    userId: string,
    projectId: string,
    translationKeyId: string,
    targetLanguageId: string
  ): Promise<TranslationSuggestion> {
    // Get translation key and source text
    const translationKey = await this.translationsDAL.getTranslationKeyById(
      translationKeyId
    );

    if (!translationKey) {
      throw new Error("Translation key not found");
    }

    // Get project context
    const project = await this.projectsDAL.getProjectById(projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    const sourceLanguage = await this.languagesDAL.getLanguageById(
      project.default_language_id
    );

    if (!sourceLanguage) {
      throw new Error("Source language not found");
    }

    // Get target language
    const targetLanguage = await this.languagesDAL.getLanguageById(
      targetLanguageId
    );

    if (!targetLanguage) {
      throw new Error("Target language not found");
    }

    // Check database cache first
    const cached = await this.suggestionsDAL.getCachedSuggestion(
      translationKeyId,
      sourceLanguage.id, // Always default language for source
      targetLanguageId
    );

    if (cached) {
      return {
        suggestedText: cached.suggested_text,
        confidenceScore: cached.confidence_score || 0.95,
        modelUsed: cached.model_name,
        cached: true,
      };
    }

    const translation =
      await this.translationsDAL.getTranslationByKeyAndLanguage(
        translationKeyId,
        sourceLanguage.id
      );

    if (!translation) {
      throw new Error("Source translation not found");
    }

    // Get translation memory matches for enhanced context
    const memoryMatches =
      await this.translationMemoryService.findSimilarMatches(
        projectId,
        translation.content,
        targetLanguageId,
        0.7, // Lower threshold for broader context
        3 // Limit to top 3 matches
      );

    // Call Gemini API with memory-enhanced context
    const response = await this.callGeminiAPI({
      sourceText: translation.content,
      sourceLanguage: sourceLanguage.code,
      targetLanguage: targetLanguage.code,
      context: project.description || undefined,
      memoryMatches: memoryMatches,
    });

    // Calculate confidence score based on memory matches
    const confidenceScore = this.calculateConfidenceScore(memoryMatches);

    // Cache the suggestion
    await this.suggestionsDAL.cacheSuggestion({
      translationKeyId,
      sourceLanguageId: sourceLanguage.id,
      targetLanguageId,
      sourceText: translation.content,
      suggestedText: response.suggestedText,
      modelName: "gemini-2.5-flash",
      confidenceScore,
      contextUsed: {
        project_description: project.description,
        memory_matches_count: memoryMatches.length,
        memory_quality:
          memoryMatches.length > 0
            ? memoryMatches.reduce(
                (sum, m) => sum + (m.quality_score || 0),
                0
              ) / memoryMatches.length
            : 0,
      },
    });

    // Log activity
    await this.activitiesDAL.logActivity(
      projectId,
      userId,
      "ai_suggestion_generated",
      {
        details: {
          model: "gemini-2.5-flash",
          translationKeyId,
          sourceLanguageId: sourceLanguage.id,
          targetLanguageId,
          memoryMatchesCount: memoryMatches.length,
          confidenceScore,
        },
      }
    );

    return {
      suggestedText: response.suggestedText,
      confidenceScore,
      modelUsed: "gemini-2.5-flash",
      cached: false,
    };
  }

  async applySuggestion(
    projectId: string,
    translationKeyId: string,
    targetLanguageId: string,
    suggestedText: string,
    modelUsed: string,
    userId: string
  ): Promise<{ success: boolean }> {
    try {
      // Get project and language information for memory storage
      const project = await this.projectsDAL.getProjectById(projectId);

      if (!project) {
        throw new Error("Project not found");
      }

      const sourceLanguage = await this.languagesDAL.getLanguageById(
        project.default_language_id
      );

      if (!sourceLanguage) {
        throw new Error("Source language not found");
      }

      const targetLanguage = await this.languagesDAL.getLanguageById(
        targetLanguageId
      );

      if (!targetLanguage) {
        throw new Error("Target language not found");
      }

      // Get translation key for context
      const translationKey = await this.translationsDAL.getTranslationKeyById(
        translationKeyId
      );

      if (!translationKey) {
        throw new Error("Translation key not found");
      }

      // Get source text for memory storage
      const sourceTranslation =
        await this.translationsDAL.getTranslationByKeyAndLanguage(
          translationKeyId,
          sourceLanguage.id
        );

      if (!sourceTranslation) {
        throw new Error("Source translation not found");
      }

      // Create the translation
      await this.translationsDAL.createTranslation(
        translationKeyId,
        targetLanguageId,
        suggestedText,
        userId
      );

      // Store in translation memory with AI quality score
      await this.translationMemoryService.storeTranslation({
        projectId,
        sourceLanguageId: sourceLanguage.id,
        targetLanguageId,
        sourceText: sourceTranslation.content,
        targetText: suggestedText,
        translationKeyName: translationKey.key,
        qualityScore: 0.8, // AI-applied suggestion (lower than human)
        createdBy: userId,
      });

      // Log activity
      await this.activitiesDAL.logActivity(
        projectId,
        userId,
        "ai_suggestion_applied",
        {
          details: {
            model: modelUsed,
            translationKeyId,
            targetLanguageId,
          },
        }
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to apply suggestion:", error);
      return { success: false };
    }
  }

  private async callGeminiAPI(params: {
    sourceText: string;
    sourceLanguage: string;
    targetLanguage: string;
    context?: string;
    memoryMatches?: Database["public"]["Tables"]["translation_memory"]["Row"][];
  }): Promise<{ suggestedText: string }> {
    const prompt = this.buildGeminiPrompt(params);
    console.log("PROMPT", prompt);
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (!response.text) {
        throw new Error("Invalid response from Gemini API");
      }

      return {
        suggestedText: response.text.trim(),
      };
    } catch (error) {
      console.error("Gemini API call failed:", error);
      throw new Error("Translation service temporarily unavailable");
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
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

  private buildGeminiPrompt(params: {
    sourceText: string;
    sourceLanguage: string;
    targetLanguage: string;
    context?: string;
    memoryMatches?: Database["public"]["Tables"]["translation_memory"]["Row"][];
  }): string {
    const {
      sourceText,
      sourceLanguage,
      targetLanguage,
      context,
      memoryMatches,
    } = params;

    let prompt = `You are a translation assistant. Translate the following text from ${sourceLanguage} to ${targetLanguage}. `;

    if (context) {
      prompt += `Context: ${context}. `;
    }

    // Add memory matches as reference examples
    if (memoryMatches && memoryMatches.length > 0) {
      prompt += `\n\nUse these similar translations as reference:\n`;
      memoryMatches.forEach((match, index) => {
        prompt += `${index + 1}. "${match.source_text}" → "${
          match.target_text
        }"\n`;
      });
      prompt += `\n`;
    }

    prompt += `Text to translate: "${sourceText}". `;
    prompt += `Provide only the translation, no additional text or explanations.`;

    return prompt;
  }

  private calculateConfidenceScore(
    memoryMatches: Database["public"]["Tables"]["translation_memory"]["Row"][]
  ): number {
    if (memoryMatches.length === 0) {
      return 0.7; // Base confidence for pure AI generation
    }

    // Calculate average quality score of memory matches
    const averageQuality =
      memoryMatches.reduce(
        (sum, match) => sum + (match.quality_score || 0),
        0
      ) / memoryMatches.length;

    // Calculate confidence based on quality and number of matches
    const qualityBoost = Math.min(averageQuality * 0.2, 0.2); // Max 20% boost from quality
    const matchCountBoost = Math.min(memoryMatches.length * 0.05, 0.1); // Max 10% boost from match count

    const baseConfidence = 0.8; // Base confidence for AI with memory
    const totalConfidence = baseConfidence + qualityBoost + matchCountBoost;

    return Math.min(0.98, Math.max(0.7, totalConfidence)); // Clamp between 0.7 and 0.98
  }
}
