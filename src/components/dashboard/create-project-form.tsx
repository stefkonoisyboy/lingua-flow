"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Field, Form, Formik, FormikProps } from "formik";
import * as Yup from "yup";
import { trpc } from "@/utils/trpc";
import GitHubConfig from "./github-config";
import {
  GitHubConfigContainer,
  WaitingText,
  ErrorText,
  GitHubSwitchContainer,
} from "@/styles/projects/create-project-form.styles";

const ProjectSchema = Yup.object().shape({
  name: Yup.string().required("Project name is required"),
  description: Yup.string(),
  defaultLanguageId: Yup.string().required("Default language is required"),
  githubEnabled: Yup.boolean(),
  githubConfig: Yup.object().when("githubEnabled", {
    is: true,
    then: (schema) =>
      schema.shape({
        repository: Yup.string().required("Repository is required"),
        branch: Yup.string().required("Branch is required"),
        translationPath: Yup.string(),
        filePattern: Yup.string(),
      }),
  }),
});

interface ProjectFormValues {
  name: string;
  description: string;
  defaultLanguageId: string;
  githubEnabled: boolean;
  githubConfig: {
    repository: string;
    branch: string;
    translationPath: string;
    filePattern: string;
  };
}

interface CreateProjectFormProps {
  onClose: () => void;
}

