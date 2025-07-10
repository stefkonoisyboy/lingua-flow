"use client";

import { Typography } from "@mui/material";
import {
  Language as LanguageIcon,
  Translate as TranslateIcon,
} from "@mui/icons-material";
import {
  PlaceholderContainer,
  PlaceholderIcon,
  PlaceholderText,
} from "@/styles/projects/project-translations.styles";

export function NoLanguageSelectedPlaceholder() {
  return (
    <PlaceholderContainer>
      <PlaceholderIcon>
        <LanguageIcon fontSize="inherit" />
      </PlaceholderIcon>
      <Typography variant="h6" color="text.primary" gutterBottom>
        Select a Language
      </Typography>
      <PlaceholderText>
        <Typography variant="body1" color="text.secondary">
          Choose a language from the dropdown menu above to start managing
          translations.
        </Typography>
      </PlaceholderText>
    </PlaceholderContainer>
  );
}

export function NoTranslationsPlaceholder() {
  return (
    <PlaceholderContainer>
      <PlaceholderIcon>
        <TranslateIcon fontSize="inherit" />
      </PlaceholderIcon>
      <Typography variant="h6" color="text.primary" gutterBottom>
        No Translation Keys Yet
      </Typography>
      <PlaceholderText>
        <Typography variant="body1" color="text.secondary">
          Get started by adding your first translation key. Click the &quot;Add
          Key&quot; button above to begin managing your translations.
        </Typography>
      </PlaceholderText>
    </PlaceholderContainer>
  );
}
