import React, { useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import { trpc } from "@/utils/trpc";
import {
  ImportDialogContainer,
  ImportDialogTitle,
  ImportDialogSubtitle,
  DropzoneArea,
  DropzoneIcon,
  DropzoneText,
  UploadedFileBox,
  ImportDialogFileName,
  ImportDialogFileRemoveButton,
  ImportDialogRadioGroup,
  ImportDialogSelect,
  PreviewBox,
  ImportDialogActions,
  ImportDialogProgress,
  ImportDialogSpinner,
  ImportDialogResult,
  ImportDialogResultStat,
  ImportDialogCloseIcon,
  ImportDialogError,
  ImportDialogSuccessIcon,
} from "./import-translations.styles";
import { Typography, Box } from "@mui/material";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function parseJsonKeys(content: string): string[] {
  try {
    const data = JSON.parse(content);
    const keys: string[] = [];

    const flatten = (obj: Record<string, unknown>, prefix = ""): void => {
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === "object" && value !== null) {
          flatten(value as Record<string, unknown>, fullKey);
        } else if (typeof value === "string") {
          keys.push(fullKey);
        }
      }
    };

    flatten(data);

    return keys;
  } catch {
    return [];
  }
}

interface ImportTranslationsDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

const ImportTranslationsDialog: React.FC<ImportTranslationsDialogProps> = ({
  open,
  onClose,
  projectId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileError, setFileError] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [previewKeys, setPreviewKeys] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const [importResult, setImportResult] = useState<{
    totalKeys: number;
    newKeys: number;
    updatedTranslations: number;
    unchangedTranslations: number;
    errors: string[];
  } | null>(null);

  const [importError, setImportError] = useState<string>("");

  const { data: languages = [], isLoading: loadingLanguages } =
    trpc.projects.getProjectLanguages.useQuery(
      { projectId },
      { enabled: open }
    );
  const importMutation = trpc.translations.importTranslations.useMutation();

  const reset = () => {
    setFile(null);
    setFileContent("");
    setFileError("");
    setSelectedLanguage("");
    setImportMode("merge");
    setPreviewKeys([]);
    setImporting(false);
    setImportResult(null);
    setImportError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (f: File) => {
    setFileError("");

    if (!f.name.endsWith(".json")) {
      setFileError("Only .json files are supported.");
      return;
    }

    if (f.size > MAX_FILE_SIZE) {
      setFileError("File is too large (max 5MB).");
      return;
    }

    setFile(f);
    const reader = new FileReader();

    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setFileContent(content);

      const keys = parseJsonKeys(content);
      setPreviewKeys(keys);
    };

    reader.readAsText(f);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileContent("");
    setPreviewKeys([]);
    setFileError("");
  };

  const handleStartImport = async () => {
    if (!fileContent || !selectedLanguage) {
      return;
    }

    setImporting(true);
    setImportError("");
    setImportResult(null);

    try {
      const result = await importMutation.mutateAsync({
        projectId,
        languageId: selectedLanguage,
        fileContent,
        fileName: file?.name || "import.json",
        importMode,
      });

      setImportResult(result.stats);
    } catch (err) {
      setImportError("Import failed.");
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  // UI States
  const isIdle = !file && !importing && !importResult;
  const isReady = !!file && !importing && !importResult;
  const isImporting = importing;
  const isComplete = !!importResult;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <ImportDialogContainer>
        <ImportDialogCloseIcon onClick={handleClose}>
          <CloseIcon />
        </ImportDialogCloseIcon>
        <ImportDialogTitle>Import Translations</ImportDialogTitle>
        <ImportDialogSubtitle>
          Upload a JSON file to add or update translations.
        </ImportDialogSubtitle>

        {isIdle && (
          <DropzoneArea
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <DropzoneIcon>
              <CloudUploadIcon fontSize="inherit" />
            </DropzoneIcon>
            <DropzoneText>
              Drag & drop a file here or click to upload
              <br />
              Supports: .json (max 5MB)
            </DropzoneText>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
            {fileError && <ImportDialogError>{fileError}</ImportDialogError>}
          </DropzoneArea>
        )}

        {isReady && (
          <>
            <UploadedFileBox>
              <ImportDialogFileName>{file?.name}</ImportDialogFileName>
              <ImportDialogFileRemoveButton onClick={handleRemoveFile}>
                <CloseIcon />
              </ImportDialogFileRemoveButton>
            </UploadedFileBox>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <ImportDialogSelect
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as string)}
                displayEmpty
                disabled={loadingLanguages}
              >
                <MenuItem value="" disabled>
                  Select Language
                </MenuItem>
                {languages.map((l) => (
                  <MenuItem key={l.language_id} value={l.language_id}>
                    {l.languages?.name || l.language_id}
                  </MenuItem>
                ))}
              </ImportDialogSelect>
              <Box display="flex" flexDirection="column">
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ mb: 0.5 }}
                >
                  Import Mode
                </Typography>
                <ImportDialogRadioGroup
                  value={importMode}
                  onChange={(e) =>
                    setImportMode(e.target.value as "merge" | "replace")
                  }
                >
                  <FormControlLabel
                    value="merge"
                    control={<Radio />}
                    label="Merge"
                  />
                  <FormControlLabel
                    value="replace"
                    control={<Radio />}
                    label="Replace"
                  />
                </ImportDialogRadioGroup>
              </Box>
            </Box>
            <PreviewBox>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Preview ({previewKeys.length} keys detected)
              </Typography>
              <Box component="pre" sx={{ m: 0, whiteSpace: "pre-wrap" }}>
                {previewKeys.slice(0, 20).join("\n")}
                {previewKeys.length > 20 && "\n..."}
              </Box>
            </PreviewBox>
            <ImportDialogActions>
              <Button
                variant="contained"
                color="primary"
                onClick={handleStartImport}
                disabled={!selectedLanguage || !fileContent || importing}
                startIcon={<CloudUploadIcon />}
              >
                Start Import
              </Button>
            </ImportDialogActions>
            {importError && (
              <ImportDialogError>{importError}</ImportDialogError>
            )}
          </>
        )}

        {isImporting && (
          <ImportDialogProgress>
            <ImportDialogSpinner />
            <Typography variant="h6">Importing translations...</Typography>
            <Typography variant="body2" color="textSecondary">
              Please wait while we process your file.
            </Typography>
          </ImportDialogProgress>
        )}

        {isComplete && (
          <ImportDialogResult>
            <ImportDialogSuccessIcon>
              <CheckCircleIcon color="success" fontSize="inherit" />
            </ImportDialogSuccessIcon>
            <Typography variant="h6">Import Complete</Typography>
            <Box display="flex" gap={2}>
              <ImportDialogResultStat>
                {importResult.newKeys ?? 0} Added
              </ImportDialogResultStat>
              <ImportDialogResultStat>
                {importResult.updatedTranslations ?? 0} Updated
              </ImportDialogResultStat>
              <ImportDialogResultStat>
                {importResult.unchangedTranslations ?? 0} Skipped
              </ImportDialogResultStat>
            </Box>
            <ImportDialogActions>
              <Button variant="contained" color="primary" onClick={handleClose}>
                Finish
              </Button>
            </ImportDialogActions>
          </ImportDialogResult>
        )}
      </ImportDialogContainer>
    </Dialog>
  );
};

export default ImportTranslationsDialog;
