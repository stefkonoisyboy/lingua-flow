"use client";

import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Logo from "@/components/logo";
import { useAuth } from "@/hooks/use-auth";
import { Alert } from "@mui/material";
import Link from "next/link";
import { FormikHelpers } from "formik";

import {
  SignInContainer,
  SignInBox,
  LogoBox,
  SignInSubtitle,
  StyledTextField,
  SignInButton,
  ForgotPasswordLink,
  SignUpText,
  SignUpLink,
  AlertWrapper,
} from "@/styles/auth/sign-in.styles";

const SignInSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

interface SignInValues {
  email: string;
  password: string;
}

export default function SignIn() {
  const { signIn, loading, error } = useAuth();

  const initialValues: SignInValues = {
    email: "",
    password: "",
  };

  const handleSubmit = async (
    values: SignInValues,
    { resetForm }: FormikHelpers<SignInValues>
  ) => {
    const result = await signIn(values.email, values.password);

    if (result?.success) {
      resetForm();
    }
  };

  return (
    <SignInContainer>
      <SignInBox>
        <LogoBox>
          <Logo />
        </LogoBox>
        <SignInSubtitle variant="h6">Welcome back!</SignInSubtitle>
        <Formik
          initialValues={initialValues}
          validationSchema={SignInSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched }) => (
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

              {error && (
                <AlertWrapper>
                  <Alert severity={error.type}>{error.message}</Alert>
                </AlertWrapper>
              )}

              <Link href="/reset-password">
                <ForgotPasswordLink>Forgot password?</ForgotPasswordLink>
              </Link>

              <SignInButton
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || isSubmitting}
              >
                Sign In
              </SignInButton>
            </Form>
          )}
        </Formik>
        <SignUpText variant="body2">
          Don&apos;t have an account?
          <Link href="/sign-up">
            <SignUpLink as="span">Sign up</SignUpLink>
          </Link>
        </SignUpText>
      </SignInBox>
    </SignInContainer>
  );
}
