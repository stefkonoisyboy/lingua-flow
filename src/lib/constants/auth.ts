export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "invalid_credentials",
  EMAIL_NOT_CONFIRMED: "email_not_confirmed",
  USER_ALREADY_EXISTS: "user_already_exists",
  WEAK_PASSWORD: "weak_password",
} as const;

export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
  EMAIL_NOT_CONFIRMED: "Please verify your email before signing in.",
  USER_ALREADY_EXISTS: "An account with this email already exists.",
  WEAK_PASSWORD:
    "Password should be at least 8 characters long and contain a mix of letters, numbers, and symbols.",
  INVALID_REQUEST: "Invalid request. Please check your input and try again.",
  UNPROCESSABLE_ENTITY:
    "The request was valid but could not be processed. Please try again.",
  TOO_MANY_REQUESTS:
    "Too many attempts. Please wait a while before trying again.",
  INTERNAL_SERVER_ERROR:
    "An internal server error occurred. Please try again later.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  UNEXPECTED_ERROR: "An unexpected error occurred. Please try again.",
  SIGNUP_SUCCESS: "Check your email for the confirmation link.",
  RESET_PASSWORD_SUCCESS: "Check your email for the password reset link.",
} as const;
