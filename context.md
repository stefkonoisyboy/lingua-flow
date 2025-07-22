# LocaleGuru - Localization Management Platform

## Project Overview

LocaleGuru is a Micro SaaS application focused on localization management for web applications. The platform facilitates translation management, collaborative translation workflows, and file integration with various services.

### Project Description

LocaleGuru simplifies the localization process for web applications by providing a centralized platform where developers and translators can collaborate efficiently. The platform automates the extraction of translatable content from source code, manages translation workflows, and synchronizes translations back to the codebase.

Key Features:

- Automated translation file discovery and synchronization
- Multi-language support with version control
- Collaborative translation environment
- Progress tracking and analytics
- Integration with version control systems (currently GitHub)
- Translation memory and consistency checks
- Real-time collaboration tools

## Application Flows

### 1. User Authentication Flow

- Sign up with email/password
- Sign in with email/password
- Sign in with GitHub OAuth
- Password reset flow
- Email verification
- Session management with SSR support

### 2. Project Creation and Setup Flow

- Create new project
- Configure project settings
- Add/remove project languages
- Set up translation workflows
- Configure access permissions
- Integration with version control

### 3. GitHub Integration Flow

- Connect GitHub repository
- Repository access authorization
- Translation file discovery
  - Automatic file detection
  - Manual path specification
- File content synchronization
- Change tracking and version control

### 4. Translation Management Flow

- Import translation files
  - Automatic file discovery from GitHub
  - Support for JSON, YAML, and PO files
  - Batch processing for efficient imports
    - Initial collection of all translations from all files
    - Deduplication of translation keys across files
    - Processing in batches of 500 for optimal performance
    - Bulk upsert of translation keys with composite unique constraint (project_id, key)
    - Bulk upsert of translations with proper conflict handling
    - Batch version history creation with unique constraints
  - Initial version history creation for imported translations
  - Source tracking (repository, file path, branch)
  - Unique version tracking (translation_id, version_number)
  - Enhanced error handling for translation imports
  - Type-safe batch operations
- Translation Interface
  - Component Structure:
    - ProjectTranslations: Main orchestrator component
      - Manages state and data flow
      - Handles form state with Formik and Zod validation
      - Coordinates child components
    - TranslationsHeader: Controls and actions
      - Language selection dropdown
      - Add/Save/Cancel buttons
      - Title and description
    - TranslationForm: New key addition
      - Form fields with validation
      - Error display
      - Formik integration
    - TranslationsTable: Data display
      - Existing translations view
      - Integration with form component
      - Action buttons
      - Error messages using styled components
      - Form validation feedback with consistent theme styling
    - TranslationsPlaceholders: Empty states
      - No language selected view
      - No translations available view
  - Language selection dropdown for target language
  - Table-based translation management with:
    - Key name field (editable)
    - Source text display (read-only)
    - Translation content (editable with auto-resizing textarea)
    - Action buttons for comments
    - Error messages using theme-consistent styling
  - Placeholder states for:
    - No language selected
    - No translation keys available
  - Server-side pagination for efficient loading
  - Loading states and error handling
  - Styled components for consistent UI:
    - Separate style files for translations, tabs, and project details
    - No inline styles (sx props) for better maintainability
    - MUI theme integration for light/dark mode support
    - Error messages using theme colors and spacing
    - Consistent typography and spacing through theme values
  - Form validation with Formik and Zod
    - Client-side validation matching server schema
    - Proper error states and messages
    - Type-safe form handling
    - Theme-consistent error display
