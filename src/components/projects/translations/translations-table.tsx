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
} from "@mui/material";
import { Comment as CommentIcon } from "@mui/icons-material";
import { StyledTextarea } from "@/styles/projects/project-translations.styles";
import { Database } from "@/lib/types/database.types";
import { TranslationForm } from "./translation-form";
import { FormikProps } from "formik";

type TranslationKey =
  Database["public"]["Tables"]["translation_keys"]["Row"] & {
    translations: Database["public"]["Tables"]["translations"]["Row"][];
  };

interface TranslationsTableProps {
  translationKeys: TranslationKey[];
  defaultLanguageName: string;
  languageName: string;
  defaultLanguageId: string;
  selectedLanguageId: string;
  isAddingKey: boolean;
  formik: FormikProps<{
    projectId: string;
    key: string;
    description?: string;
    translations: Record<string, string>;
  }>;
  onUpdateTranslation: (languageId: string, content: string) => void;
}

export function TranslationsTable({
  translationKeys,
  defaultLanguageName,
  languageName,
  defaultLanguageId,
  selectedLanguageId,
  isAddingKey,
  formik,
  onUpdateTranslation,
}: TranslationsTableProps) {
  return (
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
            <TranslationForm
              formik={formik}
              defaultLanguageId={defaultLanguageId}
              selectedLanguageId={selectedLanguageId}
              onUpdateTranslation={onUpdateTranslation}
            />
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
  );
}
