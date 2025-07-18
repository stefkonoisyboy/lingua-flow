import { createTheme } from "@mui/material";
import type { ThemeOptions } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    customBackground: {
      gradient: string;
      settingsSection: string;
      versionContent: string;
      conflictResolution: string;
    };
    neutral: {
      main: string;
      hover: string;
    };
  }
  interface PaletteOptions {
    customBackground: {
      gradient: string;
      settingsSection: string;
      versionContent: string;
      conflictResolution: string;
    };
    neutral: {
      main: string;
      hover: string;
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
    neutral: {
      main: "#E2E8F0",
      hover: "#CBD5E1",
    },
    customBackground: {
      gradient: "linear-gradient(180deg, #F8FBFF 0%, #E8F4FF 100%)",
      settingsSection: "#f5f5f5",
      versionContent: "#f5f5f5",
      conflictResolution: "#f7fafd",
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
    neutral: {
      main: "#334155",
      hover: "#475569",
    },
    customBackground: {
      gradient: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
      settingsSection: "#333",
      versionContent: "#1a1a1a",
      conflictResolution: "#1a2633",
    },
  },
});