- Create/edit translation keys
  - Backend Implementation:
    - DAL Layer (TranslationsDAL):
      - updateTranslationKey: Updates key name with version tracking
      - updateTranslation: Updates translation content with version history
      - createTranslation: Creates new translation with initial version
      - Automatic updated_at timestamp management
      - Proper error handling and constraints
      - Batch operations support with transaction handling
      - Composite unique constraints (project_id, key)
      - Efficient bulk upsert operations
    - Service Layer (TranslationsService):
      - Business logic for translation operations
      - Version history management
      - Data validation and sanitization
      - Transaction handling for atomic operations
      - Batch processing capabilities
      - Deduplication handling
      - Source tracking management
    - tRPC Endpoints:
      - updateTranslationKey: Updates key names
      - updateTranslation: Updates existing translations
      - createTranslation: Creates new translations
      - Automatic cache invalidation
      - Type-safe mutation responses
      - Input validation using Zod schemas
      - Error handling with proper error codes
      - Batch operation support
    - Version History Tracking:
      - Automatic version number incrementation
      - Stores previous content for rollback
      - Tracks user making the change
      - Maintains complete audit trail
      - Unique constraint on translation_id and version_number
      - Batch version history creation
      - Source tracking (repository, file path, branch)
  - Frontend Implementation:
    - Form handling with Formik
    - Validation using Yup schema
    - Optimistic updates with tRPC
    - Error handling and display
    - Loading states during mutations
- Batch translation updates
- Translation progress tracking
- Export translations
- Version history and rollback
  - Backend Implementation:
    - DAL Layer (VersionHistoryDAL):
      - Efficient pagination with PaginationDAL integration
      - Join with profiles table for user information
      - Automatic version number incrementation
      - Type-safe version history tracking
      - Proper error handling and constraints
    - One-by-one revert: Provides a method to fetch a single version entry and revert a translation to that specific version (no bulk/group revert).
    - Service Layer (VersionHistoryService):
      - Type-safe version history operations
      - Consistent interface with DAL
      - Email lookup through profiles table
    - Implements revertTranslationToVersion: Updates a single translation to the content of a selected version, creates a new version history entry, and logs the activity. No batch or group revert is performed.
    - Data Model:
      - version_history table with user relationship
      - Foreign key to profiles for user information
      - Composite unique constraints
      - Automatic timestamp management
    - tRPC Router:
      - Exposes getVersionHistory (query) and revertTranslationToVersion (mutation) endpoints for per-translation version history and revert actions.
  - Frontend Implementation:
    - VersionHistoryDialog component:
      - Modal dialog for version history display
      - Real-time version history loading
      - Styled components for consistent UI:
        - StyledDialog: Base dialog styling
        - HistoryHeader: Header with title and close button
        - HistoryContent: Scrollable content area
        - VersionEntry: Individual version entry
        - VersionMeta: Version metadata display
        - VersionContent: Version content with proper formatting
      - Loading and empty states
      - User-friendly date formatting
      - Clear version numbering
      - Email display for change tracking
      - For each version (except the latest), displays a revert icon button. When clicked, opens a confirmation modal.
      - On confirmation, calls the revertTranslationToVersion mutation to revert the translation to the selected version. Shows loading state and feedback via snackbar.
      - No group or bulk revert is available; revert is strictly one-by-one per version entry.
    - Integration with TranslationsTable
    - tRPC query integration
    - Proper error handling
    - Responsive design
- Translation memory suggestions
- Translation status management (pending, in_progress, reviewed, approved)

- Comment and Feedback System
  - Backend Implementation:
    - DAL Layer (CommentsDAL):
      - `getComments`: Fetches comments for a translation with user info.
      - `addComment`: Creates a new comment.
      - `deleteComment`: Deletes a comment.
      - `getTranslationProjectId`: Retrieves project ID for activity logging.
    - Service Layer (CommentsService):
      - Business logic for comment operations.
      - Logs activity when a new comment is added.
    - tRPC Endpoints:
      - `getComments`: Protected query to fetch comments.
      - `addComment`: Protected mutation to add a new comment.
      - `deleteComment`: Protected mutation to delete a comment.
      - Input validation using Zod.
  - Frontend Implementation:
    - CommentsDialog component:
      - Modal dialog for viewing and adding comments.
      - Real-time comment loading with tRPC.
      - Form handling with Formik and Yup for validation.
      - Loading, empty, and error states.
      - Styled with theme-aware components.
    - Integration with TranslationsTable:
      - Comment icon opens the dialog for the selected translation.
      - State management for dialog visibility.

