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
} from "@mui/material";
import {
  Comment as CommentIcon,
  Add as AddIcon,
  Translate as TranslateIcon,
  Language as LanguageIcon,
} from "@mui/icons-material";
import { Database } from "@/lib/types/database.types";
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
}: ProjectTranslationsProps) {
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    onPageChange(value);
  };

  if (isLoading) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }

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
          <Button
            disabled={!selectedLanguageId}
            variant="contained"
            startIcon={<AddIcon />}
            // TODO: Implement add key functionality
          >
            Add Key
          </Button>
        </ControlsContainer>
      </HeaderContainer>

      {!selectedLanguageId ? (
        <NoLanguageSelectedPlaceholder />
      ) : translationKeys.length === 0 ? (
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
