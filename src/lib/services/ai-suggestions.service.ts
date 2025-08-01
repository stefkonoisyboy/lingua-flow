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
} from "../di/interfaces/service.interfaces";

export class AISuggestionsService implements IAISuggestionsService {
  private ai: GoogleGenAI;

  constructor(
    private suggestionsDAL: IAISuggestionsDAL,
    private translationsDAL: ITranslationsDAL,
    private projectsDAL: IProjectsDAL,
    private activitiesDAL: IActivitiesDAL,
    private languagesDAL: ILanguagesDAL
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
    const translationKey = await this.translationsDAL.getTranslationKeyByKey(
      projectId,
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

    // Call Gemini API directly
    const response = await this.callGeminiAPI({
      sourceText: translationKey.key,
      sourceLanguage: sourceLanguage.code,
      targetLanguage: targetLanguage.code,
      context: project.description || undefined,
    });

    // Cache the suggestion
    await this.suggestionsDAL.cacheSuggestion({
      translationKeyId,
      sourceLanguageId: sourceLanguage.id,
      targetLanguageId,
      sourceText: translationKey.key,
      suggestedText: response.suggestedText,
      modelName: "gemini-2.5-flash",
      confidenceScore: 0.95,
      contextUsed: { project_description: project.description },
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
        },
      }
    );

    return {
      suggestedText: response.suggestedText,
      confidenceScore: 0.95,
      modelUsed: "gemini-2.5-flash",
      cached: false,
    };
  }

  async applySuggestion(
    projectId: string,
    translationId: string,
    suggestedText: string,
    modelUsed: string,
    userId: string
  ): Promise<{ success: boolean }> {
    try {
      // Update the translation
      await this.translationsDAL.updateTranslation(
        translationId,
        suggestedText,
        userId
      );

      // Log activity
      await this.activitiesDAL.logActivity(
        projectId,
        userId,
        "ai_suggestion_applied",
        {
          details: {
            model: modelUsed,
            translationId,
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
  }): Promise<{ suggestedText: string }> {
    const prompt = this.buildGeminiPrompt(params);

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

  private buildGeminiPrompt(params: {
    sourceText: string;
    sourceLanguage: string;
    targetLanguage: string;
    context?: string;
  }): string {
    const { sourceText, sourceLanguage, targetLanguage, context } = params;

    let prompt = `You are a translation assistant. Translate the following text from ${sourceLanguage} to ${targetLanguage}. `;

    if (context) {
      prompt += `Context: ${context}. `;
    }

    prompt += `Text to translate: "${sourceText}". `;
    prompt += `Provide only the translation, no additional text or explanations.`;

    return prompt;
  }
}