### 5. Collaboration Flow

- Invite team members
- Role-based access control
- Comment and feedback system
  - Real-time discussion thread for each translation string.
  - Users can add, view, and delete their own comments.
  - Comments are displayed in a modal dialog with user avatars, names, and timestamps.
  - Seamless integration with the translations table.
- Translation review process
- Activity tracking
- Real-time updates

### 6. Analytics and Reporting Flow

- Translation progress metrics
- Team performance analytics
- Project status reporting
- Activity logs and audit trails
- Resource utilization tracking

## Tech Stack

- Next.js 15 (Latest stable version)
- Supabase (Authentication & Database)
- tRPC
- MaterialUI
- Redux Toolkit
- TypeScript
- Formik for forms

## Architecture Decisions

### Dependency Injection (DI) System

The application uses a custom DI system for better maintainability and testability:

#### Core Components

1. DIContainer
   - Centralized container for managing dependencies
   - Support for singleton and transient services
   - Type-safe service resolution
   - Request-scoped container creation

2. Interface Structure
   - DAL Interfaces (data access layer)
     - IProjectsDAL
     - IActivitiesDAL
     - ITranslationsDAL
       - getTranslationKeys: Fetches translation keys with translations
       - updateTranslationKey: Updates key name
       - updateTranslation: Updates translation content
       - createTranslation: Creates new translation
       - createVersionHistory: Tracks version history
     - IIntegrationsDAL
     - IPaginationDAL
     - IVersionHistoryDAL
     - IGitHubTokensDAL
     - ICommentsDAL
   - Service Interfaces
     - IProjectsService
     - ILanguagesService
     - ITranslationsService
       - updateTranslationKey: Updates key with validation
       - updateTranslation: Updates translation with version tracking
       - createTranslation: Creates translation with initial version
     - IIntegrationsService
     - IGitHubTokensService
     - ICommentsService

3. Implementation Pattern
   - Services depend on DAL interfaces
   - DALs implement database operations
   - Services implement business logic
   - tRPC routers use services through DI
   - GitHub integration split into dedicated service and DAL
   - Token management handled by GitHubTokensService

4. Request Scoping
   - New container created per request
   - Supabase client injected at request level
   - Services resolved within request scope
   - All services registered as singletons by default

5. Service Dependencies
   - ProjectsService: depends on ProjectsDAL, ActivitiesDAL, TranslationsDAL, IntegrationsService
   - IntegrationsService: depends on IntegrationsDAL, TranslationsDAL, ProjectsDAL
   - TranslationsService: depends on TranslationsDAL, VersionHistoryDAL
   - GitHubTokensService: depends on GitHubTokensDAL
   - LanguagesService: depends on LanguagesDAL
   - CommentsService: depends on ICommentsDAL, IActivitiesDAL

6. DAL Dependencies
   - TranslationsDAL: depends on PaginationDAL, VersionHistoryDAL
   - VersionHistoryDAL: depends on PaginationDAL
   - Other DALs: depend only on Supabase client

### Frontend Architecture

- React Server Components and Next.js SSR features are preferred
- Client components ('use client') are minimized to small, isolated components
- MaterialUI for UI components (no TailwindCSS)
- MUI styled components instead of sx props
  - All styles are moved to dedicated style files under /styles directory
  - No inline styles (sx props) in components for better maintainability
  - Theme-aware styling with proper light/dark mode support
  - Custom background colors defined in theme for consistent styling:
    - customBackground.settingsSection: For settings section backgrounds
    - customBackground.versionContent: For version history content
  - Styled components organized by feature:
    - project-details.styles.ts: Page layout components
    - project-settings.styles.ts: Settings form and language management
    - project-tabs.styles.ts: Tab navigation components
    - translations-header.styles.ts: Translation management header
    - version-history.styles.ts: Version history dialog
- Redux Toolkit for global state management
- Responsive UI with dark theme support
- Component structure:
  - Hooks at the top
  - Variables/state
  - Handlers
  - useEffects

