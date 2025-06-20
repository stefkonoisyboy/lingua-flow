"use client";

import { Typography } from "@mui/material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Logo from "../components/logo";

import {
  SignInContainer,
  SignInBox,
  LogoBox,
  StyledTextField,
  SignInButton,
  ForgotPasswordLink,
  SignUpText,
  SignUpLink,
  SignInSubtitle,
} from "../styles/auth/sign-in.styles";

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
  const initialValues: SignInValues = {
    email: "",
    password: "",
  };

  const handleSubmit = async (values: SignInValues) => {
    // TODO: Implement sign in logic
    console.log("Sign in with:", values);
  };

  return (
    <SignInContainer>
      <Formik
        initialValues={initialValues}
        validationSchema={SignInSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <SignInBox as={Form}>
            <LogoBox>
              <Logo />
            </LogoBox>

            <Typography variant="h4" component="h2" gutterBottom>
              Welcome back
            </Typography>

            <SignInSubtitle variant="body1" color="text.secondary">
              Sign in to your account to continue
            </SignInSubtitle>

            <Field
              name="email"
              as={StyledTextField}
              label="Email"
              type="email"
              placeholder="m@example.com"
              error={touched.email && Boolean(errors.email)}
              helperText={touched.email && errors.email}
            />

            <Field
              name="password"
              as={StyledTextField}
              label="Password"
              type="password"
              error={touched.password && Boolean(errors.password)}
              helperText={touched.password && errors.password}
            />

            <ForgotPasswordLink href="/forgot-password">
              Forgot password?
            </ForgotPasswordLink>

            <SignInButton type="submit" variant="contained">
              Sign in
            </SignInButton>

            <SignUpText variant="body2" color="text.secondary">
              Don&apos;t have an account?
              <SignUpLink href="/sign-up">Sign up</SignUpLink>
            </SignUpText>
          </SignInBox>
        )}
      </Formik>
    </SignInContainer>
  );
}
