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
import { useParams } from "next/navigation";
import {
  selectSelectedLanguageId,
  setSelectedLanguageId,
} from "@/store/slices/selected-language.slice";
import { selectActiveTab } from "@/store/slices/project-tabs.slice";
import { useEffect, useState } from "react";
import { hasPermission } from "@/utils/permissions";

// Validation schema matching tRPC input
const newTranslationSchema = z.object({
  projectId: z.string(),
  key: z.string().min(1, "Key name is required"),
  description: z.string().optional(),
  translations: z.record(z.string().min(1, "Translation content is required")),
});

type NewTranslationForm = z.infer<typeof newTranslationSchema>;

const PAGE_SIZE = 10;

export function ProjectTranslations() {
  const params = useParams();
  const projectId = params.projectId as string;

  const dispatch = useAppDispatch();
  const utils = trpc.useUtils();

  // Redux selectors
  const isAddingKey = useAppSelector(selectIsAddingKey);
  const error = useAppSelector(selectError);
  const selectedLanguageId = useAppSelector(selectSelectedLanguageId);
  const activeTab = useAppSelector(selectActiveTab);

  const [page, setPage] = useState(1);

  const { data: role } = trpc.projectMembers.getUserProjectRole.useQuery({
    projectId,
  });

  const memberRole = role?.role ?? "viewer";

  const hasProjectViewPermission = hasPermission(memberRole, "viewProject");
  const hasTranslationViewPermission = hasPermission(
    memberRole,
    "viewTranslations"
  );

  const { data: projectLanguages, isLoading: isProjectLanguagesLoading } =
    trpc.projects.getProjectLanguages.useQuery(
      { projectId },
      { enabled: hasProjectViewPermission }
    );

  const defaultLanguage = projectLanguages?.find((lang) => lang.is_default);

  const { data: translationKeysData, isLoading: isTranslationKeysLoading } =
    trpc.translations.getTranslationKeys.useQuery(
      {
        projectId,
        page,
        pageSize: PAGE_SIZE,
        languageId: selectedLanguageId,
        defaultLanguageId: defaultLanguage?.language_id,
      },
      {
        enabled:
          !!selectedLanguageId &&
          !!defaultLanguage?.language_id &&
          activeTab === "translations" &&
          hasTranslationViewPermission,
      }
    );

  const totalPages = Math.ceil((translationKeysData?.total || 0) / PAGE_SIZE);

  const translationKeys = translationKeysData?.data || [];
  const defaultLanguageId = defaultLanguage?.language_id || "";
  const defaultLanguageName = defaultLanguage?.languages.name || "";

  const languageName =
    projectLanguages?.find((lang) => lang.language_id === selectedLanguageId)
      ?.languages.name || "";

  const isLoading = isProjectLanguagesLoading || isTranslationKeysLoading;

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

  const hasRequiredTranslations =
    formik.values.translations[defaultLanguageId]?.trim();

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

    setPage(value);
  };

  // Set selected language to default language when project languages load
  useEffect(() => {
    if (defaultLanguage && !selectedLanguageId) {
      dispatch(setSelectedLanguageId(defaultLanguage.language_id));
    }
  }, [defaultLanguage, selectedLanguageId, dispatch]);

  if (isLoading) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }

  return (
    <TranslationsContainer>
      <TranslationsHeader
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
