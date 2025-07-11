"use client";

import { Box, Typography, Button, MenuItem } from "@mui/material";
import {
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import {
  HeaderContainer,
  ControlsContainer,
  StyledSelect,
} from "@/styles/projects/project-translations.styles";
import { useAppSelector } from "@/store/hooks";
import {
  selectIsAddingKey,
  selectIsEditing,
} from "@/store/slices/translations.slice";

interface TranslationsHeaderProps {
  selectedLanguageId: string;
  onLanguageChange: (languageId: string) => void;
  languages: { language_id: string; languages: { name: string } }[];
  onStartAddingKey: () => void;
  onCancelAddingKey: () => void;
  onSave: () => void;
  isSaveDisabled: boolean;
  isSubmitting: boolean;
}

export function TranslationsHeader({
  selectedLanguageId,
  onLanguageChange,
  languages,
  onStartAddingKey,
  onCancelAddingKey,
  onSave,
  isSaveDisabled,
  isSubmitting,
}: TranslationsHeaderProps) {
  const isAddingKey = useAppSelector(selectIsAddingKey);
  const isEditing = useAppSelector(selectIsEditing);

  return (
    <HeaderContainer>
      <Box>
        <Typography variant="h5" fontWeight={600}>
          Manage Translations
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Edit, add, or review translation strings for different locales.
        </Typography>
      </Box>

      <ControlsContainer>
        <StyledSelect
          value={selectedLanguageId}
          onChange={(e) => onLanguageChange(e.target.value as string)}
          displayEmpty
          disabled={isEditing}
        >
          <MenuItem value="" disabled>
            Select Language
          </MenuItem>
          {languages.map((lang) => (
            <MenuItem key={lang.language_id} value={lang.language_id}>
              {lang.languages?.name}
            </MenuItem>
          ))}
        </StyledSelect>

        {isAddingKey ? (
          <>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={onSave}
              disabled={isSaveDisabled || isSubmitting}
            >
              Save Changes
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<CancelIcon />}
              onClick={onCancelAddingKey}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            disabled={!selectedLanguageId || isEditing}
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onStartAddingKey}
          >
            Add Key
          </Button>
        )}
      </ControlsContainer>
    </HeaderContainer>
  );
}
