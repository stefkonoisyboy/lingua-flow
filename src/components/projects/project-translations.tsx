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
  Select,
  MenuItem,
} from "@mui/material";
import {
  Comment as CommentIcon,
  Add as AddIcon,
  Translate as TranslateIcon,
  Language as LanguageIcon,
} from "@mui/icons-material";
import { Database } from "@/lib/types/database.types";

type TranslationKey = Database["public"]["Tables"]["translation_keys"]["Row"];
type Translation = Database["public"]["Tables"]["translations"]["Row"];

interface ProjectTranslationsProps {
  translationKeys: TranslationKey[];
  translations: Translation[];
  defaultLanguageTranslations: Translation[];
  isLoading: boolean;
  languageName: string;
  defaultLanguageName: string;
  selectedLanguageId: string;
  onLanguageChange: (languageId: string) => void;
  languages: { language_id: string; languages: { name: string } }[];
}

function NoLanguageSelectedPlaceholder() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        px: 2,
        backgroundColor: "background.paper",
        borderRadius: 1,
      }}
    >
      <LanguageIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
      <Typography variant="h6" color="text.primary" gutterBottom>
        Select a Language
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        textAlign="center"
        sx={{ maxWidth: 400 }}
      >
        Choose a language from the dropdown menu above to start managing
        translations.
      </Typography>
    </Box>
  );
}

function NoTranslationsPlaceholder() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        px: 2,
        backgroundColor: "background.paper",
        borderRadius: 1,
      }}
    >
      <TranslateIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
      <Typography variant="h6" color="text.primary" gutterBottom>
        No Translation Keys Yet
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        textAlign="center"
        sx={{ maxWidth: 400 }}
      >
        Get started by adding your first translation key. Click the &quot;Add
        Key&quot; button above to begin managing your translations.
      </Typography>
    </Box>
  );
}

export function ProjectTranslations({
  translationKeys,
  translations,
  defaultLanguageTranslations,
  isLoading,
  languageName,
  defaultLanguageName,
  selectedLanguageId,
  onLanguageChange,
  languages,
}: ProjectTranslationsProps) {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Manage Translations
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Edit, add, or review translation strings for different locales.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Select
            value={selectedLanguageId}
            onChange={(e) => onLanguageChange(e.target.value)}
            displayEmpty
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="" disabled>
              Select Language
            </MenuItem>
            {languages.map((lang) => (
              <MenuItem key={lang.language_id} value={lang.language_id}>
                {lang.languages?.name}
              </MenuItem>
            ))}
          </Select>
          <Button
            disabled={!selectedLanguageId}
            variant="contained"
            startIcon={<AddIcon />}
            // TODO: Implement add key functionality
          >
            Add Key
          </Button>
        </Box>
      </Box>

      {!selectedLanguageId ? (
        <NoLanguageSelectedPlaceholder />
      ) : translationKeys.length === 0 ? (
        <NoTranslationsPlaceholder />
      ) : (
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
                const translation = translations.find(
                  (t) => t.key_id === key.id
                );
                const defaultTranslation = defaultLanguageTranslations.find(
                  (t) => t.key_id === key.id
                );

                return (
                  <TableRow key={key.id}>
                    <TableCell>{key.key}</TableCell>
                    <TableCell>
                      <TextField
                        multiline
                        fullWidth
                        value={defaultTranslation?.content || ""}
                        disabled
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        multiline
                        fullWidth
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
      )}
    </Paper>
  );
}
