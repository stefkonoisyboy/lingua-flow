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
  Tooltip,
  Badge,
} from "@mui/material";
import {
  Comment as CommentIcon,
  Edit as EditIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { StyledTextarea } from "@/styles/projects/project-translations.styles";
import { ActionButtons } from "@/styles/projects/translations-table.styles";
import { Database } from "@/lib/types/database.types";
import { TranslationForm } from "./translation-form";
import { FormikProps } from "formik";
import { useState } from "react";
import { TranslationEditForm } from "./translation-edit-form";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  cancelEditing,
  selectIsAddingKey,
  startEditing,
} from "@/store/slices/translations.slice";
import { VersionHistoryDialog } from "./version-history-dialog";
import { CommentsDialog } from "./comments-dialog";
import { selectSelectedLanguageId } from "@/store/slices/selected-language.slice";

export type TranslationKey =
  Database["public"]["Tables"]["translation_keys"]["Row"] & {
    translations: (Database["public"]["Tables"]["translations"]["Row"] & {
      comments: {
        count: number;
      }[];
    })[];
  };

interface TranslationsTableProps {
  translationKeys: TranslationKey[];
  defaultLanguageName: string;
  languageName: string;
  defaultLanguageId: string;
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
  formik,
  onUpdateTranslation,
}: TranslationsTableProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [selectedTranslationId, setSelectedTranslationId] = useState<
    string | null
  >(null);
  const [selectedKeyName, setSelectedKeyName] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const isAddingKey = useAppSelector(selectIsAddingKey);
  const selectedLanguageId = useAppSelector(selectSelectedLanguageId);

  const handleEditClick = (key: TranslationKey) => {
    setEditingKey(key.id);
    dispatch(startEditing());
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    dispatch(cancelEditing());
  };

  const handleHistoryClick = (translationId: string, key: string) => {
    setSelectedTranslationId(translationId);
    setSelectedKeyName(key);
    setHistoryDialogOpen(true);
  };

  const handleCommentsClick = (translationId: string, key: string) => {
    setSelectedTranslationId(translationId);
    setSelectedKeyName(key);
    setCommentsDialogOpen(true);
  };

  return (
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
                    selectedLanguageId={selectedLanguageId}
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
                      {translation && (
                        <IconButton
                          onClick={() =>
                            handleCommentsClick(translation.id, key.key)
                          }
                        >
                          <Badge
                            badgeContent={translation.comments?.[0]?.count || 0}
                            color="primary"
                            invisible={!translation.comments?.[0]?.count}
                          >
                            <CommentIcon />
                          </Badge>
                        </IconButton>
                      )}
                      {translation && (
                        <Tooltip title="View version history">
                          <IconButton
                            onClick={() =>
                              handleHistoryClick(translation.id, key.key)
                            }
                          >
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ActionButtons>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedTranslationId && selectedKeyName && (
        <>
          <VersionHistoryDialog
            open={historyDialogOpen}
            onClose={() => setHistoryDialogOpen(false)}
            translationId={selectedTranslationId}
            keyName={selectedKeyName}
            languageName={languageName}
          />
          <CommentsDialog
            open={commentsDialogOpen}
            onClose={() => setCommentsDialogOpen(false)}
            translationId={selectedTranslationId}
            keyName={selectedKeyName}
            languageName={languageName}
          />
        </>
      )}
    </>
  );
}
