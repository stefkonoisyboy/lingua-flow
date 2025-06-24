import { router } from '../trpc';
import { projectsRouter } from './projects';
import { activitiesRouter } from './activities';
import { languagesRouter } from './languages';

export const appRouter = router({
  projects: projectsRouter,
  activities: activitiesRouter,
  languages: languagesRouter,
});

export type AppRouter = typeof appRouter; 