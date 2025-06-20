"use client";

import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Logo from "@/components/logo";
import {
  SignUpContainer,
  SignUpBox,
  LogoBox,
  Subtitle,
  StyledTextField,
  SignUpButton,
  SignInText,
  SignInLink,
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
  const initialValues: SignUpValues = {
    email: "",
    password: "",
    confirmPassword: "",
  };

  const handleSubmit = async (values: SignUpValues) => {
    // TODO: Implement sign up logic with Supabase
    console.log(values);
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
          {({ isSubmitting }) => (
            <Form>
              <Field
                name="name"
                as={StyledTextField}
                label="Full Name"
                variant="outlined"
                fullWidth
              />
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
              <Field
                name="confirmPassword"
                as={StyledTextField}
                type="password"
                label="Confirm Password"
                variant="outlined"
                fullWidth
              />
              <SignUpButton
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
              >
                Create Account
              </SignUpButton>
            </Form>
          )}
        </Formik>
        <SignInText variant="body2">
          Already have an account?
          <SignInLink href="/sign-in">Sign in</SignInLink>
        </SignInText>
      </SignUpBox>
    </SignUpContainer>
  );
}
