# Translation Import/Export Implementation Plan

## Overview

This document outlines the implementation plan for adding import/export functionality to LinguaFlow. The initial version will support JSON format, with YAML and CSV formats planned for future releases.

## Goals

1. **Import**: Allow users to upload translation files and import them into their projects
2. **Export**: Enable users to download their translations in various formats
3. **MVP Focus**: Keep the implementation simple but valuable for users
4. **Consistency**: Align with existing architecture patterns (tRPC, DAL, Services, DI)

## JSON File Format

Based on the existing GitHub integration, we'll support the standard nested JSON format:

```json
{
  "common.hello": "Hello",
  "common.goodbye": "Goodbye",
  "auth.login": "Login",
  "auth.logout": "Logout"
}
```

## Backend Implementation

### 1. tRPC Endpoints

#### Import Endpoint

```typescript
// src/server/routers/translations.ts

translations.importTranslations: protectedProcedure
  .input(z.object({
    projectId: z.string(),
    languageId: z.string(),
    fileContent: z.string(), // Base64 encoded file content
    fileName: z.string(),
    importMode: z.enum(['merge', 'replace']), // How to handle existing translations
  }))
  .mutation(async ({ ctx, input }) => {
    // Implementation details below
  })
```

#### Export Endpoint

```typescript
// src/server/routers/translations.ts

translations.exportTranslations: protectedProcedure
  .input(z.object({
    projectId: z.string(),
    languageIds: z.array(z.string()), // Export multiple languages at once
    format: z.enum(['json']), // Initially just JSON
  }))
  .query(async ({ ctx, input }) => {
    // Returns download URL or base64 content
  })
```

### 2. Service Layer Updates

#### TranslationsService

Add new methods to handle import/export logic:

```typescript
// src/lib/services/translations.service.ts

class TranslationsService {
  async importFromJSON(
    projectId: string,
    languageId: string,
    jsonContent: string,
    importMode: 'merge' | 'replace',
    userId: string
  ): Promise<ImportResult> {
    // 1. Parse JSON content
    // 2. Validate structure
    // 3. Extract translation keys and values
    // 4. Handle import mode (merge vs replace)
    // 5. Use existing batch import logic
    // 6. Return import statistics
  }

  async exportToJSON(
    projectId: string,
    languageIds: string[]
  ): Promise<ExportResult> {
    // 1. Fetch translations for specified languages
    // 2. Organize by language
    // 3. Generate JSON files
    // 4. Return file content or download URLs
  }
}
```

### 3. Data Access Layer (DAL)

Leverage existing DAL methods and add specific ones for import/export:

```typescript
// src/lib/dal/translations.ts

class TranslationsDAL {
  // Existing methods we'll reuse:
  // - upsertTranslationKeys
  // - upsertTranslations
  // - getProjectTranslationsForExport
  
  // New method for replace mode
  async deleteTranslationsByLanguage(
    projectId: string,
    languageId: string
  ): Promise<void> {
    // Delete all translations for a language in a project
  }
}
```

### 4. Import Logic Details

#### Parse and Validate

```typescript
interface ParsedTranslation {
  key: string;
  value: string;
}

function parseJSONTranslations(content: string): ParsedTranslation[] {
  const data = JSON.parse(content);
  const translations: ParsedTranslation[] = [];
  
  // Flatten nested structure (reuse existing logic from GitHub import)
  const flattenObject = (obj: any, prefix = ''): void => {
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        flattenObject(value, fullKey);
      } else if (typeof value === 'string') {
        translations.push({ key: fullKey, value });
      }
    }
  };
  
  flattenObject(data);
  return translations;
}
```

#### Import Modes

1. **Merge Mode** (default):
   - Add new keys
   - Update existing translations
   - Preserve translations not in the import file

2. **Replace Mode**:
   - Delete all existing translations for the language
   - Import all translations from the file
   - Useful for complete overwrites

#### Import Result

```typescript
interface ImportResult {
  success: boolean;
  stats: {
    totalKeys: number;
    newKeys: number;
    updatedTranslations: number;
    unchangedTranslations: number;
    errors: string[];
  };
}
```

### 5. Export Logic Details

#### File Generation

```typescript
function generateJSONFile(translations: Translation[]): string {
  const result: Record<string, string> = {};
  
  // Sort by entry_order to maintain consistency
  translations.sort((a, b) => a.entry_order - b.entry_order);
  
  // Build flat key-value structure
  for (const translation of translations) {
    result[translation.key] = translation.content;
  }
  
  return JSON.stringify(result, null, 2);
}
```

#### Multi-language Export

When exporting multiple languages, create a ZIP file containing individual JSON files:

