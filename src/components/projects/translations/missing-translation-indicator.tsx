import React from "react";
import { Box, Typography } from "@mui/material";
import { Warning } from "@mui/icons-material";

interface MissingTranslationIndicatorProps {
  show: boolean;
}

export const MissingTranslationIndicator: React.FC<
  MissingTranslationIndicatorProps
> = ({ show }) => {
  if (!show) return null;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
      <Warning sx={{ color: "error.main", fontSize: 16 }} />
      <Typography variant="body2" color="error.main">
        Missing translation
      </Typography>
    </Box>
  );
};
