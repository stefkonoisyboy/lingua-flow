# LinguaFlow

Your AI-powered language learning companion.

## Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env.local` file in the root directory with the following variables:

   ```bash
   # Supabase configuration
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Set up your Supabase project:

   - Create a new project on [Supabase](https://supabase.com)
   - Copy your project URL and anon key from the project settings
   - Apply the database migrations from `supabase/migrations` folder

5. Run the development server:
   ```bash
   npm run dev
   ```

## Database Schema

LinguaFlow uses Supabase as its database with the following structure:

### Core Tables

- **profiles**: Extends Supabase auth.users with additional user information
- **projects**: Main projects table for managing translation projects
- **languages**: Available languages in the system
- **project_languages**: Many-to-many relationship between projects and languages
- **project_members**: Project membership and roles
- **translation_keys**: Source text keys and content
- **translations**: Translated content for each key in different languages
- **comments**: Translation comments/discussions
- **version_history**: Translation version history

### Enums

- **user_role**: owner, admin, translator, viewer
- **translation_status**: pending, in_progress, reviewed, approved
- **project_status**: active, archived

### Security

The database implements Row Level Security (RLS) policies to ensure:

- Users can only access projects they are members of
- Project owners and admins have full control over their projects
- Translators can only update their assigned translations
- Comments are visible to all project members but only editable by their authors

## Features

- Multi-user collaboration on translation projects
- Role-based access control
- Version history tracking
- Translation progress tracking
- Comment system for discussions
- Support for multiple languages per project

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
