"use client";

import { useState, useEffect } from "react";
import {
  Typography,
  TextField,
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
  Select,
  Alert,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from "@mui/icons-material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { trpc } from "@/utils/trpc";
import {
  ProjectSettingsContainer,
  SettingsSection,
  LanguagesList,
  LanguageItem,
  ActionButtons,
  LanguageInfo,
  FlagImage,
} from "@/styles/projects/project-settings.styles";
import { useAppDispatch } from "@/store/hooks";
import { resetSelectedLanguageId } from "@/store/slices/selected-language.slice";

interface ProjectSettingsProps {
  projectId: string;
  initialName: string;
  initialDescription?: string;
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
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Project name is required"),
  description: Yup.string(),
});

export function ProjectSettings({
  projectId,
  initialName,
  initialDescription = "",
  languages,
}: ProjectSettingsProps) {
  const [selectedLanguageId, setSelectedLanguageId] = useState("");
  const [languageToRemove, setLanguageToRemove] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const dispatch = useAppDispatch();
  const utils = trpc.useUtils();

  const { data: availableLanguages } = trpc.languages.getLanguages.useQuery();

  const updateProjectMutation = trpc.projects.updateProject.useMutation({
    onSuccess: () => {
      setSuccessMessage("Project updated successfully");
      utils.projects.getProjectById.invalidate({ projectId });
    },
    onError: (error) => {
      setErrorMessage(`Error updating project: ${error.message}`);
    },
  });

  const addLanguageMutation = trpc.projects.addProjectLanguage.useMutation({
    onSuccess: () => {
      setSuccessMessage("Language added successfully");
      setSelectedLanguageId("");
      utils.projects.getProjectLanguages.invalidate({ projectId });
    },
    onError: (error) => {
      setErrorMessage(`Error adding language: ${error.message}`);
    },
  });

  const removeLanguageMutation =
    trpc.projects.removeProjectLanguage.useMutation({
      onSuccess: () => {
        setSuccessMessage("Language removed successfully");
        utils.projects.getProjectLanguages.invalidate({ projectId });
        dispatch(resetSelectedLanguageId());
      },
      onError: (error) => {
        setErrorMessage(`Error removing language: ${error.message}`);
      },
    });

  const setDefaultLanguageMutation =
    trpc.projects.setDefaultLanguage.useMutation({
      onSuccess: () => {
        setSuccessMessage("Default language updated successfully");
        utils.projects.getProjectLanguages.invalidate({ projectId });
      },
      onError: (error) => {
        setErrorMessage(`Error updating default language: ${error.message}`);
      },
    });

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const handleAddLanguage = () => {
    if (!selectedLanguageId) return;

    // Check if language is already added
    if (languages.some((lang) => lang.language_id === selectedLanguageId)) {
      setErrorMessage("This language is already added to the project");
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
    updateProjectMutation.isPending ||
    addLanguageMutation.isPending ||
    removeLanguageMutation.isPending ||
    setDefaultLanguageMutation.isPending;

  return (
    <ProjectSettingsContainer>
      {(successMessage || errorMessage) && (
        <Box sx={{ mb: 3 }}>
          {successMessage && (
            <Alert severity="success" onClose={() => setSuccessMessage("")}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage("")}>
              {errorMessage}
            </Alert>
          )}
        </Box>
      )}

      <SettingsSection>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Project Details
        </Typography>

        <Formik
          initialValues={{
            name: initialName,
            description: initialDescription,
          }}
          validationSchema={validationSchema}
          onSubmit={(values, { setSubmitting }) => {
            updateProjectMutation.mutate({
              projectId,
              name: values.name,
              description: values.description || undefined,
            });
            setSubmitting(false);
          }}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            isSubmitting,
            dirty,
          }) => (
            <Form>
              <Box
                sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}
              >
                <Field
                  name="name"
                  as={TextField}
                  fullWidth
                  label="Project Name"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  required
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                />

                <Field
                  name="description"
                  as={TextField}
                  fullWidth
                  label="Description"
                  value={values.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  multiline
                  rows={3}
                />

                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isLoading || !dirty || isSubmitting}
                  >
                    {updateProjectMutation.isPending ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </Box>
              </Box>
            </Form>
          )}
        </Formik>
      </SettingsSection>

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
                        onClick={() =>
                          handleSetDefaultLanguage(lang.language_id)
                        }
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

        <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 2 }}>
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {lang.flagUrl && (
                      <FlagImage src={lang.flagUrl} alt={lang.name} />
                    )}
                    {lang.name} ({lang.code})
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddLanguage}
            disabled={isLoading || !selectedLanguageId}
            sx={{ mt: 0 }}
          >
            {addLanguageMutation.isPending ? (
              <CircularProgress size={24} />
            ) : (
              "Add"
            )}
          </Button>
        </Box>
      </SettingsSection>

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
    </ProjectSettingsContainer>
  );
}
