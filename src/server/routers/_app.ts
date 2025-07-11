import { projectsRouter } from "./projects";
import { languagesRouter } from "./languages";
import { integrationsRouter } from "./integrations";
import { activitiesRouter } from "./activities";
import { translationsRouter } from "./translations";
import { versionHistoryRouter } from "./version-history";
import { router } from "../trpc";

export const appRouter = router({
  projects: projectsRouter,
  languages: languagesRouter,
  integrations: integrationsRouter,
  translations: translationsRouter,
  activities: activitiesRouter,
  versionHistory: versionHistoryRouter,
});

export type AppRouter = typeof appRouter;