export default function CreateProjectForm({ onClose }: CreateProjectFormProps) {
  const [githubEnabled, setGithubEnabled] = useState(false);
  const [isConnectingGitHub, setIsConnectingGitHub] = useState(false);
  const [isConnectedGitHub, setIsConnectedGitHub] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const formikRef = useRef<FormikProps<ProjectFormValues>>(null);

  const languages = trpc.languages.getLanguages.useQuery();
  const utils = trpc.useUtils();

  const findTranslationFiles =
    trpc.integrations.findTranslationFiles.useMutation();

  const importTranslations = trpc.integrations.importTranslations.useMutation();
  const createSyncHistory = trpc.syncHistory.create.useMutation();

  const createGitHubIntegration =
    trpc.integrations.createGitHubIntegration.useMutation();

  const createProject = trpc.projects.createProject.useMutation({
    onSuccess: async (data) => {
      if (data?.id && githubEnabled) {
        try {
          // Create GitHub integration first
          const integration = await createGitHubIntegration.mutateAsync({
            projectId: data.id,
            config: {
              repository:
                formikRef.current?.values.githubConfig.repository || "",
              branch: formikRef.current?.values.githubConfig.branch || "",
              translationPath:
                formikRef.current?.values.githubConfig.translationPath,
              filePattern: formikRef.current?.values.githubConfig.filePattern,
            },
          });

          // Find translation files
          const files = await findTranslationFiles.mutateAsync({
            repository: formikRef.current?.values.githubConfig.repository || "",
            branch: formikRef.current?.values.githubConfig.branch || "",
            filePattern: formikRef.current?.values.githubConfig.filePattern,
            translationPath:
              formikRef.current?.values.githubConfig.translationPath,
          });

          if (files && files.length > 0) {
            try {
              // Import translations
              await importTranslations.mutateAsync({
                projectId: data.id,
                repository:
                  formikRef.current?.values.githubConfig.repository || "",
                branch: formikRef.current?.values.githubConfig.branch || "",
                files,
              });

              // Record successful sync
              await createSyncHistory.mutateAsync({
                projectId: data.id,
                integrationId: integration.id,
                status: "success",
                details: {
                  repository: formikRef.current?.values.githubConfig.repository,
                  branch: formikRef.current?.values.githubConfig.branch,
                  filesCount: files.length,
                  files: files.map((f) => f.path),
                },
              });
            } catch (error) {
              // Record failed sync
              await createSyncHistory.mutateAsync({
                projectId: data.id,
                integrationId: integration.id,
                status: "failed",
                details: {
                  repository: formikRef.current?.values.githubConfig.repository,
                  branch: formikRef.current?.values.githubConfig.branch,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Unknown error during import",
                  filesCount: files.length,
                  files: files.map((f) => f.path),
                },
              });

              console.error("Error importing translations:", error);
            }
          }
        } catch (error) {
          // Record failed sync for file finding or integration creation
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          const stage =
            error instanceof Error && error.message.includes("integration")
              ? "creating_integration"
              : "finding_files";

          await createSyncHistory.mutateAsync({
            projectId: data.id,
            integrationId: data.id, // Fallback to project ID if integration creation failed
            status: "failed",
            details: {
              repository: formikRef.current?.values.githubConfig.repository,
              branch: formikRef.current?.values.githubConfig.branch,
              error: errorMessage,
              stage,
            },
          });
          console.error(`Error ${stage}:`, error);
        }
      }

      utils.projects.getAll.invalidate();
      utils.projects.getProjects.invalidate();
      utils.projects.getStats.invalidate();
      utils.activities.getRecentActivity.invalidate();

      onClose();
    },
  });

  const githubConnection = trpc.integrations.checkGitHubConnection.useQuery(
    undefined,
    {
      refetchInterval: isConnectingGitHub ? 1000 : undefined,
      enabled: githubEnabled && !githubError && !isConnectedGitHub,
    }
  );

  const getGitHubAuthUrl = trpc.integrations.getGitHubAuthUrl.useQuery(
    undefined,
    {
      enabled: false,
    }
  );

  const handleGitHubConnect = async () => {
    setGithubError(null);
    const result = await getGitHubAuthUrl.refetch();

    if (result.data) {
      localStorage.setItem("github_oauth_state", result.data.state);
      setIsConnectingGitHub(true);
      window.open(result.data.url, "_blank");
    }
  };

  const handleCreateProject = async (values: ProjectFormValues) => {
    await createProject.mutateAsync({
      name: values.name,
      description: values.description,
      defaultLanguageId: values.defaultLanguageId,
      githubConfig: values.githubEnabled ? values.githubConfig : undefined,
    });
  };

  useEffect(() => {
    if (githubConnection?.isError) {
      setGithubError(githubConnection?.error?.message);
      setIsConnectingGitHub(false);
    }
  }, [githubConnection?.isError, githubConnection?.error?.message]);

  useEffect(() => {
    if (githubConnection?.data?.isConnected) {
      setIsConnectedGitHub(true);
      setIsConnectingGitHub(false);
    }
  }, [githubConnection?.data?.isConnected]);

  return (
    <Formik
      innerRef={formikRef}
      initialValues={{
        name: "",
        description: "",
        defaultLanguageId: "",
        githubEnabled: false,
        githubConfig: {
          repository: "",
          branch: "",
          translationPath: "",
          filePattern: "",
        },
      }}
      validationSchema={ProjectSchema}
      onSubmit={handleCreateProject}
    >
      {({ errors, touched, isSubmitting, values, setFieldValue }) => (
        <Form>
          <DialogContent>
            <Field
              as={TextField}
              name="name"
              label="Project Name"
              fullWidth
              margin="normal"
              error={touched.name && Boolean(errors.name)}
              helperText={touched.name && errors.name}
            />
            <Field
              as={TextField}
              name="description"
              label="Description (Optional)"
              fullWidth
              margin="normal"
              multiline
              rows={4}
            />
            <FormControl
              fullWidth
              margin="normal"
              error={
                touched.defaultLanguageId && Boolean(errors.defaultLanguageId)
              }
            >
              <InputLabel id="language-select-label">
                Default Language
              </InputLabel>
              <Field
                as={Select}
                labelId="language-select-label"
                name="defaultLanguageId"
                label="Default Language"
              >
                {languages.data?.map((language) => (
                  <MenuItem key={language.id} value={language.id}>
                    {language.name} ({language.code})
                  </MenuItem>
                ))}
              </Field>
              {touched.defaultLanguageId && errors.defaultLanguageId && (
                <FormHelperText>{errors.defaultLanguageId}</FormHelperText>
              )}
            </FormControl>

            <GitHubSwitchContainer>
              <Field
                as={FormControlLabel}
                control={<Switch />}
                name="githubEnabled"
                label="Connect GitHub Repository"
                disabled={isConnectingGitHub}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>,
                  checked: boolean
                ) => {
                  setFieldValue("githubEnabled", checked);
                  setGithubEnabled(checked);

                  if (checked && !githubConnection.data?.isConnected) {
                    handleGitHubConnect();
                    return;
                  }

                  if (!checked) {
                    setFieldValue("githubConfig", {
                      repository: "",
                      branch: "",
                      translationPath: "",
                      filePattern: "",
                    });

                    setGithubError(null);
                  }
                }}
              />

              {isConnectingGitHub && (
                <WaitingText variant="body2" color="text.secondary">
                  Waiting for GitHub connection... Please complete the
                  authorization in the new tab.
                </WaitingText>
              )}

              {githubError && (
                <ErrorText variant="body2">{githubError}</ErrorText>
              )}
            </GitHubSwitchContainer>

            {values.githubEnabled && githubConnection.data?.isConnected && (
              <GitHubConfigContainer>
                <Typography variant="subtitle1" gutterBottom>
                  GitHub Configuration
                </Typography>

                <GitHubConfig
                  values={values}
                  touched={touched}
                  errors={errors}
                  setFieldValue={setFieldValue}
                  isConnected={Boolean(githubConnection.data?.isConnected)}
                />
              </GitHubConfigContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={
                isSubmitting ||
                createProject.isPending ||
                findTranslationFiles.isPending ||
                importTranslations.isPending
              }
            >
              {createProject.isPending ||
              findTranslationFiles.isPending ||
              importTranslations.isPending
                ? "Creating Project..."
                : "Create Project"}
            </Button>
          </DialogActions>
        </Form>
      )}
    </Formik>
  );
}
