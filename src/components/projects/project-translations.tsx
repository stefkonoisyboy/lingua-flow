"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  CircularProgress,
  Box,
  Typography,
  Button,
  MenuItem,
  Pagination,
  Alert,
} from "@mui/material";
import {
  Comment as CommentIcon,
  Add as AddIcon,
  Translate as TranslateIcon,
  Language as LanguageIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { Database } from "@/lib/types/database.types";
import { trpc } from "@/utils/trpc";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  startAddingKey,
  cancelAddingKey,
  setError,
  clearUnsavedChanges,
  selectIsAddingKey,
  selectError,
} from "@/store/slices/translations.slice";
import {
  TranslationsContainer,
  HeaderContainer,
  ControlsContainer,
  PaginationContainer,
  PlaceholderContainer,
  PlaceholderIcon,
  PlaceholderText,
  StyledTextarea,
  LoadingContainer,
  StyledSelect,
} from "@/styles/projects/project-translations.styles";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { z } from "zod";

// Validation schema matching tRPC input
const newTranslationSchema = z.object({
  projectId: z.string(),
  key: z.string().min(1, "Key name is required"),
  description: z.string().optional(),
  translations: z.record(z.string().min(1, "Translation content is required")),
});

type NewTranslationForm = z.infer<typeof newTranslationSchema>;

type TranslationKey =
  Database["public"]["Tables"]["translation_keys"]["Row"] & {
    translations: Database["public"]["Tables"]["translations"]["Row"][];
  };

