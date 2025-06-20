"use client";

import { Typography } from "@mui/material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Logo from "../components/logo";
import {
  SignUpContainer,
  SignUpBox,
  LogoBox,
  StyledTextField,
  Subtitle,
  SignUpButton,
  SignInText,
  SignInLink,
} from "../styles/auth/sign-up.styles";

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
      <Formik
        initialValues={initialValues}
        validationSchema={SignUpSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <SignUpBox as={Form}>
            <LogoBox>
              <Logo />
            </LogoBox>

            <Typography variant="h4" component="h2" gutterBottom>
              Create an account
            </Typography>

            <Subtitle variant="body1" color="text.secondary">
              Enter your details below to create your account
            </Subtitle>

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

            <Field
              name="confirmPassword"
              as={StyledTextField}
              label="Confirm Password"
              type="password"
              error={touched.confirmPassword && Boolean(errors.confirmPassword)}
              helperText={touched.confirmPassword && errors.confirmPassword}
            />

            <SignUpButton type="submit" variant="contained">
              Create account
            </SignUpButton>

            <SignInText variant="body2" color="text.secondary">
              Already have an account?
              <SignInLink href="/sign-in">Sign in</SignInLink>
            </SignInText>
          </SignUpBox>
        )}
      </Formik>
    </SignUpContainer>
  );
}