### Project Settings Implementation

#### Frontend Components

1. ProjectSettings (project-settings.tsx)
   - Main container for project settings
   - Manages success/error messages with auto-dismiss
   - Coordinates ProjectDetailsForm and ProjectLanguages components

2. ProjectDetailsForm (project-details-form.tsx)
   - Handles project name and description updates
   - Uses Formik for form management
   - Implements optimistic updates with tRPC
   - Styled sections with theme-aware components

3. ProjectLanguages (project-languages.tsx)
   - Manages project language operations
   - Add/remove language functionality
   - Default language selection
   - Styled language list with flag display
   - Confirmation dialog for language removal

4. Styled Components Structure
   - ProjectSettingsContainer: Main container styling
   - SettingsSection: Section styling with theme-aware background
   - LanguagesList: Language items container
   - LanguageItem: Individual language entry styling
   - ActionButtons: Language action buttons layout
   - LanguageInfo: Language details display
   - FormContainer: Form layout management
   - FormActions: Form buttons layout
   - LanguageSelectionContainer: Language selection area
   - AlertContainer: Success/error alerts styling

#### Backend Implementation

1. DAL Layer
   - ProjectsDAL: Handles project updates
   - LanguagesDAL: Manages language operations
   - Implements proper error handling
   - Maintains updated_at timestamps

2. Service Layer
   - ProjectsService: Project management logic
   - LanguagesService: Language operations
   - Implements business rules and validation
   - Coordinates with activity logging

3. tRPC Endpoints
   - projects.updateProject: Updates project details
   - projects.addProjectLanguage: Adds new language
   - projects.removeProjectLanguage: Removes language
   - projects.setDefaultLanguage: Updates default language

4. Data Model Impact
   - projects table: Stores project details
   - project_languages table: Manages language associations
   - activity_log table: Tracks language changes

### UI/UX Improvements

1. Theme Integration
   - Consistent color scheme across components
   - Theme-aware styling for light/dark modes
   - Custom background colors in theme configuration
   - Proper spacing through theme.spacing

2. Component Organization
   - Separate style files for each feature
   - Reusable styled components
   - Clear component hierarchy
   - Consistent styling patterns

3. Form Handling
   - Formik integration for forms
   - Proper validation feedback
   - Loading states during mutations
   - Success/error message handling

4. Navigation
   - Tab-based navigation with styled indicators
   - Consistent header layouts
   - Proper spacing and alignment

### File Structure

- Components use kebab-case naming (e.g., my-component.tsx)
- Styled components in separate files under /styles folder, separated by domain
- Minimal CSS files, avoiding CSS classes in components
- MUI icons used throughout the app

### Backend & Data Model

#### Data Access Layer (DAL)

- Centralized pagination handling through `PaginationDAL`
  - Handles Supabase's 1000-row limit
  - Provides generic `fetchAllPages` method for all DAL classes
  - Consistent pagination implementation across the application
  - Automatic handling of large datasets
  - Type-safe pagination results
  - Integrated into TranslationsDAL and VersionHistoryDAL

#### Supabase Tables and Enums

1. profiles

   - id (primary key)
   - full_name
   - avatar_url
   - preferences (JSONB)
   - created_at
   - updated_at

2. projects

   - id (primary key)
   - name
   - description
   - created_by (foreign key to profiles)
   - default_language_id (foreign key to languages)
   - status (enum: active, archived)
   - created_at
   - updated_at

3. languages

   - id (primary key)
   - code
   - name
   - flag_url
   - is_rtl
   - created_at
   - updated_at

4. project_languages

   - project_id (foreign key to projects)
   - language_id (foreign key to languages)
   - is_default
   - created_at
   - updated_at

5. translation_keys

   - id (primary key)
   - key
   - description
   - project_id (foreign key to projects)
   - created_at
   - updated_at

