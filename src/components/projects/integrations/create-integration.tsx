import { useState, useRef, useEffect } from "react";
import {
  Button,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import { Form, Formik, FormikProps } from "formik";
import * as Yup from "yup";
import { trpc } from "@/utils/trpc";
import GitHubConfig from "@/components/dashboard/github-config";
import {
  GitHubConfigContainer,
  WaitingText,
  ErrorText,
  GitHubSwitchContainer,
} from "@/styles/projects/create-project-form.styles";

const IntegrationSchema = Yup.object().shape({
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

interface IntegrationFormValues {
  githubEnabled: boolean;
  githubConfig: {
    repository: string;
    branch: string;
    translationPath: string;
    filePattern: string;
  };
}

interface CreateIntegrationProps {
  projectId: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function CreateIntegration({
  projectId,
  onClose,
  onSuccess,
  onError,
}: CreateIntegrationProps) {
  const [githubEnabled, setGithubEnabled] = useState(false);
  const [isConnectingGitHub, setIsConnectingGitHub] = useState(false);
  const [isConnectedGitHub, setIsConnectedGitHub] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const formikRef = useRef<FormikProps<IntegrationFormValues>>(null);

  const utils = trpc.useUtils();

  const findTranslationFiles =
    trpc.integrations.findTranslationFiles.useMutation();

  const importTranslations = trpc.integrations.importTranslations.useMutation();
  const createSyncHistory = trpc.syncHistory.create.useMutation();

  const createGitHubIntegration =
    trpc.integrations.createGitHubIntegration.useMutation({
      onSuccess: async (data) => {
        try {
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
                projectId,
                repository:
                  formikRef.current?.values.githubConfig.repository || "",
                branch: formikRef.current?.values.githubConfig.branch || "",
                files,
              });

              // Record successful sync
              await createSyncHistory.mutateAsync({
                projectId,
                integrationId: data.id,
                status: "success",
                details: {
                  repository: formikRef.current?.values.githubConfig.repository,
                  branch: formikRef.current?.values.githubConfig.branch,
                  filesCount: files.length,
                  files: files.map((f) => f.path),
                },
              });

              onSuccess(
                "Integration created and translations imported successfully!"
              );
            } catch (error) {
              // Record failed sync
              await createSyncHistory.mutateAsync({
                projectId,
                integrationId: data.id,
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

              onError("Failed to import translations. Please try again.");
              console.error("Error importing translations:", error);
            }
          } else {
            onSuccess("Integration created successfully!");
          }

          utils.integrations.getProjectIntegration.invalidate({ projectId });
          utils.syncHistory.getByProjectId.invalidate({ projectId });
          utils.projects.getProjectLanguages.invalidate({ projectId });

          onClose();
        } catch (error) {
          // Record failed sync for file finding
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          await createSyncHistory.mutateAsync({
            projectId,
            integrationId: data.id,
            status: "failed",
            details: {
              repository: formikRef.current?.values.githubConfig.repository,
              branch: formikRef.current?.values.githubConfig.branch,
              error: errorMessage,
              stage: "finding_files",
            },
          });

          utils.syncHistory.getByProjectId.invalidate({ projectId });

          onError(
            "Failed to find translation files. Please check your configuration."
          );

          console.error("Error finding translation files:", error);
        }
      },
      onError: (error) => {
        onError(error.message);
        utils.syncHistory.getByProjectId.invalidate({ projectId });
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

  const handleCreateIntegration = async (values: IntegrationFormValues) => {
    if (!values.githubEnabled) {
      onError("Please connect to GitHub first");
      return;
    }

    await createGitHubIntegration.mutateAsync({
      projectId,
      config: values.githubConfig,
    });
  };

  // Monitor GitHub connection status
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
        githubEnabled: false,
        githubConfig: {
          repository: "",
          branch: "",
          translationPath: "",
          filePattern: "",
        },
      }}
      validationSchema={IntegrationSchema}
      onSubmit={handleCreateIntegration}
    >
      {({ errors, touched, isSubmitting, values, setFieldValue }) => (
        <Form>
          <DialogContent>
            <GitHubSwitchContainer>
              <FormControlLabel
                control={<Switch />}
                name="githubEnabled"
                label="Connect GitHub Repository"
                disabled={isConnectingGitHub}
                onChange={(
                  e: React.SyntheticEvent<Element, Event>,
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
                createGitHubIntegration.isPending ||
                findTranslationFiles.isPending ||
                importTranslations.isPending ||
                !githubEnabled
              }
            >
              {createGitHubIntegration.isPending ||
              findTranslationFiles.isPending ||
              importTranslations.isPending
                ? "Creating Integration..."
                : "Create Integration"}
            </Button>
          </DialogActions>
        </Form>
      )}
    </Formik>
  );
}
