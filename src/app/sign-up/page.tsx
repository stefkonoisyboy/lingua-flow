"use client";

import { Formik, Form, Field, FormikHelpers } from "formik";
import * as Yup from "yup";
import Logo from "@/components/logo";
import { useAuth } from "@/hooks/use-auth";
import { Alert } from "@mui/material";
import Link from "next/link";
import {
  SignUpContainer,
  SignUpBox,
  LogoBox,
  Subtitle,
  StyledTextField,
  SignUpButton,
  SignInText,
  SignInLink,
  AlertWrapper,
} from "@/styles/auth/sign-up.styles";

const SignUpSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

interface SignUpValues {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignUp() {
  const { signUp, loading, error } = useAuth();

  const initialValues: SignUpValues = {
    email: "",
    password: "",
    confirmPassword: "",
  };

  const handleSubmit = async (
    values: SignUpValues,
    { setStatus, resetForm }: FormikHelpers<SignUpValues>
  ) => {
    const result = await signUp(values.email, values.password);

    if (result) {
      setStatus({ success: result });
      resetForm();
    }
  };

  return (
    <SignUpContainer>
      <SignUpBox>
        <LogoBox>
          <Logo />
        </LogoBox>
        <Subtitle variant="h6">Create your account</Subtitle>
        <Formik
          initialValues={initialValues}
          validationSchema={SignUpSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, status, errors, touched }) => (
            <Form>
              <Field
                name="email"
                as={StyledTextField}
                label="Email"
                variant="outlined"
                fullWidth
                disabled={loading}
                error={touched.email && Boolean(errors.email)}
                helperText={touched.email && errors.email}
              />
              <Field
                name="password"
                as={StyledTextField}
                type="password"
                label="Password"
                variant="outlined"
                fullWidth
                disabled={loading}
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
              />
              <Field
                name="confirmPassword"
                as={StyledTextField}
                type="password"
                label="Confirm Password"
                variant="outlined"
                fullWidth
                disabled={loading}
                error={
                  touched.confirmPassword && Boolean(errors.confirmPassword)
                }
                helperText={touched.confirmPassword && errors.confirmPassword}
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

              <SignUpButton
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || isSubmitting}
              >
                Create Account
              </SignUpButton>
            </Form>
          )}
        </Formik>
        <SignInText variant="body2">
          Already have an account?
          <Link href="/sign-in">
            <SignInLink as="span">Sign in</SignInLink>
          </Link>
        </SignInText>
      </SignUpBox>
    </SignUpContainer>
  );
}