6. translations

   - id (primary key)
   - key_id (foreign key to translation_keys)
   - language_id (foreign key to languages)
   - content
   - status (enum: pending, in_progress, reviewed, approved)
   - translator_id (foreign key to profiles)
   - reviewer_id (foreign key to profiles)
   - created_at
   - updated_at

7. version_history

   - id (primary key)
   - translation_id (foreign key to translations)
   - content
   - version_number
   - version_name
   - changed_by (foreign key to profiles)
   - created_at
   - updated_at

8. comments

   - id (primary key)
   - translation_id (foreign key to translations)
   - content
   - user_id (foreign key to profiles)
   - created_at
   - updated_at

9. project_members

   - project_id (foreign key to projects)
   - user_id (foreign key to profiles)
   - role (enum: owner, translator, viewer)
   - created_at
   - updated_at

10. project_integrations

    - id (primary key)
    - project_id (foreign key to projects)
    - type (enum: github, gitlab, api, file)
    - config (JSONB)
    - is_connected
    - last_synced_at
    - created_at
    - updated_at

11. github_tokens

    - id (primary key)
    - user_id (foreign key to profiles)
    - access_token
    - created_at
    - updated_at

12. activity_log

    - id (primary key)
    - project_id (foreign key to projects)
    - user_id (foreign key to profiles)
    - activity_type (enum: translation_updated, language_added, comment_added, member_added, member_removed, integration_connected, integration_disconnected, sync_completed)
    - resource_type
    - resource_id
    - details (JSONB)
    - created_at
    - updated_at

13. sync_history
    - id (primary key)
    - project_id (foreign key to projects)
    - integration_id (foreign key to project_integrations)
    - status (enum: success, failed)
    - details (JSONB)
    - created_at
    - updated_at

#### Enums

- activity_type: translation_updated, language_added, comment_added, member_added, member_removed, integration_connected, integration_disconnected, sync_completed
- integration_type: github, gitlab, api, file
- project_status: active, archived
- sync_status: success, failed
- translation_status: pending, in_progress, reviewed, approved
- user_role: owner, translator, viewer

### Authentication

- Using Supabase Auth with SSR implementation
- Middleware for session management and protected routes
- Auth flows implemented:
  - Email/Password
  - GitHub OAuth
  - Password Reset

### GitHub Integration

- Implemented in github.service.ts
- Features:
  - Repository connection
  - Translation file discovery
  - File content synchronization
- Uses translation path parameter for targeted file searches

## Current Features

1. User Authentication
2. Project Management
3. GitHub Integration
4. Translation Management
5. Activity Tracking

## Development Guidelines

1. Always implement loading and error states for data fetching
2. Implement proper error handling and logging
3. Use semantic HTML elements
4. Make components reusable
5. Avoid implementing business logic in pages
6. Use constants instead of magic strings/numbers
7. No RLS policies per project requirements

## Important Notes

- The project is currently on the feature/github-integration branch
- Supabase permissions are set up with:
  - Schema usage granted to anon and authenticated users
  - Table permissions (SELECT, INSERT, UPDATE) granted to authenticated and anon users

## [Update: GitHub Integration & Translation Order Improvements]

### Backend Changes

#### 1. Translation Import/Export Order Tracking
- **entry_order column** added to the `translations` table to track the order in which translations are inserted per language.
- **Import logic updated**:
  - During GitHub import, the order of translations in the source file is preserved by assigning `entry_order` based on their appearance.
  - When inserting multiple translations for the same language in a batch (e.g., via `createTranslationKeyWithTranslations`), the system:
    - Queries the current max `entry_order` for that language.
    - Assigns consecutive `entry_order` values (`max + 1`, `max + 2`, ...) to new translations, ensuring uniqueness and order preservation.
- **Export logic updated**:
  - When exporting translations to GitHub, translations are ordered by `entry_order` (with a secondary order by `id` for pagination stability).

#### 2. Pagination & Query Stability
- **Pagination bug fixed**: When paginating joined queries (e.g., translations with keys/languages), a secondary order by `id` is added to ensure stable, unique ordering and prevent off-by-one errors.
- **Deduplication**: Ensured that translation export queries do not return duplicate or missing rows due to join multiplicity.

