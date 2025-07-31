# AI-Powered Translation Suggestions Feature Plan

## Executive Summary

This document outlines the implementation plan for integrating AI-powered translation suggestions into LinguaFlow. The feature will leverage transformer-based models (MarianMT, M2M100, or GPT) through HuggingFace Transformers to provide real-time translation suggestions to human translators, enhancing productivity while maintaining quality through human oversight.

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Architecture Design](#architecture-design)
3. [Model Selection Strategy](#model-selection-strategy)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [API Design](#api-design)
7. [Performance Optimization](#performance-optimization)
8. [Security Considerations](#security-considerations)
9. [User Experience](#user-experience)
10. [Deployment Strategy](#deployment-strategy)
11. [Monitoring and Analytics](#monitoring-and-analytics)
12. [Future Enhancements](#future-enhancements)

## Feature Overview

### Core Functionality

- **On-Demand Suggestions**: Translators can request AI suggestions for any translation string
- **Context-Aware Translation**: Utilizes project description and translation memory for better accuracy
- **Multiple Model Support**: Flexible architecture supporting various transformer models
- **Real-Time Inference**: Fast response times with intelligent caching
- **Human-in-the-Loop**: AI suggestions require human approval before being saved

### User Workflow

1. Translator encounters a missing or incomplete translation
2. Clicks "Get AI Suggestion" button
3. System generates suggestion using context-aware AI model
4. Suggestion appears inline with "Apply" button
5. Translator reviews and optionally edits before applying
6. Applied suggestion is saved with version history

## Architecture Design

### High-Level Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  Next.js        │────▶│  tRPC Backend    │────▶│  Google Gemini  │
│  Frontend       │     │  (Node.js)       │     │  API            │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         │
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Redux Store    │     │  Supabase DB     │     │  Database Cache │
│  (UI State)     │     │  (Translations)  │     │  (24h TTL)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Component Breakdown

1. **Frontend Layer**
   - React components for suggestion UI
   - Redux slice for suggestion state management
   - tRPC hooks for API calls

2. **Backend Services**
   - tRPC router for suggestion endpoints
   - Direct Gemini API integration
   - Database cache management
   - Context builder service

3. **AI Integration**
   - Google Gemini 2.5 Flash API
   - Direct API calls from backend
   - No local model management needed
   - Simplified deployment (no Python service)

## Model Selection Strategy

### Primary Model: Google Gemini 2.5 Flash

1. **Google Gemini 2.5 Flash**
   - Pros: Superior quality, true context awareness, all languages supported, no server resources needed
   - Cons: API costs, network dependency
   - Use case: Primary translation model for all language pairs

### Model Selection Logic

```typescript
// Simplified model selection - always use Gemini
class ModelSelectionService {
  async selectModel(
    sourceLang: string,
    targetLang: string,
    contextLength: number
  ): Promise<string> {
    // Always use Gemini 2.5 Flash for all translations
    // Source language is always 'en' as per requirements
    return 'gemini-2.5-flash';
  }

  async buildPrompt(
    sourceText: string,
    targetLang: string,
    context?: string,
    projectDescription?: string
  ): Promise<string> {
    let prompt = `You are a translation assistant. Translate the following text from English to ${targetLang}. `;
    
    if (context) {
      prompt += `Context: ${context}. `;
    }
    
    if (projectDescription) {
      prompt += `Project context: ${projectDescription}. `;
    }
    
    prompt += `Text to translate: "${sourceText}". `;
    prompt += `Provide only the translation, no additional text or explanations.`;
    
    return prompt;
  }
}
```

## Backend Implementation

### 1. Database Schema Updates

```sql
-- New table for caching suggestions (unchanged structure)
CREATE TABLE ai_translation_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    translation_key_id UUID REFERENCES translation_keys(id),
    source_language_id UUID REFERENCES languages(id), -- Always 'en'
    target_language_id UUID REFERENCES languages(id),
    source_text TEXT NOT NULL,
    suggested_text TEXT NOT NULL,
    model_name VARCHAR(255) NOT NULL DEFAULT 'gemini-2.5-flash',
    confidence_score FLOAT DEFAULT 0.95,
    context_used JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours'
);

-- Index for efficient lookups
CREATE INDEX idx_suggestions_lookup ON ai_translation_suggestions(
    translation_key_id, 
    source_language_id, 
    target_language_id,
    expires_at
);

-- Activity log entry for AI suggestions
ALTER TYPE activity_type ADD VALUE 'ai_suggestion_generated';
ALTER TYPE activity_type ADD VALUE 'ai_suggestion_applied';
```

### 2. Direct Gemini Integration

#### Service Structure
```
src/
├── lib/
│   ├── services/
│   │   └── ai-suggestions.service.ts    # Direct Gemini integration
│   ├── dal/
│   │   └── ai-suggestions.ts            # Database cache layer
│   └── utils/
│       └── gemini.ts                     # Gemini API utilities
├── server/
│   └── routers/
│       └── ai-suggestions.ts            # tRPC endpoints
└── store/
    └── slices/
        └── ai-suggestions.slice.ts      # Redux state management
```

#### Core Implementation

```typescript
// src/lib/services/ai-suggestions.service.ts
export class AISuggestionsService {
  private geminiApiKey = process.env.GEMINI_API_KEY;
  private geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  constructor(
    private suggestionsDAL: IAISuggestionsDAL,
    private translationsDAL: ITranslationsDAL,
    private projectsDAL: IProjectsDAL,
    private activitiesDAL: IActivitiesDAL
  ) {}

  async getSuggestion(
    userId: string,
    projectId: string,
    translationKeyId: string,
    targetLanguageId: string
  ): Promise<TranslationSuggestion> {
    // Get translation key and source text
    const translationKey = await this.translationsDAL.getTranslationKey(translationKeyId);
    const sourceLanguageId = await this.projectsDAL.getDefaultLanguageId(projectId); // Always 'en'
    const targetLanguage = await this.getLanguageById(targetLanguageId);
    
    // Check database cache first
    const cached = await this.suggestionsDAL.getCachedSuggestion(
      translationKeyId,
      sourceLanguageId,
      targetLanguageId
    );
    
    if (cached) {
      return {
        suggestedText: cached.suggested_text,
        confidenceScore: cached.confidence_score,
        modelUsed: cached.model_name,
        cached: true
      };
    }

    // Get project context
    const project = await this.projectsDAL.getProject(projectId);

    // Call Gemini API directly
    const response = await this.callGeminiAPI({
      sourceText: translationKey.source_text,
      targetLanguage: targetLanguage.code,
      context: project.description
    });

    // Cache the suggestion
    await this.suggestionsDAL.cacheSuggestion({
      translationKeyId,
      sourceLanguageId,
      targetLanguageId,
      sourceText: translationKey.source_text,
      suggestedText: response.suggestedText,
      modelName: 'gemini-2.5-flash',
      confidenceScore: 0.95,
      contextUsed: { project_description: project.description }
    });

    // Log activity
    await this.activitiesDAL.logActivity({
      projectId,
      userId,
      activityType: 'ai_suggestion_generated',
      resourceType: 'translation',
      resourceId: translationKeyId,
      details: { model: 'gemini-2.5-flash' }
    });

    return {
      suggestedText: response.suggestedText,
      confidenceScore: 0.95,
      modelUsed: 'gemini-2.5-flash',
      cached: false
    };
  }

  private async callGeminiAPI(params: {
    sourceText: string;
    targetLanguage: string;
    context?: string;
  }): Promise<{ suggestedText: string }> {
    const prompt = this.buildGeminiPrompt(params);
    
    const response = await fetch(
      `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      suggestedText: result.candidates[0].content.parts[0].text.trim()
    };
  }

  private buildGeminiPrompt(params: {
    sourceText: string;
    targetLanguage: string;
    context?: string;
  }): string {
    const { sourceText, targetLanguage, context } = params;
    
    let prompt = `You are a translation assistant. Translate the following text from English to ${targetLanguage}. `;
    
    if (context) {
      prompt += `Context: ${context}. `;
    }
    
    prompt += `Text to translate: "${sourceText}". `;
    prompt += `Provide only the translation, no additional text or explanations.`;
    
    return prompt;
  }
}
```

### 3. Node.js Integration

#### DAL Layer

```typescript
// src/lib/dal/ai-suggestions.ts
export class AISuggestionsDAL {
  constructor(private supabase: SupabaseClient) {}

  async cacheSuggestion(data: {
    translationKeyId: string;
    sourceLanguageId: string;
    targetLanguageId: string;
    sourceText: string;
    suggestedText: string;
    modelName: string;
    confidenceScore: number;
    contextUsed: any;
  }) {
    const { data: suggestion, error } = await this.supabase
      .from('ai_translation_suggestions')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return suggestion;
  }

  async getCachedSuggestion(
    translationKeyId: string,
    sourceLanguageId: string,
    targetLanguageId: string
  ) {
    const { data, error } = await this.supabase
      .from('ai_translation_suggestions')
      .select('*')
      .eq('translation_key_id', translationKeyId)
      .eq('source_language_id', sourceLanguageId)
      .eq('target_language_id', targetLanguageId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}
```

#### Service Layer

```typescript
// src/lib/services/ai-suggestions.service.ts
export class AISuggestionsService {
  private geminiApiKey = process.env.GEMINI_API_KEY;
  private geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  constructor(
    private suggestionsDAL: IAISuggestionsDAL,
    private translationsDAL: ITranslationsDAL,
    private projectsDAL: IProjectsDAL,
    private activitiesDAL: IActivitiesDAL
  ) {}

  async getSuggestion(
    userId: string,
    projectId: string,
    translationKeyId: string,
    targetLanguageId: string
  ): Promise<TranslationSuggestion> {
    // Get translation key and source text
    const translationKey = await this.translationsDAL.getTranslationKey(translationKeyId);
    const sourceLanguageId = await this.projectsDAL.getDefaultLanguageId(projectId); // Always 'en'
    const targetLanguage = await this.getLanguageById(targetLanguageId);
    
    // Check cache first
    const cached = await this.suggestionsDAL.getCachedSuggestion(
      translationKeyId,
      sourceLanguageId,
      targetLanguageId
    );
    
    if (cached) {
      return {
        suggestedText: cached.suggested_text,
        confidenceScore: cached.confidence_score,
        modelUsed: cached.model_name,
        cached: true
      };
    }

    // Get context
    const project = await this.projectsDAL.getProject(projectId);
    const translationMemory = await this.getTranslationMemory(
      projectId,
      targetLanguageId,
      translationKey.key
    );

    // Call AI service
    const response = await fetch(`${this.geminiApiUrl}?key=${this.geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_text: translationKey.source_text,
        source_language: sourceLanguage.code,
        target_language: targetLanguage.code,
        context: project.description,
        translation_memory: translationMemory
      })
    });

    if (!response.ok) {
      throw new Error('AI service error');
    }

    const suggestion = await response.json();

    // Cache the suggestion
    await this.suggestionsDAL.cacheSuggestion({
      translationKeyId,
      sourceLanguageId,
      targetLanguageId,
      sourceText: translationKey.source_text,
      suggestedText: suggestion.suggested_text,
      modelName: suggestion.model_used,
      confidenceScore: suggestion.confidence_score,
      contextUsed: { project_description: project.description }
    });

    // Log activity
    await this.activitiesDAL.logActivity({
      projectId,
      userId,
      activityType: 'ai_suggestion_generated',
      resourceType: 'translation',
      resourceId: translationKeyId,
      details: { model: suggestion.model_used }
    });

    return suggestion;
  }

  private async getTranslationMemory(
    projectId: string,
    languageId: string,
    currentKey: string
  ): Promise<TranslationMemoryEntry[]> {
    // Get similar translations from the project
    const similar = await this.translationsDAL.getSimilarTranslations(
      projectId,
      languageId,
      currentKey,
      5 // limit
    );

    return similar.map(t => ({
      source: t.source_text,
      target: t.content,
      similarity: t.similarity_score
    }));
  }
}
```

#### tRPC Router

```typescript
// src/server/routers/ai-suggestions.ts
export const aiSuggestionsRouter = router({
  getSuggestion: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      translationKeyId: z.string(),
      targetLanguageId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      await requireProjectPermission(ctx, input.projectId, ['owner', 'translator']);

      const container = ctx.container;
      const suggestionsService = container.resolve<IAISuggestionsService>('AISuggestionsService');

      return await suggestionsService.getSuggestion(
        ctx.user.id,
        input.projectId,
        input.translationKeyId,
        input.targetLanguageId
      );
    }),

  applySuggestion: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      translationId: z.string(),
      suggestedText: z.string(),
      modelUsed: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      await requireProjectPermission(ctx, input.projectId, ['owner', 'translator']);

      const container = ctx.container;
      const translationsService = container.resolve<ITranslationsService>('TranslationsService');
      const activitiesService = container.resolve<IActivitiesService>('ActivitiesService');

      // Apply the suggestion
      await translationsService.updateTranslation(
        input.translationId,
        input.suggestedText,
        ctx.user.id
      );

      // Log activity
      await activitiesService.logActivity({
        projectId: input.projectId,
        userId: ctx.user.id,
        activityType: 'ai_suggestion_applied',
        resourceType: 'translation',
        resourceId: input.translationId,
        details: { model: input.modelUsed }
      });

      return { success: true };
    })
});
```

## Frontend Implementation

### 1. UI Components

#### Translation Table Integration

```typescript
// Update src/components/projects/translations/translations-table.tsx
const TranslationsTable = () => {
  const { mutate: getSuggestion, isLoading: suggestionLoading } = trpc.aiSuggestions.getSuggestion.useMutation();
  const { mutate: applySuggestion } = trpc.aiSuggestions.applySuggestion.useMutation();
  
  // Local state for suggestions (no Redux needed)
  const [suggestions, setSuggestions] = useState<Record<string, TranslationSuggestion>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const handleGetSuggestion = async (translationKey: TranslationKey) => {
    setLoadingStates(prev => ({ ...prev, [translationKey.id]: true }));
    
    try {
      const result = await getSuggestion({
        projectId,
        translationKeyId: translationKey.id,
        targetLanguageId: selectedLanguage.id
      });
      
      setSuggestions(prev => ({ 
        ...prev, 
        [translationKey.id]: result 
      }));
    } catch (error) {
      console.error('Failed to get suggestion:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [translationKey.id]: false }));
    }
  };

  const handleApplySuggestion = async (translationKey: TranslationKey) => {
    const suggestion = suggestions[translationKey.id];
    if (!suggestion) return;

    // Update the form field
    formik.setFieldValue(
      `translations.${translationKey.id}`,
      suggestion.suggestedText
    );

    // Clear the suggestion
    setSuggestions(prev => {
      const newState = { ...prev };
      delete newState[translationKey.id];
      return newState;
    });

    // Track usage
    await applySuggestion({
      projectId,
      translationId: translationKey.translation_id,
      suggestedText: suggestion.suggestedText,
      modelUsed: suggestion.modelUsed
    });
  };

  // In the render method, for missing translations:
  {!translation.content && (
    <Box>
      <EmptyTranslationInput
        // ... existing props
      />
      <MissingTranslationWarning>
        <WarningIcon /> Missing translation
      </MissingTranslationWarning>
      
      {/* AI Suggestion UI */}
      {!suggestions[translationKey.id] && !loadingStates[translationKey.id] && (
        <SuggestionButton
          startIcon={<AutoAwesomeIcon />}
          onClick={() => handleGetSuggestion(translationKey)}
          size="small"
        >
          Get AI Suggestion
        </SuggestionButton>
      )}
      
      {loadingStates[translationKey.id] && (
        <SuggestionLoading>
          <CircularProgress size={16} />
          <Typography variant="body2">Generating...</Typography>
        </SuggestionLoading>
      )}
      
      {suggestions[translationKey.id]?.suggestedText && (
        <SuggestionContainer>
          <SuggestionHeader>
            <AutoAwesomeIcon />
            <Typography variant="body2">
              Suggestion: {suggestions[translationKey.id].suggestedText}
            </Typography>
          </SuggestionHeader>
          <Button
            variant="contained"
            size="small"
            onClick={() => handleApplySuggestion(translationKey)}
          >
            Apply
          </Button>
        </SuggestionContainer>
      )}
    </Box>
  )}
```

#### Styled Components

```typescript
// src/styles/projects/ai-suggestions.styles.ts
import { styled } from '@mui/material/styles';
import { Box, Button, Paper } from '@mui/material';

export const SuggestionButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(1),
  color: theme.palette.info.main,
  borderColor: theme.palette.info.main,
  '&:hover': {
    backgroundColor: theme.palette.info.light,
    borderColor: theme.palette.info.dark,
  }
}));

export const SuggestionContainer = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(1),
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.grey[900] 
    : theme.palette.grey[50],
  border: `1px solid ${theme.palette.info.light}`,
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

export const SuggestionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flex: 1,
  '& .MuiSvgIcon-root': {
    color: theme.palette.info.main,
    fontSize: '1.2rem'
  }
}));

export const SuggestionLoading = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: theme.palette.info.main
}));
```

## API Design

### tRPC Endpoints

```typescript
// API Schema
export const aiSuggestionsRouter = {
  // Get AI suggestion for a translation
  getSuggestion: {
    input: {
      projectId: string,
      translationKeyId: string,
      targetLanguageId: string
    },
    output: {
      suggestedText: string,
      confidenceScore: number,
      modelUsed: string,
      cached: boolean
    }
  },

  // Apply suggestion and track usage
  applySuggestion: {
    input: {
      projectId: string,
      translationId: string,
      suggestedText: string,
      modelUsed: string
    },
    output: {
      success: boolean
    }
  },

  // Get suggestion history
  getSuggestionHistory: {
    input: {
      projectId: string,
      limit?: number,
      offset?: number
    },
    output: {
      suggestions: Array<{
        id: string,
        translationKey: string,
        suggestedText: string,
        applied: boolean,
        modelUsed: string,
        createdAt: Date
      }>,
      total: number
    }
  }
};
```

## Performance Optimization

### 1. Caching Strategy

```typescript
// Single-level database caching with 24-hour TTL
class AISuggestionsService {
  async getSuggestion(
    userId: string,
    projectId: string,
    translationKeyId: string,
    targetLanguageId: string
  ): Promise<TranslationSuggestion> {
    // Check database cache first
    const cached = await this.suggestionsDAL.getCachedSuggestion(
      translationKeyId,
      sourceLanguageId, // Always 'en' for source
      targetLanguageId
    );
    
    if (cached) {
      return {
        suggestedText: cached.suggested_text,
        confidenceScore: cached.confidence_score,
        modelUsed: cached.model_name,
        cached: true
      };
    }

    // Call Gemini API directly
    const response = await this.callGeminiAPI({
      sourceText: translationKey.source_text,
      targetLanguage: targetLanguage.code,
      context: project.description
    });

    // Cache in database (24-hour TTL)
    await this.suggestionsDAL.cacheSuggestion({
      translationKeyId,
      sourceLanguageId, // Always 'en'
      targetLanguageId,
      sourceText: translationKey.source_text,
      suggestedText: response.suggestedText,
      modelName: 'gemini-2.5-flash',
      confidenceScore: 0.95,
      contextUsed: { project_description: project.description }
    });

    return {
      suggestedText: response.suggestedText,
      confidenceScore: 0.95,
      modelUsed: 'gemini-2.5-flash',
      cached: false
    };
  }

  private async callGeminiAPI(params: {
    sourceText: string;
    targetLanguage: string;
    context?: string;
  }): Promise<{ suggestedText: string }> {
    const prompt = this.buildGeminiPrompt(params);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    const result = await response.json();
    return {
      suggestedText: result.candidates[0].content.parts[0].text.trim()
    };
  }

  private buildGeminiPrompt(params: {
    sourceText: string;
    targetLanguage: string;
    context?: string;
  }): string {
    const { sourceText, targetLanguage, context } = params;
    
    let prompt = `You are a translation assistant. Translate the following text from English to ${targetLanguage}. `;
    
    if (context) {
      prompt += `Context: ${context}. `;
    }
    
    prompt += `Text to translate: "${sourceText}". `;
    prompt += `Provide only the translation, no additional text or explanations.`;
    
    return prompt;
  }
}
```

### 2. Database Cache Optimization

```sql
-- Optimized indexes for fast cache lookups
CREATE INDEX CONCURRENTLY idx_suggestions_lookup_optimized ON ai_translation_suggestions(
    translation_key_id, 
    target_language_id,
    expires_at
) WHERE expires_at > NOW();

-- Partial index for active suggestions only
CREATE INDEX CONCURRENTLY idx_active_suggestions ON ai_translation_suggestions(
    translation_key_id,
    target_language_id
) WHERE expires_at > NOW();

-- Index for analytics queries
CREATE INDEX CONCURRENTLY idx_suggestions_analytics ON ai_translation_suggestions(
    created_at,
    model_name,
    target_language_id
);
```

### 3. API Response Optimization

```typescript
// Optimized response handling
class OptimizedAIService {
  async getSuggestionWithFallback(
    translationKeyId: string,
    targetLanguageId: string
  ): Promise<TranslationSuggestion> {
    try {
      // Primary: Database cache
      const cached = await this.getCachedSuggestion(translationKeyId, targetLanguageId);
      if (cached) return cached;

      // Secondary: Gemini API
      const geminiResult = await this.callGeminiAPI(/* params */);
      
      // Cache the result
      await this.cacheSuggestion(geminiResult);
      
      return geminiResult;
    } catch (error) {
      // Fallback: Return empty suggestion with error
      return {
        suggestedText: '',
        confidenceScore: 0,
        modelUsed: 'none',
        cached: false,
        error: 'Translation service temporarily unavailable'
      };
    }
  }
}
```

## Security Considerations

### 1. Input Validation

```typescript
// Strict input validation for Gemini API calls
class InputValidator {
  static readonly MAX_TEXT_LENGTH = 5000;
  static readonly ALLOWED_LANGUAGES = new Set(['en', 'es', 'fr', 'de', 'zh', 'ja', 'ar', 'it', 'pt', 'ru', 'ko']);
  
  static validateTranslationRequest(input: {
    sourceText: string;
    targetLanguage: string;
    projectId: string;
  }): void {
    // Text length validation
    if (input.sourceText.length > InputValidator.MAX_TEXT_LENGTH) {
      throw new Error("Text too long");
    }
    
    // Language validation
    if (!InputValidator.ALLOWED_LANGUAGES.has(input.targetLanguage)) {
      throw new Error(`Unsupported target language: ${input.targetLanguage}`);
    }
    
    // Source language must always be 'en'
    if (input.sourceText.trim().length === 0) {
      throw new Error("Source text cannot be empty");
    }
    
    // Sanitize text (basic XSS prevention)
    const sanitizedText = input.sourceText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
    
    if (sanitizedText !== input.sourceText) {
      throw new Error("Invalid characters in source text");
    }
  }
}
```

### 2. Rate Limiting

```typescript
// Per-user rate limiting with tRPC
import { rateLimit } from 'express-rate-limit';

const aiSuggestionsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each user to 100 requests per hour
  message: 'Too many translation requests, please try again later',
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Apply to tRPC router
export const aiSuggestionsRouter = router({
  getSuggestion: protectedProcedure
    .use(aiSuggestionsLimiter)
    .input(z.object({
      projectId: z.string(),
      translationKeyId: z.string(),
      targetLanguageId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate input
      InputValidator.validateTranslationRequest({
        sourceText: input.sourceText,
        targetLanguage: input.targetLanguage,
        projectId: input.projectId
      });
      
      // Check permissions
      await requireProjectPermission(ctx, input.projectId, ['owner', 'translator']);
      
      // ... rest of implementation
    })
});
```

### 3. API Key Security

```typescript
// Secure Gemini API key handling
class GeminiAPIService {
  private readonly apiKey: string;
  
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
  }
  
  async callGeminiAPI(prompt: string): Promise<string> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'LinguaFlow/1.0'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      // Log error but don't expose API key
      console.error('Gemini API call failed:', error.message);
      throw new Error('Translation service temporarily unavailable');
    }
  }
}
```

## User Experience

### 1. Loading States

```typescript
// Progressive loading feedback
const LoadingStates = {
  INITIALIZING: "Initializing AI model...",
  ANALYZING: "Analyzing context...",
  TRANSLATING: "Generating translation...",
  FINALIZING: "Finalizing suggestion..."
};

// Update loading message based on progress
useEffect(() => {
  if (loading) {
    const stages = Object.values(LoadingStates);
    let currentStage = 0;
    
    const interval = setInterval(() => {
      setLoadingMessage(stages[currentStage]);
      currentStage = (currentStage + 1) % stages.length;
    }, 1500);
    
    return () => clearInterval(interval);
  }
}, [loading]);
```

### 2. Confidence Indicators

```typescript
// Visual confidence feedback
const ConfidenceIndicator = ({ score }: { score: number }) => {
  const getColor = () => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };
  
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <LinearProgress
        variant="determinate"
        value={score * 100}
        color={getColor()}
        sx={{ width: 100, height: 8, borderRadius: 4 }}
      />
      <Typography variant="caption">
        {Math.round(score * 100)}% confidence
      </Typography>
    </Box>
  );
};
```

### 3. Keyboard Shortcuts

```typescript
// Keyboard shortcuts for efficiency
useKeyboardShortcut('cmd+g', () => {
  const currentRow = getActiveTranslationRow();
  if (currentRow && !currentRow.translation) {
    handleGetSuggestion(currentRow.key);
  }
});

useKeyboardShortcut('cmd+enter', () => {
  const currentSuggestion = getCurrentSuggestion();
  if (currentSuggestion) {
    handleApplySuggestion(currentSuggestion);
  }
});
```

## Deployment Strategy

### 1. Infrastructure

```yaml
# Simplified deployment - no Python AI service needed
version: '3.8'

services:
  # Only the main Next.js application
  linguaflow:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=linguaflow
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
```

### 2. Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://postgres:password@localhost:5432/linguaflow
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Simplified Scaling Strategy

```yaml
# kubernetes/linguaflow-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: linguaflow
spec:
  replicas: 3
  selector:
    matchLabels:
      app: linguaflow
  template:
    metadata:
      labels:
        app: linguaflow
    spec:
      containers:
      - name: linguaflow
        image: linguaflow/app:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        env:
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: linguaflow-secrets
              key: gemini-api-key
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: linguaflow-secrets
              key: database-url
```

### 4. Deployment Benefits

```typescript
// Simplified deployment advantages
const deploymentBenefits = {
  infrastructure: {
    noPythonService: 'Eliminates Python service deployment complexity',
    noModelManagement: 'No local model loading or GPU requirements',
    noRedisCache: 'Uses existing database for caching',
    simplifiedScaling: 'Only scale the main Next.js application'
  },
  cost: {
    noServerResources: 'No additional server costs for AI models',
    noGPURequirements: 'No expensive GPU instances needed',
    payPerUse: 'Only pay for Gemini API calls when used',
    predictableCosts: 'Fixed API costs per translation'
  },
  maintenance: {
    noModelUpdates: 'No local model version management',
    noPythonDependencies: 'No Python dependency management',
    simplifiedMonitoring: 'Only monitor main application',
    easierDebugging: 'Single codebase to debug'
  }
};
```

## Monitoring and Analytics

### 1. Metrics Collection

```python
# Prometheus metrics
from prometheus_client import Counter, Histogram, Gauge

translation_requests = Counter(
    'ai_translation_requests_total',
    'Total translation requests',
    ['source_lang', 'target_lang', 'model']
)

translation_latency = Histogram(
    'ai_translation_duration_seconds',
    'Translation request duration',
    ['model']
)

model_load_time = Histogram(
    'ai_model_load_duration_seconds',
    'Model loading duration',
    ['model']
)

active_models = Gauge(
    'ai_active_models',
    'Number of loaded models'
)

@translation_latency.time()
async def translate_with_metrics(request: TranslationRequest):
    translation_requests.labels(
        source_lang=request.source_language,
        target_lang=request.target_language,
        model=selected_model
    ).inc()
    
    return await translate(request)
```

### 2. Usage Analytics

```sql
-- Analytics queries
-- Most requested language pairs
SELECT 
    source_language_id,
    target_language_id,
    COUNT(*) as request_count
FROM ai_translation_suggestions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY source_language_id, target_language_id
ORDER BY request_count DESC;

-- Model performance comparison
SELECT 
    model_name,
    AVG(confidence_score) as avg_confidence,
    COUNT(*) as usage_count,
    SUM(CASE WHEN applied THEN 1 ELSE 0 END)::float / COUNT(*) as apply_rate
FROM ai_translation_suggestions s
JOIN ai_suggestion_applications a ON s.id = a.suggestion_id
GROUP BY model_name;

-- User adoption metrics
SELECT 
    DATE_TRUNC('day', created_at) as day,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) as total_suggestions,
    SUM(CASE WHEN applied THEN 1 ELSE 0 END) as applied_count
FROM ai_translation_suggestions
GROUP BY day
ORDER BY day;
```

### 3. Error Tracking

```python
# Sentry integration
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
    profiles_sample_rate=0.1,
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log to Sentry with context
    with sentry_sdk.push_scope() as scope:
        scope.set_context("translation_request", {
            "source_text": request.source_text[:100],
            "source_lang": request.source_language,
            "target_lang": request.target_language,
            "model": getattr(exc, 'model', 'unknown')
        })
        sentry_sdk.capture_exception(exc)
    
    return JSONResponse(
        status_code=500,
        content={"error": "Translation service error"}
    )
```

## Future Enhancements

### 1. Custom Model Training

```python
# Fine-tuning pipeline
class CustomModelTrainer:
    async def fine_tune_model(
        self,
        project_id: str,
        base_model: str,
        training_data: List[TranslationPair]
    ):
        # Prepare dataset
        dataset = self.prepare_dataset(training_data)
        
        # Configure training
        training_args = TrainingArguments(
            output_dir=f"./models/custom/{project_id}",
            num_train_epochs=3,
            per_device_train_batch_size=16,
            per_device_eval_batch_size=16,
            warmup_steps=500,
            weight_decay=0.01,
            logging_dir='./logs',
        )
        
        # Fine-tune
        trainer = Trainer(
            model=base_model,
            args=training_args,
            train_dataset=dataset["train"],
            eval_dataset=dataset["validation"]
        )
        
        trainer.train()
        
        # Save and register
        trainer.save_model()
        await self.register_custom_model(project_id, trainer.model)
```

### 2. Translation Memory Integration

```typescript
// Enhanced translation memory
interface TranslationMemoryEntry {
  id: string;
  sourceText: string;
  targetText: string;
  context: string;
  quality: number;
  usageCount: number;
  lastUsed: Date;
}

class TranslationMemoryService {
  async findSimilarTranslations(
    text: string,
    sourceLang: string,
    targetLang: string,
    threshold: number = 0.7
  ): Promise<TranslationMemoryEntry[]> {
    // Use vector similarity search
    const embedding = await this.getEmbedding(text);
    
    const results = await this.vectorDB.search({
      vector: embedding,
      filter: {
        sourceLang,
        targetLang
      },
      limit: 5,
      minSimilarity: threshold
    });
    
    return results.map(r => ({
      ...r,
      similarity: r.score
    }));
  }
}
```

### 3. Quality Estimation

```python
# Translation quality estimation
class QualityEstimator:
    def __init__(self):
        self.bert_score = load_metric("bertscore")
        self.bleu = load_metric("bleu")
        
    async def estimate_quality(
        self,
        source: str,
        translation: str,
        reference: Optional[str] = None
    ) -> QualityMetrics:
        metrics = {}
        
        # Fluency check using language model
        fluency_score = await self.check_fluency(translation)
        metrics['fluency'] = fluency_score
        
        # If reference available, calculate similarity
        if reference:
            bert_scores = self.bert_score.compute(
                predictions=[translation],
                references=[reference],
                lang=target_lang
            )
            metrics['bert_score'] = bert_scores['f1'][0]
            
            bleu_score = self.bleu.compute(
                predictions=[translation],
                references=[[reference]]
            )
            metrics['bleu'] = bleu_score['bleu']
        
        # Consistency check
        back_translation = await self.back_translate(translation)
        consistency = self.calculate_similarity(source, back_translation)
        metrics['consistency'] = consistency
        
        return QualityMetrics(**metrics)
```

### 4. Glossary Support

```typescript
// Project-specific glossaries
interface GlossaryEntry {
  id: string;
  projectId: string;
  sourceterm: string;
  targetTerm: string;
  context?: string;
  caseSensitive: boolean;
}

class GlossaryService {
  async applyGlossary(
    text: string,
    glossary: GlossaryEntry[],
    language: string
  ): Promise<string> {
    let processed = text;
    
    for (const entry of glossary) {
      const regex = new RegExp(
        entry.caseSensitive ? entry.sourceterm : entry.sourceterm,
        entry.caseSensitive ? 'g' : 'gi'
      );
      
      processed = processed.replace(regex, entry.targetTerm);
    }
    
    return processed;
  }
}
```

### 5. Collaborative Learning

```python
# Learn from user corrections
class CollaborativeLearner:
    async def learn_from_correction(
        self,
        original_suggestion: str,
        user_correction: str,
        context: TranslationContext
    ):
        # Store correction
        await self.store_correction({
            'original': original_suggestion,
            'corrected': user_correction,
            'context': context,
            'timestamp': datetime.now()
        })
        
        # Update model preferences
        if self.should_update_preferences(original_suggestion, user_correction):
            await self.update_model_preferences(
                context.source_lang,
                context.target_lang,
                context.domain
            )
        
        # Schedule fine-tuning if threshold reached
        correction_count = await self.get_correction_count(context.project_id)
        if correction_count >= self.FINE_TUNE_THRESHOLD:
            await self.schedule_fine_tuning(context.project_id)
```

## Conclusion

This AI-powered translation suggestion feature will significantly enhance translator productivity while maintaining quality through human oversight. The architecture is designed to be scalable, performant, and extensible for future enhancements. The implementation prioritizes user experience with real-time suggestions, confidence scoring, and seamless integration into the existing translation workflow. 