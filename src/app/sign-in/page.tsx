"use client";

import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Logo from "@/components/logo";

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
          {({ isSubmitting }) => (
            <Form>
              <Field
                name="email"
                as={StyledTextField}
                label="Email"
                variant="outlined"
                fullWidth
              />
              <Field
                name="password"
                as={StyledTextField}
                type="password"
                label="Password"
                variant="outlined"
                fullWidth
              />
              <ForgotPasswordLink href="/forgot-password">
                Forgot password?
              </ForgotPasswordLink>
              <SignInButton
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
              >
                Sign In
              </SignInButton>
            </Form>
          )}
        </Formik>
        <SignUpText variant="body2">
          Don&apos;t have an account?
          <SignUpLink href="/sign-up">Sign up</SignUpLink>
        </SignUpText>
      </SignInBox>
    </SignInContainer>
  );
}