#### 3. GitHub PR Change Detection
- **Improved PR logic**: PRs are only created if there are actual content changes, not just changes in translation order. This prevents unnecessary PRs when only the order of translations changes.

### Frontend Changes

#### 1. Integration Creation Flow
- **Reusable GitHub integration form**: The logic for connecting a GitHub repository and creating an integration is now shared between project creation and the integrations list (when no integration exists).
- **UI/UX**:
  - Users can connect a repository and configure integration directly from the integrations list if none exists.
  - The integration creation dialog reuses the GitHub config component and logic from the project creation form.

#### 2. Translation Import Feedback
- **Sync history**: After import/export actions, the sync history is updated and shown in the UI, reflecting the result of the operation (success, failure, or no changes).
- **Loading and error states**: All integration and translation import/export actions provide user feedback, including loading indicators and error messages.

#### 3. Consistency and Best Practices
- **Consistent ordering**: The frontend now relies on the backend's `entry_order` to display translations in the same order as in the source files, ensuring a consistent experience between LinguaFlow and GitHub.
- **Type safety and error handling**: All new logic follows the project's standards for type safety, error handling, and user feedback.

---

## [Update: Conflict Resolution System]

### Overview

The conflict resolution system provides a comprehensive workflow for detecting and resolving translation conflicts between LinguaFlow and GitHub repositories. It supports both automatic and manual export options, with robust conflict detection and resolution capabilities.

### Backend Implementation

#### 1. Conflict Detection Service (IntegrationsService)

**Key Methods:**
- `pullAndDetectConflicts`: Pulls translation files from GitHub and detects conflicts
- `resolveAllTranslationConflicts`: Resolves conflicts for all languages in a single request
- `resolveTranslationConflicts`: Legacy method that delegates to the new batch method

**Conflict Detection Logic:**
- **Key-based comparison**: Conflicts are detected by comparing actual translation keys, not by position
- **Multi-language support**: Detects conflicts across all project languages simultaneously
- **Position tracking**: Maintains position information for UI display purposes
- **Robust parsing**: Handles JSON translation files with proper error handling

**Conflict Types Detected:**
- **Only in LinguaFlow**: Translation exists locally but not in GitHub
- **Only in GitHub**: Translation exists in GitHub but not in LinguaFlow
- **Different values**: Same key exists in both but with different values

#### 2. Resolution Processing

**Batch Processing:**
- **Single API request**: All language resolutions processed in one call for efficiency
- **Key creation**: Automatically creates new translation keys if they don't exist in LinguaFlow
- **Translation updates**: Updates existing translations or creates new ones as needed
- **Error handling**: Comprehensive error handling with proper rollback

**Data Flow:**
1. Collect all resolutions from frontend
2. Create missing translation keys
3. Update/create translations for each resolution
4. Return success status

#### 3. Export Integration

**Automatic Export:**
- **Post-resolution export**: Automatically triggers GitHub export after successful conflict resolution
- **Pull request creation**: Creates PRs with resolved translations
- **No-changes detection**: Handles cases where no changes are needed (e.g., all GitHub versions selected)
- **Error recovery**: Provides retry mechanism for failed exports

**Export Response Handling:**
- **With changes**: Returns pull request URL for user access
- **No changes**: Returns success without PR URL, indicating no changes were needed

#### 4. tRPC Endpoints

**New Endpoints:**
- `integrations.pullAndDetectConflicts`: Pulls from GitHub and detects conflicts
- `integrations.resolveConflicts`: Resolves all conflicts in a single request

**Input/Output Schemas:**
```typescript
// Pull and detect conflicts
input: {
  projectId: string;
  integrationId: string;
  repository: string;
  branch: string;
}
output: Record<string, Conflict[]>

// Resolve conflicts
input: {
  projectId: string;
  resolutions: Array<{
    languageId: string;
    resolutions: Array<{
      key: string;
      resolvedValue: string;
    }>;
  }>;
}
output: { success: boolean }
```

