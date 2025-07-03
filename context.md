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
    - Bulk upsert of translation keys
    - Bulk upsert of translations
    - Batch version history creation
  - Initial version history creation for imported translations
  - Source tracking (repository, file path, branch)
  - Unique version tracking (translation_id, version_number)
- Create/edit translation keys
- Batch translation updates
- Translation progress tracking
- Export translations
- Version history and rollback
  - Automatic version numbering
  - Source tracking for each version
  - Full audit trail of changes
  - Ability to view and restore previous versions
  - Unique constraint on translation_id and version_number
- Translation memory suggestions
- Translation status management (pending, in_progress, reviewed, approved)

### 5. Collaboration Flow

- Invite team members
- Role-based access control
- Comment and feedback system
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

### Frontend Architecture

- React Server Components and Next.js SSR features are preferred
- Client components ('use client') are minimized to small, isolated components
- MaterialUI for UI components (no TailwindCSS)
- MUI styled components instead of sx props
- Redux Toolkit for global state management
- Responsive UI with dark theme support
- Component structure:
  - Hooks at the top
  - Variables/state
  - Handlers
  - useEffects

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
   - created_by (foreign key to auth.users)
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
   - source_content
   - project_id (foreign key to projects)
   - created_at
   - updated_at

6. translations

   - id (primary key)
   - key_id (foreign key to translation_keys)
   - language_id (foreign key to languages)
   - content
   - status (enum: pending, in_progress, reviewed, approved)
   - translator_id (foreign key to auth.users)
   - reviewer_id (foreign key to auth.users)
   - created_at
   - updated_at

7. version_history

   - id (primary key)
   - translation_id (foreign key to translations)
   - content
   - version_number
   - version_name
   - changed_by (foreign key to auth.users)
   - created_at
   - updated_at

8. comments

   - id (primary key)
   - translation_id (foreign key to translations)
   - content
   - user_id (foreign key to auth.users)
   - created_at
   - updated_at

9. project_members

   - project_id (foreign key to projects)
   - user_id (foreign key to auth.users)
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
    - user_id (foreign key to auth.users)
    - access_token
    - created_at
    - updated_at

12. activity_log

    - id (primary key)
    - project_id (foreign key to projects)
    - user_id (foreign key to auth.users)
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
