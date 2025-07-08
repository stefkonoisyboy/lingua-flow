import { projectsRouter } from "./projects";
import { languagesRouter } from "./languages";
import { integrationsRouter } from "./integrations";
import { activitiesRouter } from "./activities";
import { translationsRouter } from "./translations";
import { router } from "../trpc";

export const appRouter = router({
  projects: projectsRouter,
  languages: languagesRouter,
  integrations: integrationsRouter,
  activities: activitiesRouter,
  translations: translationsRouter,
});

export type AppRouter = typeof appRouter;
