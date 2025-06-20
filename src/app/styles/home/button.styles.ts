import { Button, styled } from "@mui/material";

export const SignInButton = styled(Button)`
  padding: ${({ theme }) => theme.spacing(1.5, 4)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  text-transform: none;
  font-size: 1rem;
  font-weight: 500;
  background-color: #38bdf8;

  &:hover {
    background-color: #0ea5e9;
  }

  ${({ theme }) => theme.breakpoints.down("sm")} {
    width: 100%;
  }
`;

export const CreateAccountButton = styled(Button)`
  padding: ${({ theme }) => theme.spacing(1.5, 4)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  text-transform: none;
  font-size: 1rem;
  font-weight: 500;
  background-color: white;
  color: ${({ theme }) => theme.palette.grey[600]};
  border: 1px solid ${({ theme }) => theme.palette.grey[200]};

  &:hover {
    background-color: ${({ theme }) => theme.palette.grey[50]};
    border-color: ${({ theme }) => theme.palette.grey[300]};
  }

  ${({ theme }) => theme.breakpoints.down("sm")} {
    width: 100%;
  }
`;
