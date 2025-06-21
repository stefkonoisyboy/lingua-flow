"use client";

import { useAuth } from "@/hooks/use-auth";
import Logo from "@/components/logo";
import { Alert, TextField } from "@mui/material";
import { Formik, Form, FormikHelpers } from "formik";
import * as Yup from "yup";
import Link from "next/link";
import {
  StyledContainer,
  ResetPasswordBox,
  LogoWrapper,
  StyledTitle,
  StyledSubtitle,
  AlertWrapper,
  SubmitButton,
  FooterWrapper,
  StyledLink,
} from "@/styles/auth/reset-password.styles";

interface ResetPasswordValues {
  email: string;
}

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
});

const initialValues: ResetPasswordValues = {
  email: "",
};

const ResetPassword = () => {
  const { resetPassword, loading, error } = useAuth();

  const handleSubmit = async (
    values: ResetPasswordValues,
    { setStatus, resetForm }: FormikHelpers<ResetPasswordValues>
  ) => {
    const result = await resetPassword(values.email);
    if (result) {
      setStatus({ success: result });
      resetForm();
    }
  };

  return (
    <StyledContainer>
      <ResetPasswordBox>
        <LogoWrapper>
          <Logo />
        </LogoWrapper>

        <StyledTitle variant="h5">Reset your password</StyledTitle>

        <StyledSubtitle variant="body1">
          Enter your email address and we will send you a password reset link
        </StyledSubtitle>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, values, errors, touched, status }) => (
            <Form style={{ width: "100%" }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.email && Boolean(errors.email)}
                helperText={touched.email && errors.email}
                disabled={loading}
              />

              {error && (
                <AlertWrapper>
                  <Alert severity={error.type}>{error.message}</Alert>
                </AlertWrapper>
              )}

              {status?.success && (
                <AlertWrapper>
                  <Alert severity={status.success.type}>
                    {status.success.message}
                  </Alert>
                </AlertWrapper>
              )}

              <SubmitButton
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
              >
                Send reset link
              </SubmitButton>

              <FooterWrapper>
                Remember your password?
                <Link href="/sign-in">
                  <StyledLink as="span">Sign in</StyledLink>
                </Link>
              </FooterWrapper>
            </Form>
          )}
        </Formik>
      </ResetPasswordBox>
    </StyledContainer>
  );
};

export default ResetPassword;
