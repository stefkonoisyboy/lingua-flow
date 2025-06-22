import { Typography } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import {
  ProjectCardContainer,
  ProjectCardContent,
  ProjectTitle,
  ProjectStats,
  ProjectProgress,
  ProjectProgressBar,
  ViewButton,
  LastUpdate,
} from "@/styles/dashboard/project-card.styles";

interface ProjectCardProps {
  title: string;
  languages: number;
  missingTranslations: number;
  progress: number;
  lastUpdate: string;
  onView: () => void;
}

const ProjectCard = ({
  title,
  languages,
  missingTranslations,
  progress,
  lastUpdate,
  onView,
}: ProjectCardProps) => {
  return (
    <ProjectCardContainer>
      <ProjectCardContent>
        <ProjectTitle variant="h6">{title}</ProjectTitle>

        <ProjectStats>
          <Typography variant="body2">
            {languages} {languages === 1 ? "Language" : "Languages"} |{" "}
            {missingTranslations} Missing
          </Typography>
        </ProjectStats>

        <ProjectProgress>
          <ProjectProgressBar variant="determinate" value={progress} />
          <Typography variant="body2">{progress}% complete</Typography>
        </ProjectProgress>

        <LastUpdate variant="caption">Last update: {lastUpdate}</LastUpdate>

        <ViewButton onClick={onView} endIcon={<ArrowForward />}>
          View
        </ViewButton>
      </ProjectCardContent>
    </ProjectCardContainer>
  );
};

export default ProjectCard;
