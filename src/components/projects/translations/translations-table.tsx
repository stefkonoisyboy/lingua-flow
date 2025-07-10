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
import { Comment as CommentIcon, Edit as EditIcon } from "@mui/icons-material";
import { StyledTextarea } from "@/styles/projects/project-translations.styles";
import { ActionButtons } from "@/styles/projects/translations-table.styles";
import { Database } from "@/lib/types/database.types";
import { TranslationForm } from "./translation-form";
import { FormikProps } from "formik";
import { useState } from "react";
import { TranslationEditForm } from "./translation-edit-form";

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
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const handleEditClick = (key: TranslationKey) => {
    setEditingKey(key.id);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
  };

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

            const isEditing = editingKey === key.id;

            if (isEditing) {
              return (
                <TranslationEditForm
                  key={key.id}
                  translationKey={key}
                  translation={translation}
                  defaultTranslation={defaultTranslation}
                  onCancel={handleCancelEdit}
                />
              );
            }

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
                  <ActionButtons>
                    <IconButton onClick={() => handleEditClick(key)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton>
                      <CommentIcon />
                    </IconButton>
                  </ActionButtons>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
