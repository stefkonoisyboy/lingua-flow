"use client";

import { Typography, TextField, Button, CircularProgress } from "@mui/material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { trpc } from "@/utils/trpc";
import {
  SettingsSection,
  FormContainer,
  FormActions,
} from "@/styles/projects/project-settings.styles";

interface ProjectDetailsFormProps {
  projectId: string;
  initialName: string;
  initialDescription: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Project name is required"),
  description: Yup.string(),
});

export function ProjectDetailsForm({
  projectId,
  initialName,
  initialDescription,
  onSuccess,
  onError,
}: ProjectDetailsFormProps) {
  const utils = trpc.useUtils();

  const updateProjectMutation = trpc.projects.updateProject.useMutation({
    onSuccess: () => {
      onSuccess("Project updated successfully");
      utils.projects.getProjectById.invalidate({ projectId });
    },
    onError: (error) => {
      onError(`Error updating project: ${error.message}`);
    },
  });

  return (
    <SettingsSection>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Project Details
      </Typography>

      <Formik
        initialValues={{
          name: initialName,
          description: initialDescription,
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          updateProjectMutation.mutate({
            projectId,
            name: values.name,
            description: values.description || undefined,
          });
          setSubmitting(false);
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          isSubmitting,
          dirty,
        }) => (
          <Form>
            <FormContainer>
              <Field
                name="name"
                as={TextField}
                fullWidth
                label="Project Name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={updateProjectMutation.isPending}
                required
                error={touched.name && Boolean(errors.name)}
                helperText={touched.name && errors.name}
              />

              <Field
                name="description"
                as={TextField}
                fullWidth
                label="Description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={updateProjectMutation.isPending}
                multiline
                rows={3}
              />

              <FormActions>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={
                    updateProjectMutation.isPending || !dirty || isSubmitting
                  }
                >
                  {updateProjectMutation.isPending ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </FormActions>
            </FormContainer>
          </Form>
        )}
      </Formik>
    </SettingsSection>
  );
}
