"use client";

import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectSelectedLanguageId,
  setSelectedLanguageId,
} from "@/store/slices/selected-language.slice";
import {
  selectIsAddingKey,
  selectIsEditing,
} from "@/store/slices/translations.slice";
import { HeaderContainer } from "@/styles/projects/project-translations.styles";

interface TranslationsHeaderProps {
  languages: { language_id: string; languages: { name: string } }[];
  onStartAddingKey: () => void;
  onCancelAddingKey: () => void;
  onSave: () => void;
  isSaveDisabled: boolean;
  isSubmitting: boolean;
}

export function TranslationsHeader({
  languages,
  onStartAddingKey,
  onCancelAddingKey,
  onSave,
  isSaveDisabled,
  isSubmitting,
}: TranslationsHeaderProps) {
  const dispatch = useAppDispatch();
  const selectedLanguageId = useAppSelector(selectSelectedLanguageId);
  const isAddingKey = useAppSelector(selectIsAddingKey);
  const isEditing = useAppSelector(selectIsEditing);

  return (
    <HeaderContainer>
      <Box>
        <Typography variant="h5" fontWeight={600}>
          Manage Translations
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Edit, add, or review translation strings for different locales.
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Select Language</InputLabel>
          <Select
            value={selectedLanguageId}
            onChange={(e) => dispatch(setSelectedLanguageId(e.target.value))}
            label="Select Language"
            disabled={isEditing}
          >
            {languages.map((lang) => (
              <MenuItem key={lang.language_id} value={lang.language_id}>
                {lang.languages.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {isAddingKey ? (
          <>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={onSave}
              disabled={isSaveDisabled || isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : "Save Changes"}
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
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onStartAddingKey}
            disabled={!selectedLanguageId || isEditing}
          >
            Add Translation Key
          </Button>
        )}
      </Box>
    </HeaderContainer>
  );
}
