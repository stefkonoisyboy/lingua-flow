import { createTheme } from "@mui/material";
import type { ThemeOptions } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    customBackground: {
      gradient: string;
    };
  }
  interface PaletteOptions {
    customBackground: {
      gradient: string;
    };
  }
}

const baseThemeOptions: ThemeOptions = {
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "3rem",
      fontWeight: 600,
      lineHeight: 1.2,
    },
    body1: {
      fontSize: "1.125rem",
      lineHeight: 1.6,
    },
    button: {
      textTransform: "none" as const,
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "0.75rem 2rem",
        },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: "light",
    primary: {
      main: "#38BDF8",
      dark: "#0EA5E9",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#FFFFFF",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",
      secondary: "#475569",
    },
    customBackground: {
      gradient: "linear-gradient(180deg, #F8FBFF 0%, #E8F4FF 100%)",
    },
  },
});

export const darkTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: "dark",
    primary: {
      main: "#38BDF8",
      dark: "#0EA5E9",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#0F172A",
      paper: "#1E293B",
    },
    text: {
      primary: "#F8FAFC",
      secondary: "#CBD5E1",
    },
    customBackground: {
      gradient: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
    },
  },
});
