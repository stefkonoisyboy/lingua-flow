import { Chip } from "@mui/material";

interface ProjectLanguageChipProps {
  language: {
    id: string;
    name: string;
    code: string;
  };
}

export function ProjectLanguageChip({ language }: ProjectLanguageChipProps) {
  return <Chip label={language.name} size="small" variant="outlined" />;
}
