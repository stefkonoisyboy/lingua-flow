import { router } from '@/server/trpc';
import { projectsRouter } from './projects';
import { languagesRouter } from './languages';
import { activitiesRouter } from './activities';
import { integrationsRouter } from './integrations';

export const appRouter = router({
  projects: projectsRouter,
  languages: languagesRouter,
  activities: activitiesRouter,
  integrations: integrationsRouter,
});

export type AppRouter = typeof appRouter; 