"use client";

import { TableRow, TableCell, TextField, IconButton } from "@mui/material";
import { Comment as CommentIcon } from "@mui/icons-material";
import {
  StyledTextarea,
  ErrorText,
} from "@/styles/projects/project-translations.styles";
import { FormikProps } from "formik";

interface TranslationFormProps {
  formik: FormikProps<{
    projectId: string;
    key: string;
    description?: string;
    translations: Record<string, string>;
  }>;
  defaultLanguageId: string;
  selectedLanguageId: string;
  onUpdateTranslation: (languageId: string, content: string) => void;
}

export function TranslationForm({
  formik,
  defaultLanguageId,
  selectedLanguageId,
  onUpdateTranslation,
}: TranslationFormProps) {
  return (
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
          value={formik.values.translations[defaultLanguageId] || ""}
          onChange={(e) =>
            onUpdateTranslation(defaultLanguageId, e.target.value)
          }
          onBlur={() => {
            formik.setFieldTouched(`translations.${defaultLanguageId}`, true);
          }}
          placeholder="Enter source text"
          error={
            formik.touched.translations?.[defaultLanguageId] &&
            Boolean(formik.errors.translations?.[defaultLanguageId])
          }
        />
        {formik.touched.translations?.[defaultLanguageId] &&
          formik.errors.translations?.[defaultLanguageId] && (
            <ErrorText color="error" variant="caption">
              {formik.errors.translations[defaultLanguageId]}
            </ErrorText>
          )}
      </TableCell>
      <TableCell>
        <StyledTextarea
          value={formik.values.translations[selectedLanguageId] || ""}
          onChange={(e) =>
            onUpdateTranslation(selectedLanguageId, e.target.value)
          }
          onBlur={() => {
            formik.setFieldTouched(`translations.${selectedLanguageId}`, true);
          }}
          placeholder="Enter translation"
          error={
            formik.touched.translations?.[selectedLanguageId] &&
            Boolean(formik.errors.translations?.[selectedLanguageId])
          }
        />
        {formik.touched.translations?.[selectedLanguageId] &&
          formik.errors.translations?.[selectedLanguageId] && (
            <ErrorText color="error" variant="caption">
              {formik.errors.translations[selectedLanguageId]}
            </ErrorText>
          )}
      </TableCell>
      <TableCell align="center">
        <IconButton disabled>
          <CommentIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
