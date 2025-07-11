import { TableRow, TableCell, IconButton, TextField } from "@mui/material";
import { Save as SaveIcon, Cancel as CancelIcon } from "@mui/icons-material";
import { StyledTextarea } from "@/styles/projects/project-translations.styles";
import {
  ActionButtons,
  ErrorMessage,
} from "@/styles/projects/translations-table.styles";
import { Database } from "@/lib/types/database.types";
import { useFormik } from "formik";
import { trpc } from "@/utils/trpc";
import * as Yup from "yup";

type TranslationKey =
  Database["public"]["Tables"]["translation_keys"]["Row"] & {
    translations: Database["public"]["Tables"]["translations"]["Row"][];
  };

interface TranslationEditFormProps {
  translationKey: TranslationKey;
  translation: Database["public"]["Tables"]["translations"]["Row"] | undefined;
  defaultTranslation:
    | Database["public"]["Tables"]["translations"]["Row"]
    | undefined;
  selectedLanguageId: string;
  onCancel: () => void;
}

const validationSchema = Yup.object({
  keyName: Yup.string().required("Key name is required"),
  translationContent: Yup.string().required("Translation is required"),
});

export function TranslationEditForm({
  translationKey,
  translation,
  defaultTranslation,
  selectedLanguageId,
  onCancel,
}: TranslationEditFormProps) {
  const utils = trpc.useUtils();
  const projectId = translationKey.project_id;

  const updateTranslationKeyMutation =
    trpc.translations.updateTranslationKey.useMutation({
      onSuccess: () => {
        utils.translations.getTranslationKeys.invalidate({ projectId });
      },
    });

  const updateTranslationMutation =
    trpc.translations.updateTranslation.useMutation({
      onSuccess: () => {
        utils.translations.getTranslationKeys.invalidate({ projectId });
      },
    });

  const createTranslationMutation =
    trpc.translations.createTranslation.useMutation({
      onSuccess: () => {
        utils.translations.getTranslationKeys.invalidate({ projectId });
      },
    });

  const formik = useFormik({
    initialValues: {
      keyName: translationKey.key,
      translationContent: translation?.content || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Update key name if changed
        if (values.keyName !== translationKey.key) {
          await updateTranslationKeyMutation.mutateAsync({
            keyId: translationKey.id,
            newKey: values.keyName,
          });
        }

        // Update or create translation
        if (translation?.id) {
          // Update existing translation if content changed
          if (values.translationContent !== translation.content) {
            await updateTranslationMutation.mutateAsync({
              translationId: translation.id,
              content: values.translationContent,
            });
          }
        } else {
          // Create new translation
          await createTranslationMutation.mutateAsync({
            keyId: translationKey.id,
            languageId: selectedLanguageId,
            content: values.translationContent,
          });
        }

        onCancel();
      } catch (error) {
        console.error("Failed to save changes:", error);
      }
    },
  });

  const handleSave = () => {
    formik.handleSubmit();
  };

  return (
    <TableRow>
      <TableCell>
        <TextField
          fullWidth
          size="small"
          name="keyName"
          value={formik.values.keyName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="Enter key name"
          error={formik.touched.keyName && Boolean(formik.errors.keyName)}
          helperText={formik.touched.keyName && formik.errors.keyName}
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
          name="translationContent"
          value={formik.values.translationContent}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="Enter translation"
          error={
            formik.touched.translationContent &&
            Boolean(formik.errors.translationContent)
          }
        />
        {formik.touched.translationContent &&
          formik.errors.translationContent && (
            <ErrorMessage>{formik.errors.translationContent}</ErrorMessage>
          )}
      </TableCell>
      <TableCell align="center">
        <ActionButtons>
          <IconButton
            color="primary"
            onClick={handleSave}
            disabled={formik.isSubmitting}
          >
            <SaveIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={onCancel}
            disabled={formik.isSubmitting}
          >
            <CancelIcon />
          </IconButton>
        </ActionButtons>
      </TableCell>
    </TableRow>
  );
}
