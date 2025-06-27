"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import {
  FolderOutlined,
  LanguageOutlined,
  ErrorOutlineOutlined,
  Add,
} from "@mui/icons-material";
import StatsCard from "@/components/dashboard/stats-card";
import ProjectCard from "@/components/dashboard/project-card";
import RecentActivity from "@/components/dashboard/recent-activity";
import {
  DashboardContainer,
  ProjectsSection,
  ProjectsHeader,
  CreateProjectButton,
} from "@/styles/dashboard/dashboard.styles";
import {
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Switch,
  Typography,
  SelectChangeEvent,
} from "@mui/material";
import { trpc } from "@/utils/trpc";
import { formatDistance } from "date-fns";
import { Formik, Form, Field, FormikProps } from "formik";
import * as Yup from "yup";

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

export default function DashboardPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [githubEnabled, setGithubEnabled] = useState(false);
  const [isConnectingGitHub, setIsConnectingGitHub] = useState(false);
  const formikRef = useRef<FormikProps<ProjectFormValues>>(null);

  const stats = trpc.projects.getStats.useQuery();
  const projects = trpc.projects.getProjects.useQuery();
  const languages = trpc.languages.getLanguages.useQuery();
  const utils = trpc.useUtils();

  const createProject = trpc.projects.createProject.useMutation({
    onSuccess: () => {
      utils.projects.getProjects.invalidate();
      utils.projects.getStats.invalidate();
      utils.activities.getRecentActivity.invalidate();
      setIsDialogOpen(false);
    },
  });

  const githubConnection = trpc.integrations.checkGitHubConnection.useQuery(
    undefined,
    {
      refetchInterval: isConnectingGitHub ? 1000 : false, // Poll when waiting for connection
    }
  );

  const listRepositories = trpc.integrations.listRepositories.useQuery(
    undefined,
    {
      enabled: githubEnabled && githubConnection.data?.isConnected,
      retry: 1,
    }
  );

  const listBranches = trpc.integrations.listBranches.useQuery(
    { repository: selectedRepo },
    { enabled: Boolean(selectedRepo) }
  );

  const getGitHubAuthUrl = trpc.integrations.getGitHubAuthUrl.useQuery(
    undefined,
    {
      enabled: false,
    }
  );

  const handleGitHubConnect = async () => {
    const result = await getGitHubAuthUrl.refetch();

    if (result.data) {
      localStorage.setItem("github_oauth_state", result.data.state);
      setIsConnectingGitHub(true);
      window.open(result.data.url, "_blank");
    }
  };

  const handleCreateProject = (values: ProjectFormValues) => {
    createProject.mutate({
      name: values.name,
      description: values.description,
      defaultLanguageId: values.defaultLanguageId,
      githubConfig: values.githubEnabled ? values.githubConfig : undefined,
    });
  };

  // Effect to handle GitHub connection completion
  useEffect(() => {
    if (isConnectingGitHub && githubConnection.data?.isConnected) {
      setIsConnectingGitHub(false);
      setGithubEnabled(true);

      // Update Formik form value
      if (formikRef.current) {
        formikRef.current.setFieldValue("githubEnabled", true);
      }
    }
  }, [isConnectingGitHub, githubConnection.data?.isConnected]);

  // Listen for GitHub connection message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "github-connected") {
        // Force refetch GitHub connection status
        githubConnection.refetch();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [githubConnection]);

  return (
    <DashboardContainer>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatsCard
            value={stats.data?.projectsCount || 0}
            label="Total Projects"
            subtext="Ongoing localization projects"
            icon={<FolderOutlined />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatsCard
            value={stats.data?.languagesCount || 0}
            label="Total Languages"
            subtext="Across all projects"
            icon={<LanguageOutlined />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatsCard
            value={`${stats.data?.completionPercentage || 0}%`}
            label="Translation Completion"
            subtext={`${stats.data?.translationsCount || 0} total translations`}
            icon={<ErrorOutlineOutlined />}
            mode={
              (stats.data?.completionPercentage || 0) < 70
                ? "warning"
                : "default"
            }
          />
        </Grid>
      </Grid>

      <ProjectsSection>
        <ProjectsHeader>
          <h2>Projects Overview</h2>
          <p>Quick glance at your ongoing localization projects.</p>
          <CreateProjectButton
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsDialogOpen(true)}
          >
            Create New Project
          </CreateProjectButton>
        </ProjectsHeader>

        <Suspense fallback={<div>Loading projects...</div>}>
          <Grid container spacing={3}>
            {projects.isLoading ? (
              <Grid size={{ xs: 12 }}>
                <Box>Loading projects...</Box>
              </Grid>
            ) : projects.error ? (
              <Grid size={{ xs: 12 }}>
                <Box>Error loading projects: {projects.error.message}</Box>
              </Grid>
            ) : projects.data?.length === 0 ? (
              <Grid size={{ xs: 12 }}>
                <Box>No projects yet. Create your first project!</Box>
              </Grid>
            ) : (
              projects.data?.map((project) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={project?.id}>
                  <ProjectCard
                    title={project?.name ?? ""}
                    languages={project?.languageCount || 0}
                    missingTranslations={Math.round(
                      ((100 - (project?.progress || 0)) / 100) *
                        (project?.languageCount || 0)
                    )}
                    progress={project?.progress || 0}
                    lastUpdate={formatDistance(
                      new Date(project?.updatedAt ?? new Date()),
                      new Date(),
                      { addSuffix: true }
                    )}
                    onView={() => console.log(`View project ${project?.id}`)}
                  />
                </Grid>
              ))
            )}
          </Grid>
        </Suspense>
      </ProjectsSection>

      <RecentActivity />

      {/* Create Project Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Project</DialogTitle>
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
                    touched.defaultLanguageId &&
                    Boolean(errors.defaultLanguageId)
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

                <Box sx={{ mt: 2, mb: 2 }}>
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
                      if (checked && !githubConnection.data?.isConnected) {
                        handleGitHubConnect();
                        return;
                      }
                      setFieldValue("githubEnabled", checked);
                      setGithubEnabled(checked);

                      if (!checked) {
                        setFieldValue("githubConfig", {
                          repository: "",
                          branch: "",
                          translationPath: "",
                          filePattern: "",
                        });
                        setSelectedRepo("");
                      }
                    }}
                  />
                  {isConnectingGitHub && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Waiting for GitHub connection... Please complete the
                      authorization in the new tab.
                    </Typography>
                  )}
                </Box>

                {values.githubEnabled && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      GitHub Configuration
                    </Typography>

                    {!githubConnection.data?.isConnected ? (
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          To use GitHub integration, you need to connect your
                          GitHub account first.
                        </Typography>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={handleGitHubConnect}
                        >
                          Connect GitHub Account
                        </Button>
                      </Box>
                    ) : (
                      <>
                        <FormControl
                          fullWidth
                          margin="normal"
                          error={
                            touched.githubConfig?.repository &&
                            Boolean(errors.githubConfig?.repository)
                          }
                        >
                          <InputLabel id="repo-select-label">
                            Repository
                          </InputLabel>
                          <Field
                            as={Select}
                            labelId="repo-select-label"
                            name="githubConfig.repository"
                            label="Repository"
                            onChange={(e: SelectChangeEvent<string>) => {
                              setFieldValue(
                                "githubConfig.repository",
                                e.target.value
                              );
                              setFieldValue("githubConfig.branch", ""); // Reset branch when repository changes
                              setSelectedRepo(e.target.value);
                            }}
                          >
                            <MenuItem value="">
                              <em>Select a repository</em>
                            </MenuItem>
                            {listRepositories.isLoading ? (
                              <MenuItem disabled>
                                Loading repositories...
                              </MenuItem>
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
                              <FormHelperText>
                                {errors.githubConfig.repository}
                              </FormHelperText>
                            )}
                        </FormControl>

                        <FormControl
                          fullWidth
                          margin="normal"
                          error={
                            touched.githubConfig?.branch &&
                            Boolean(errors.githubConfig?.branch)
                          }
                        >
                          <InputLabel id="branch-select-label">
                            Branch
                          </InputLabel>
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
                          {touched.githubConfig?.branch &&
                            errors.githubConfig?.branch && (
                              <FormHelperText>
                                {errors.githubConfig.branch}
                              </FormHelperText>
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
                      </>
                    )}
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting || createProject.isPending}
                >
                  {createProject.isPending ? "Creating..." : "Create Project"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </DashboardContainer>
  );
}
