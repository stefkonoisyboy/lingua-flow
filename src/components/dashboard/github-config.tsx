import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { SearchOutlined } from "@mui/icons-material";
import { Field } from "formik";
import { trpc } from "@/utils/trpc";

interface GitHubConfigProps {
  values: {
    githubConfig: {
      repository: string;
      branch: string;
      translationPath: string;
      filePattern: string;
    };
  };
  touched: {
    githubConfig?: {
      repository?: boolean;
      branch?: boolean;
    };
  };
  errors: {
    githubConfig?: {
      repository?: string;
      branch?: string;
    };
  };
  setFieldValue: (field: string, value: string) => void;
  isConnected: boolean;
}

export default function GitHubConfig({
  values,
  touched,
  errors,
  setFieldValue,
  isConnected,
}: GitHubConfigProps) {
  const [selectedRepo, setSelectedRepo] = useState("");
  const [isSearchingFiles, setIsSearchingFiles] = useState(false);

  const listRepositories = trpc.integrations.listRepositories.useQuery(
    undefined,
    {
      enabled: isConnected,
      retry: 1,
    }
  );

  const listBranches = trpc.integrations.listBranches.useQuery(
    { repository: selectedRepo },
    { enabled: Boolean(selectedRepo) }
  );

  const findTranslationFiles = trpc.integrations.findTranslationFiles.useQuery(
    {
      repository: selectedRepo,
      branch: values.githubConfig.branch,
      filePattern: values.githubConfig.filePattern,
      translationPath: values.githubConfig.translationPath,
    },
    {
      enabled: false,
    }
  );

  const importTranslations = trpc.integrations.importTranslations.useMutation();

  const handleFindTranslationFiles = async () => {
    if (!selectedRepo || !values.githubConfig.branch) {
      return;
    }

    setIsSearchingFiles(true);

    try {
      const files = await findTranslationFiles.refetch();

      if (files.data && files.data.length > 0) {
        await importTranslations.mutateAsync({
          projectId: "test",
          repository: selectedRepo,
          branch: values.githubConfig.branch,
          files: files.data,
        });
      }
    } finally {
      setIsSearchingFiles(false);
    }
  };

  return (
    <>
      <FormControl
        fullWidth
        margin="normal"
        error={
          touched.githubConfig?.repository &&
          Boolean(errors.githubConfig?.repository)
        }
      >
        <InputLabel id="repo-select-label">Repository</InputLabel>
        <Field
          as={Select}
          labelId="repo-select-label"
          name="githubConfig.repository"
          label="Repository"
          onChange={(e: SelectChangeEvent<string>) => {
            setFieldValue("githubConfig.repository", e.target.value);
            setFieldValue("githubConfig.branch", "");
            setSelectedRepo(e.target.value);
          }}
        >
          <MenuItem value="">
            <em>Select a repository</em>
          </MenuItem>
          {listRepositories.isLoading ? (
            <MenuItem disabled>Loading repositories...</MenuItem>
          ) : (
            listRepositories.data?.map((repo) => (
              <MenuItem key={repo.id} value={repo.full_name}>
                {repo.full_name}
              </MenuItem>
            ))
          )}
        </Field>

        {touched.githubConfig?.repository &&
          errors.githubConfig?.repository && (
            <FormHelperText>{errors.githubConfig.repository}</FormHelperText>
          )}
      </FormControl>

      <FormControl
        fullWidth
        margin="normal"
        error={
          touched.githubConfig?.branch && Boolean(errors.githubConfig?.branch)
        }
      >
        <InputLabel id="branch-select-label">Branch</InputLabel>
        <Field
          as={Select}
          labelId="branch-select-label"
          name="githubConfig.branch"
          label="Branch"
          disabled={!values.githubConfig.repository}
        >
          <MenuItem value="">
            <em>Select a branch</em>
          </MenuItem>
          {listBranches.isLoading ? (
            <MenuItem disabled>Loading branches...</MenuItem>
          ) : (
            listBranches.data?.map((branch) => (
              <MenuItem key={branch.name} value={branch.name}>
                {branch.name}
              </MenuItem>
            ))
          )}
        </Field>
        {touched.githubConfig?.branch && errors.githubConfig?.branch && (
          <FormHelperText>{errors.githubConfig.branch}</FormHelperText>
        )}
      </FormControl>

      <Field
        as={TextField}
        name="githubConfig.translationPath"
        label="Translation Files Path (Optional)"
        fullWidth
        margin="normal"
        helperText="Example: /locales or /src/translations"
      />

      <Field
        as={TextField}
        name="githubConfig.filePattern"
        label="File Pattern (Optional)"
        fullWidth
        margin="normal"
        helperText="Example: *.json or translations.{lang}.yml"
      />

      {values.githubConfig.repository && values.githubConfig.branch && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SearchOutlined />}
            onClick={handleFindTranslationFiles}
            disabled={isSearchingFiles}
            fullWidth
          >
            {isSearchingFiles
              ? "Searching for translation files..."
              : "Test Translation File Import"}
          </Button>
          {findTranslationFiles.data && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Found {findTranslationFiles.data.length} translation files
            </Typography>
          )}
          {importTranslations.isSuccess && (
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              Successfully tested translation import! Check the console for
              details.
            </Typography>
          )}
          {(findTranslationFiles.error || importTranslations.error) && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              Error:{" "}
              {findTranslationFiles.error?.message ||
                importTranslations.error?.message}
            </Typography>
          )}
        </Box>
      )}
    </>
  );
}