```
project-translations.zip
├── en.json
├── fr.json
└── es.json
```

## Frontend Implementation

### 1. Import UI Component

Create a new component for the import functionality:

```
src/components/projects/translations/import-export/
├── translation-import.tsx
├── translation-export.tsx
└── import-export-dialog.tsx
```

#### Import Dialog Features

1. **File Upload**:
   - Drag and drop support
   - File type validation (only .json initially)
   - File size limit (e.g., 5MB)

2. **Import Options**:
   - Language selection dropdown
   - Import mode selection (merge/replace)
   - Preview of detected keys

3. **Progress & Feedback**:
   - Upload progress bar
   - Import statistics display
   - Error handling with clear messages

### 2. Export UI Component

#### Export Dialog Features

1. **Language Selection**:
   - Checkbox list of available languages
   - Select all/none options

2. **Format Selection**:
   - Radio buttons for format (initially just JSON)
   - Format preview

3. **Download Options**:
   - Single file for one language
   - ZIP file for multiple languages

### 3. Integration Points

Add import/export buttons to the translations header:

```typescript
// src/components/projects/translations/translations-header.tsx

// Add new buttons alongside existing ones
<Button startIcon={<UploadIcon />} onClick={handleImportClick}>
  Import
</Button>
<Button startIcon={<DownloadIcon />} onClick={handleExportClick}>
  Export
</Button>
```

### 4. State Management

Use Redux for managing import/export state:

```typescript
// src/store/slices/import-export.slice.ts

interface ImportExportState {
  isImportDialogOpen: boolean;
  isExportDialogOpen: boolean;
  importProgress: number;
  importResult: ImportResult | null;
  exportProgress: number;
}
```

## Error Handling

### Import Errors

1. **File Validation**:
   - Invalid JSON format
   - Unsupported file type
   - File too large

2. **Content Validation**:
   - Invalid key format
   - Non-string values
   - Duplicate keys in file

3. **Processing Errors**:
   - Network errors
   - Database constraints
   - Permission issues

### Export Errors

1. **No Translations**:
   - Show message when no translations exist

2. **Large Datasets**:
   - Implement pagination for very large exports
   - Show progress for long operations

## User Experience Considerations

### Import Flow

1. User clicks "Import" button
2. Dialog opens with file upload area
3. User selects/drops file
4. System validates and shows preview
5. User selects language and import mode
6. User confirms import
7. Progress bar shows during processing
8. Results displayed with statistics
9. Dialog can be closed or another import started

### Export Flow

1. User clicks "Export" button
2. Dialog opens with language selection
3. User selects languages to export
4. User clicks "Download"
5. File downloads immediately (or progress shown for large exports)
6. Success message displayed

## Security Considerations

1. **File Size Limits**: Enforce reasonable limits (e.g., 5MB)
2. **Content Validation**: Sanitize all imported content
3. **Rate Limiting**: Prevent abuse of import/export endpoints
4. **Authentication**: All endpoints require authentication
5. **Project Access**: Verify user has access to the project

## Performance Optimizations

1. **Batch Processing**: Use existing batch import logic
2. **Streaming**: For large exports, consider streaming responses
3. **Caching**: Cache export results for quick re-downloads
4. **Background Jobs**: For very large imports, consider background processing

## Future Enhancements

### Phase 2: YAML Support
- Add YAML parsing library
- Support both flat and nested YAML structures
- Handle YAML-specific features (anchors, multi-line strings)

### Phase 3: CSV Support
- Design CSV format (key, language1, language2, etc.)
- Handle special characters and escaping
- Support bulk multi-language import

### Phase 4: Advanced Features
- Import from URL
- Scheduled exports
- Export templates/transformations
- Translation memory integration

## Implementation Timeline

### Week 1: Backend
- Day 1-2: tRPC endpoints and schemas
- Day 3-4: Service layer implementation
- Day 5: DAL updates and testing

### Week 2: Frontend
- Day 1-2: Import dialog and file upload
- Day 3-4: Export dialog and download logic
- Day 5: Integration and error handling

### Week 3: Polish & Testing
- Day 1-2: Error handling improvements
- Day 3-4: Testing and bug fixes
- Day 5: Documentation and deployment

## Success Metrics

1. **Functionality**: Users can successfully import/export translations
2. **Performance**: Import/export completes within reasonable time
3. **Reliability**: Low error rate and good error recovery
4. **Usability**: Intuitive UI with clear feedback

## Conclusion

This implementation plan provides a solid foundation for translation import/export functionality. It leverages existing infrastructure while adding valuable new capabilities for users. The phased approach allows for MVP delivery while planning for future enhancements. 