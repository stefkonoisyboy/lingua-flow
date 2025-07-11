import { projectsRouter } from "./projects";
import { languagesRouter } from "./languages";
import { integrationsRouter } from "./integrations";
import { activitiesRouter } from "./activities";
import { translationsRouter } from "./translations";
import { versionHistoryRouter } from "./version-history";
import { commentsRouter } from "./comments";
import { router } from "../trpc";

export const appRouter = router({
  projects: projectsRouter,
  languages: languagesRouter,
  integrations: integrationsRouter,
  translations: translationsRouter,
  activities: activitiesRouter,
  versionHistory: versionHistoryRouter,
  comments: commentsRouter,
});

export type AppRouter = typeof appRouter;