### Frontend Implementation

#### 1. Redux State Management

**Conflict Resolution Slice:**
- **State structure**: Stores conflicts by language code with position tracking
- **Actions**:
  - `setConflicts`: Stores detected conflicts
  - `clearConflicts`: Clears all conflicts
  - `clearResolvedConflicts`: Removes specific resolved conflicts
  - `setStatus`/`setError`: Manages loading and error states

**Conflict Data Structure:**
```typescript
type Conflict = {
  linguaFlowKey: string | undefined;
  linguaFlowValue: string | undefined;
  githubKey: string | undefined;
  githubValue: string | undefined;
  position: number;
};
```

#### 2. Conflict Resolution Page

**Component Structure:**
- **Main page**: `src/app/(authenticated)/projects/[projectId]/conflict-resolution/page.tsx`
- **Layout**: Reuses project header with dynamic breadcrumbs
- **Navigation**: "Back to Project" button for easy navigation

**Key Features:**
- **Multi-language conflict display**: Accordion-based interface grouped by language
- **Resolution options**: Radio buttons for LinguaFlow, GitHub, or manual values
- **Bulk actions**: "Keep All LinguaFlow" and "Keep All GitHub" buttons
- **Progress tracking**: Real-time conflict count and resolution status
- **Auto-export control**: Checkbox to enable/disable automatic export

**UI States:**
- **Loading**: During conflict detection and resolution
- **Resolved**: All controls disabled, success messages displayed
- **Export progress**: Shows export status and pull request creation
- **Error handling**: Retry mechanisms for failed operations

#### 3. Integration Card Updates

**Sync Button Enhancement:**
- **Updated tooltip**: "Sync & Resolve Conflicts" to clarify functionality
- **Workflow**: Click sync → Detect conflicts → Navigate to resolution page
- **Removed export**: Export functionality moved to conflict resolution page

**User Flow:**
1. Click "Sync & Resolve Conflicts" button
2. System pulls from GitHub and detects conflicts
3. Redirects to conflict resolution page
4. User resolves conflicts and applies resolutions
5. Automatic export to GitHub (if enabled)

#### 4. Hybrid Export System

**Auto-Export Feature:**
- **Default behavior**: Automatic export after resolution (enabled by default)
- **Manual option**: Checkbox to disable auto-export for manual control
- **Button text**: Dynamically shows "Apply Resolutions & Export" or "Apply Resolutions"

**Manual Export:**
- **Export button**: Appears when auto-export is disabled
- **Button text**: "Export to GitHub (if changes)" to set expectations
- **No-changes feedback**: Clear messaging when no changes are detected

#### 5. Success/Error Handling

**Success States:**
- **Resolutions applied**: "Resolutions applied successfully!" or "Resolutions applied locally!"
- **Exporting**: "Exporting to GitHub..." with progress indicator
- **Completed**: "Sync completed successfully!" with pull request link
- **No changes**: "No changes to export!" with explanation

**Error Handling:**
- **Export errors**: Displays error message with retry button
- **Network errors**: Proper error messages and recovery options
- **Validation errors**: Form validation with clear feedback

#### 6. UI/UX Enhancements

**Visual Design:**
- **Theme integration**: Consistent with light/dark mode support
- **Loading states**: Proper loading indicators throughout the workflow
- **Disabled states**: All controls disabled after resolution
- **Responsive design**: Works across different screen sizes

**Accessibility:**
- **Keyboard navigation**: Full keyboard support for all controls
- **Screen reader support**: Proper ARIA labels and descriptions
- **Focus management**: Logical tab order and focus indicators

### Data Flow

#### 1. Conflict Detection Flow
1. User clicks "Sync & Resolve Conflicts"
2. Frontend calls `pullAndDetectConflicts` tRPC endpoint
3. Backend pulls translation files from GitHub
4. Backend compares translations by key (not position)
5. Backend returns conflicts grouped by language
6. Frontend stores conflicts in Redux and navigates to resolution page

