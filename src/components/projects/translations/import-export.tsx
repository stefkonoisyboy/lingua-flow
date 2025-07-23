import React, { useState } from "react";
import { Button, CardContent, Typography } from "@mui/material";
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { ImportExportCard, ActionsRow } from "./import-export.styles";
import JSZip from "jszip";
import { trpc } from "@/utils/trpc";
import { useParams } from "next/navigation";
import ImportTranslationsDialog from "./import-translations-dialog";

export const ImportExport: React.FC = () => {
  const params = useParams();
  const projectId = params.projectId as string;

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const exportMutation = trpc.translations.exportTranslations.useMutation();

  const { data: projectLanguages } = trpc.projects.getProjectLanguages.useQuery(
    {
      projectId,
    }
  );

  const languages = projectLanguages || [];

  const handleExport = async () => {
    if (!projectId || !languages.length) {
      return;
    }

    try {
      const languageIds = languages.map((l) => l.language_id);

      const languageCodes = Object.fromEntries(
        languages.map((l) => [l.language_id, l.languages.code])
      );

      const result = await exportMutation.mutateAsync({
        projectId,
        languageIds,
      });

      const zip = new JSZip();

      for (const langId of languageIds) {
        const code = languageCodes[langId];

        if (code && result[code]) {
          zip.file(`${code}.json`, result[code]);
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = "project-translations.zip";
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    } catch (error) {
      console.error("Error exporting translations:", error);
    }
  };

  return (
    <>
      <ImportExportCard>
        <CardContent>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Import / Export
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Manage your translation files.
          </Typography>
          <ActionsRow>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setImportDialogOpen(true)}
            >
              Import (JSON, YAML, CSV)
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending
                ? "Exporting..."
                : "Export Translations"}
            </Button>
          </ActionsRow>
        </CardContent>
      </ImportExportCard>
      <ImportTranslationsDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        projectId={projectId}
      />
    </>
  );
};
