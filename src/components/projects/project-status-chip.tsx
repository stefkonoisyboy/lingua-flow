import { Chip } from "@mui/material";

interface ProjectStatusChipProps {
  status: "active" | "archived";
}

const statusConfig = {
  active: {
    label: "Active",
    color: "success" as const,
  },
  archived: {
    label: "Archived",
    color: "error" as const,
  },
};

export function ProjectStatusChip({ status }: ProjectStatusChipProps) {
  const config = statusConfig[status];

  return <Chip label={config.label} color={config.color} size="small" />;
}