#### 2. Conflict Resolution Flow
1. User selects resolutions for each conflict
2. User clicks "Apply Resolutions"
3. Frontend collects all resolutions and calls `resolveConflicts`
4. Backend processes all resolutions in a single request
5. Backend creates missing keys and updates translations
6. Frontend clears resolved conflicts from Redux
7. If auto-export enabled, triggers export to GitHub

#### 3. Export Flow
1. Frontend calls `exportTranslations` tRPC endpoint
2. Backend creates new branch and updates translation files
3. Backend creates pull request (if changes detected)
4. Backend returns pull request URL or success status
5. Frontend displays appropriate success message

### Error Handling

#### Backend Error Handling
- **GitHub API errors**: Proper error messages and logging
- **Database errors**: Transaction rollback and error reporting
- **Validation errors**: Input validation with clear error messages
- **Network errors**: Retry mechanisms and timeout handling

#### Frontend Error Handling
- **API errors**: User-friendly error messages with retry options
- **Validation errors**: Form validation with inline error display
- **Network errors**: Loading states and error recovery
- **State errors**: Proper error boundaries and fallback UI

### Performance Optimizations

#### Backend Optimizations
- **Single request processing**: All resolutions handled in one API call
- **Batch operations**: Efficient database operations for multiple translations
- **Key mapping**: Optimized key lookup for translation operations
- **Error recovery**: Graceful handling of partial failures

#### Frontend Optimizations
- **Redux state management**: Efficient conflict state updates
- **Lazy loading**: Components loaded only when needed
- **Memoization**: Optimized re-renders for large conflict sets
- **Progressive enhancement**: Works with JavaScript disabled

### Security Considerations

- **Input validation**: All user inputs validated on both frontend and backend
- **Authorization**: All endpoints protected with proper authentication
- **Data sanitization**: User inputs sanitized before database operations
- **Error information**: Limited error details exposed to users

---

**Summary:**
The conflict resolution system provides a complete, user-friendly workflow for detecting and resolving translation conflicts between LinguaFlow and GitHub repositories. It supports both automatic and manual export options, with robust error handling and performance optimizations. The system maintains data integrity while providing a seamless user experience for managing translation conflicts.

---

### Export Translation Files (MVP)

- **Location:** Project Settings page, below Integrations section, as an Import/Export card.
- **User Flow:**
  1. User navigates to Project Settings.
  2. User clicks "Export Translations" in the Import/Export section.
  3. System fetches all translations for all project languages.
  4. Each language's translations are exported as a flat JSON file (e.g., `en.json`, `fr.json`).
  5. All JSON files are bundled into a ZIP archive (`project-translations.zip`) and downloaded to the user.
  6. Button shows a loading state during export.

- **Backend Implementation:**
  - **tRPC Endpoint:** `translations.exportTranslations` accepts `projectId` and `languageIds`, returns a mapping of language code to JSON string.
  - **Service Layer:** `exportToJSON` method in `TranslationsService` fetches translations for each language, serializes to JSON, and returns the result.
  - **DAL:** Uses `getProjectTranslationsForExport` and `getProjectLanguagesForExport` from IntegrationsDAL for efficient, ordered data retrieval.

- **Frontend Implementation:**
  - **Component:** `ImportExport` in `src/components/projects/translations/import-export.tsx`.
  - **Behavior:**
    - Fetches available languages and project ID automatically.
    - Calls the export endpoint for all languages.
    - Uses JSZip to bundle all JSON files into a ZIP archive.
    - Triggers a browser download of the ZIP file.
    - UI matches the design in the MVP screenshot.
    - Import button is present but static/disabled for now.

- **File Format:**
  - Each language is exported as a flat JSON file: `{ "key": "value", ... }`
  - All files are zipped for a single download.

- **Notes:**
  - Only approved translations are exported.
  - The export logic is fully self-contained in the ImportExport component.
  - Designed for extensibility (future: YAML, CSV, import dialog, etc).