interface ProjectTranslationsProps {
  translationKeys: TranslationKey[];
  isLoading: boolean;
  languageName: string;
  defaultLanguageName: string;
  defaultLanguageId: string;
  selectedLanguageId: string;
  onLanguageChange: (languageId: string) => void;
  languages: { language_id: string; languages: { name: string } }[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  projectId: string;
}

function NoLanguageSelectedPlaceholder() {
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

function NoTranslationsPlaceholder() {
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

export function ProjectTranslations({
  translationKeys,
  isLoading,
  languageName,
  defaultLanguageName,
  defaultLanguageId,
  selectedLanguageId,
  onLanguageChange,
  languages,
  page,
  totalPages,
  onPageChange,
  projectId,
}: ProjectTranslationsProps) {
  const dispatch = useAppDispatch();
  const utils = trpc.useUtils();

  // Redux selectors
  const isAddingKey = useAppSelector(selectIsAddingKey);
  const error = useAppSelector(selectError);

  // tRPC mutation
  const createKeyMutation =
    trpc.translations.createTranslationKeyWithTranslations.useMutation({
      onSuccess: () => {
        utils.translations.getTranslationKeys.invalidate({ projectId });
        dispatch(clearUnsavedChanges());
        dispatch(cancelAddingKey());
        formik.resetForm();
      },
      onError: (error) => {
        dispatch(setError(error.message));
      },
    });

  const formik = useFormik<NewTranslationForm>({
    initialValues: {
      projectId,
      key: "",
      description: "",
      translations: {},
    },
    validationSchema: toFormikValidationSchema(newTranslationSchema),
    validateOnChange: true,
    validateOnBlur: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      dispatch(setError(null));

      try {
        const translationsArray = Object.entries(values.translations).map(
          ([languageId, content]) => ({
            languageId,
            content,
          })
        );

        await createKeyMutation.mutateAsync({
          projectId,
          key: values.key,
          description: values.description,
          translations: translationsArray,
        });
      } catch (error) {
        console.error("Failed to save translation key:", error);
      }
    },
  });

  const handleStartAddingKey = () => {
    dispatch(startAddingKey());
  };

  const handleCancelAddingKey = () => {
    dispatch(cancelAddingKey());
    formik.resetForm();
  };

  const handleUpdateTranslation = (languageId: string, content: string) => {
    formik.setFieldValue(`translations.${languageId}`, content);
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    if (formik.dirty) {
      if (
        !window.confirm(
          "You have unsaved changes. Are you sure you want to change pages?"
        )
      ) {
        return;
      }
      formik.resetForm();
    }
    onPageChange(value);
  };

  if (isLoading) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }

  const hasRequiredTranslations =
    selectedLanguageId &&
    defaultLanguageId &&
    formik.values.translations[selectedLanguageId]?.trim() &&
    formik.values.translations[defaultLanguageId]?.trim();

  return (
    <TranslationsContainer>
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
                onClick={() => formik.handleSubmit()}
                disabled={
                  formik.isSubmitting ||
                  !formik.isValid ||
                  !hasRequiredTranslations
                }
              >
                Save Changes
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<CancelIcon />}
                onClick={handleCancelAddingKey}
                disabled={formik.isSubmitting}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              disabled={!selectedLanguageId}
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleStartAddingKey}
            >
              Add Key
            </Button>
          )}
        </ControlsContainer>
      </HeaderContainer>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!selectedLanguageId ? (
        <NoLanguageSelectedPlaceholder />
      ) : translationKeys.length === 0 && !isAddingKey ? (
        <NoTranslationsPlaceholder />
      ) : (
        <>
          <TableContainer elevation={0} component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Key Name</TableCell>
                  <TableCell>{defaultLanguageName} (Source)</TableCell>
                  <TableCell>{languageName}</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isAddingKey && (
                  <TableRow>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        name="key"
                        value={formik.values.key}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Enter key name"
                        error={formik.touched.key && Boolean(formik.errors.key)}
                        helperText={formik.touched.key && formik.errors.key}
                      />
                    </TableCell>
                    <TableCell>
                      <StyledTextarea
                        value={
                          formik.values.translations[defaultLanguageId] || ""
                        }
                        onChange={(e) =>
                          handleUpdateTranslation(
                            defaultLanguageId,
                            e.target.value
                          )
                        }
                        onBlur={() => {
                          formik.setFieldTouched(
                            `translations.${defaultLanguageId}`,
                            true
                          );
                        }}
                        placeholder="Enter source text"
                        error={
                          formik.touched.translations?.[defaultLanguageId] &&
                          Boolean(
                            formik.errors.translations?.[defaultLanguageId]
                          )
                        }
                      />
                      {formik.touched.translations?.[defaultLanguageId] &&
                        formik.errors.translations?.[defaultLanguageId] && (
                          <Typography
                            color="error"
                            variant="caption"
                            sx={{ mt: 0.5 }}
                          >
                            {formik.errors.translations[defaultLanguageId]}
                          </Typography>
                        )}
                    </TableCell>
                    <TableCell>
                      <StyledTextarea
                        value={
                          formik.values.translations[selectedLanguageId] || ""
                        }
                        onChange={(e) =>
                          handleUpdateTranslation(
                            selectedLanguageId,
                            e.target.value
                          )
                        }
                        onBlur={() => {
                          formik.setFieldTouched(
                            `translations.${selectedLanguageId}`,
                            true
                          );
                        }}
                        placeholder="Enter translation"
                        error={
                          formik.touched.translations?.[selectedLanguageId] &&
                          Boolean(
                            formik.errors.translations?.[selectedLanguageId]
                          )
                        }
                      />
                      {formik.touched.translations?.[selectedLanguageId] &&
                        formik.errors.translations?.[selectedLanguageId] && (
                          <Typography
                            color="error"
                            variant="caption"
                            sx={{ mt: 0.5 }}
                          >
                            {formik.errors.translations[selectedLanguageId]}
                          </Typography>
                        )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton disabled>
                        <CommentIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )}

                {translationKeys.map((key) => {
                  const translation = key.translations.find(
                    (t) => t.language_id === selectedLanguageId
                  );

                  const defaultTranslation = key.translations.find(
                    (t) => t.language_id === defaultLanguageId
                  );

                  return (
                    <TableRow key={key.id}>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          value={key.key}
                          placeholder="Enter key name"
                          disabled
                        />
                      </TableCell>
                      <TableCell>
                        <StyledTextarea
                          value={defaultTranslation?.content || ""}
                          disabled
                          placeholder="Source text"
                        />
                      </TableCell>
                      <TableCell>
                        <StyledTextarea
                          value={translation?.content || ""}
                          placeholder="Enter translation"
                          disabled
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton>
                          <CommentIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <PaginationContainer>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </PaginationContainer>
          )}
        </>
      )}
    </TranslationsContainer>
  );
}
