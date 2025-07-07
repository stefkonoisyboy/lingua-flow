import { ProjectsTable } from "@/components/projects/projects-table";
import {
  ProjectsListContainer,
  ProjectsListTitle,
  ProjectsListDescription,
} from "@/styles/projects/projects-list.styles";

export function ProjectsList() {
  return (
    <ProjectsListContainer>
      <div>
        <ProjectsListTitle variant="h5">
          Your Localization Projects
        </ProjectsListTitle>

        <ProjectsListDescription variant="body1" color="textSecondary">
          Manage all your translation projects from one place.
        </ProjectsListDescription>
      </div>

      <ProjectsTable />
    </ProjectsListContainer>
  );
}
