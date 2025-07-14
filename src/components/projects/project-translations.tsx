"use client";

import { CircularProgress } from "@mui/material";
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
  PaginationContainer,
  LoadingContainer,
  StyledAlert,
} from "@/styles/projects/project-translations.styles";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { z } from "zod";
import { Pagination } from "@mui/material";
import { TranslationsHeader } from "./translations/translations-header";
import { TranslationsTable } from "./translations/translations-table";
import {
  NoLanguageSelectedPlaceholder,
  NoTranslationsPlaceholder,
} from "./translations/translations-placeholders";
import { TranslationKey } from "./translations/translations-table";

interface ProjectTranslationsProps {
  translationKeys: TranslationKey[];
  isLoading: boolean;
  languageName: string;
  defaultLanguageName: string;
  defaultLanguageId: string;
  languages: { language_id: string; languages: { name: string } }[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  projectId: string;
}

// Validation schema matching tRPC input
const newTranslationSchema = z.object({
  projectId: z.string(),
  key: z.string().min(1, "Key name is required"),
  description: z.string().optional(),
  translations: z.record(z.string().min(1, "Translation content is required")),
});

type NewTranslationForm = z.infer<typeof newTranslationSchema>;

export function ProjectTranslations({
  translationKeys,
  isLoading,
  languageName,
  defaultLanguageName,
  defaultLanguageId,
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
      onSuccess: (data) => {
        utils.translations.getTranslationKeys.invalidate({ projectId });

        data.translations.forEach((translation) => {
          utils.versionHistory.getVersionHistory.invalidate({
            translationId: translation.id,
          });
        });

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
    formik.values.translations[defaultLanguageId]?.trim();

  return (
    <TranslationsContainer>
      <TranslationsHeader
        languages={languages}
        onStartAddingKey={handleStartAddingKey}
        onCancelAddingKey={handleCancelAddingKey}
        onSave={formik.handleSubmit}
        isSaveDisabled={!formik.isValid || !hasRequiredTranslations}
        isSubmitting={formik.isSubmitting}
      />

      {error && <StyledAlert severity="error">{error}</StyledAlert>}

      {!defaultLanguageId ? (
        <NoLanguageSelectedPlaceholder />
      ) : translationKeys.length === 0 && !isAddingKey ? (
        <NoTranslationsPlaceholder />
      ) : (
        <>
          <TranslationsTable
            translationKeys={translationKeys}
            defaultLanguageName={defaultLanguageName}
            languageName={languageName}
            defaultLanguageId={defaultLanguageId}
            formik={formik}
            onUpdateTranslation={handleUpdateTranslation}
          />

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
