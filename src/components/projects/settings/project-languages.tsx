"use client";

import { useState } from "react";
import {
  Typography,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  IconButton,
  Tooltip,
  Select,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from "@mui/icons-material";
import { trpc } from "@/utils/trpc";
import {
  SettingsSection,
  LanguagesList,
  LanguageItem,
  ActionButtons,
  LanguageInfo,
  FlagImage,
  LanguageSelectionContainer,
  LanguageMenuItem,
} from "@/styles/projects/project-settings.styles";
import { useAppDispatch } from "@/store/hooks";
import { resetSelectedLanguageId } from "@/store/slices/selected-language.slice";

interface ProjectLanguagesProps {
  projectId: string;
  languages: {
    language_id: string;
    is_default: boolean;
    languages: {
      id: string;
      name: string;
      code: string;
      flag_url: string | null;
      is_rtl: boolean;
    };
  }[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function ProjectLanguages({
  projectId,
  languages,
  onSuccess,
  onError,
}: ProjectLanguagesProps) {
  const [selectedLanguageId, setSelectedLanguageId] = useState("");
  const [languageToRemove, setLanguageToRemove] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const dispatch = useAppDispatch();
  const utils = trpc.useUtils();

  const { data: availableLanguages } = trpc.languages.getLanguages.useQuery();

  const addLanguageMutation = trpc.projects.addProjectLanguage.useMutation({
    onSuccess: () => {
      onSuccess("Language added successfully");
      setSelectedLanguageId("");
      utils.projects.getProjectLanguages.invalidate({ projectId });
    },
    onError: (error) => {
      onError(`Error adding language: ${error.message}`);
    },
  });

  const removeLanguageMutation =
    trpc.projects.removeProjectLanguage.useMutation({
      onSuccess: () => {
        onSuccess("Language removed successfully");
        utils.projects.getProjectLanguages.invalidate({ projectId });
        dispatch(resetSelectedLanguageId());
      },
      onError: (error) => {
        onError(`Error removing language: ${error.message}`);
      },
    });

  const setDefaultLanguageMutation =
    trpc.projects.setDefaultLanguage.useMutation({
      onSuccess: () => {
        onSuccess("Default language updated successfully");
        utils.projects.getProjectLanguages.invalidate({ projectId });
      },
      onError: (error) => {
        onError(`Error updating default language: ${error.message}`);
      },
    });

  const handleAddLanguage = () => {
    if (!selectedLanguageId) return;

    if (languages.some((lang) => lang.language_id === selectedLanguageId)) {
      onError("This language is already added to the project");
      return;
    }

    addLanguageMutation.mutate({
      projectId,
      languageId: selectedLanguageId,
    });
  };

  const handleRemoveLanguageClick = (languageId: string) => {
    setLanguageToRemove(languageId);
    setIsDialogOpen(true);
  };

  const handleRemoveLanguage = () => {
    if (!languageToRemove) return;

    removeLanguageMutation.mutate({
      projectId,
      languageId: languageToRemove,
    });

    setIsDialogOpen(false);
    setLanguageToRemove(null);
  };

  const handleSetDefaultLanguage = (languageId: string) => {
    setDefaultLanguageMutation.mutate({
      projectId,
      languageId,
    });
  };

  const filteredAvailableLanguages = availableLanguages?.filter(
    (lang) => !languages.some((projLang) => projLang.languages.id === lang.id)
  );

  const isLoading =
    addLanguageMutation.isPending ||
    removeLanguageMutation.isPending ||
    setDefaultLanguageMutation.isPending;

  return (
    <SettingsSection>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Supported Languages
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        Add or remove languages for your project. The default language is used
        as the source for translations.
      </Typography>

      <LanguagesList>
        {languages.map((lang) => (
          <LanguageItem key={lang.language_id}>
            <LanguageInfo>
              {lang.languages.flag_url && (
                <FlagImage
                  src={lang.languages.flag_url}
                  alt={lang.languages.name}
                />
              )}
              <Typography>
                {lang.languages.name} ({lang.languages.code})
              </Typography>
              {lang.is_default && (
                <Chip
                  label="Default"
                  size="small"
                  color="primary"
                  icon={<StarIcon />}
                />
              )}
            </LanguageInfo>

            <ActionButtons>
              {!lang.is_default && (
                <>
                  <Tooltip title="Set as default language">
                    <IconButton
                      onClick={() => handleSetDefaultLanguage(lang.language_id)}
                      disabled={isLoading}
                      color="primary"
                    >
                      <StarBorderIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Remove language">
                    <IconButton
                      onClick={() =>
                        handleRemoveLanguageClick(lang.language_id)
                      }
                      disabled={isLoading}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </ActionButtons>
          </LanguageItem>
        ))}
      </LanguagesList>

      <LanguageSelectionContainer>
        <FormControl fullWidth>
          <InputLabel>Add Language</InputLabel>
          <Select
            value={selectedLanguageId}
            onChange={(e) => setSelectedLanguageId(e.target.value)}
            label="Add Language"
            disabled={isLoading || !filteredAvailableLanguages?.length}
          >
            {filteredAvailableLanguages?.map((lang) => (
              <MenuItem key={lang.id} value={lang.id}>
                <LanguageMenuItem>
                  {lang.flagUrl && (
                    <FlagImage src={lang.flagUrl} alt={lang.name} />
                  )}
                  {lang.name} ({lang.code})
                </LanguageMenuItem>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddLanguage}
          disabled={isLoading || !selectedLanguageId}
        >
          {addLanguageMutation.isPending ? (
            <CircularProgress size={24} />
          ) : (
            "Add"
          )}
        </Button>
      </LanguageSelectionContainer>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Remove Language</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this language? All translations for
            this language will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRemoveLanguage}
            color="error"
            variant="contained"
          >
            {removeLanguageMutation.isPending ? (
              <CircularProgress size={24} />
            ) : (
              "Remove"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </SettingsSection>
  );
}
