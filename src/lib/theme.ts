import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#00B894", // สีเขียว HealthLink เดิม
      light: "#E8F8F5",
      dark: "#00996B",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#0984E3",
      light: "#E3F2FD",
    },
    error: {
      main: "#E17055",
    },
    warning: {
      main: "#FDCB6E",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    text: {
      primary: "#0e1b17",
      secondary: "#6b7280",
    },
  },
  typography: {
    fontFamily: "'Sarabun', 'Roboto', sans-serif",
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        },
      },
    },
  },
});

export default theme;
