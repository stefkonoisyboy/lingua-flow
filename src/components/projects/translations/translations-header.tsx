"use client";

import {
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Box,
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
import {
  HeaderContainer,
  HeaderTitle,
  HeaderDescription,
  HeaderActions,
  LanguageSelectControl,
} from "@/styles/projects/translations-header.styles";
import { trpc } from "@/utils/trpc";
import { useParams } from "next/navigation";

interface TranslationsHeaderProps {
  onStartAddingKey: () => void;
  onCancelAddingKey: () => void;
  onSave: () => void;
  isSaveDisabled: boolean;
  isSubmitting: boolean;
}

export function TranslationsHeader({
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
  const params = useParams();
  const projectId = params.projectId as string;

  const { data: projectLanguages } = trpc.projects.getProjectLanguages.useQuery(
    {
      projectId,
    }
  );

  const languages = projectLanguages || [];

  return (
    <HeaderContainer>
      <Box>
        <HeaderTitle variant="h5">Manage Translations</HeaderTitle>
        <HeaderDescription variant="body1">
          Edit, add, or review translation strings for different locales.
        </HeaderDescription>
      </Box>

      <HeaderActions>
        <LanguageSelectControl>
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
        </LanguageSelectControl>

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
      </HeaderActions>
    </HeaderContainer>
  );
}
