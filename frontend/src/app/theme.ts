import { createTheme } from '@mui/material/styles';

// ─── Global radius token ────────────────────────────────────────
// 6 px everywhere. All MUI sx borderRadius numbers multiply this
// unit: borderRadius: 1 = 6px, 2 = 12px, 3 = 18px …
const RADIUS = 6;

const baseTypography = {
  fontFamily: '"Poppins", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 700, letterSpacing: '-0.02em' },
  h2: { fontWeight: 700, letterSpacing: '-0.01em' },
  h3: { fontWeight: 600, letterSpacing: '-0.01em' },
  h4: { fontWeight: 600 },
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },
  subtitle1: { fontWeight: 500 },
  button: { textTransform: 'none' as const, fontWeight: 600 }
};

const sharedComponents = {
  MuiInputLabel: {
    defaultProps: { shrink: true }
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: RADIUS,
        padding: '8px 20px',
        boxShadow: 'none',
        '&:hover': { boxShadow: '0px 2px 4px rgba(0,0,0,0.06)' }
      }
    }
  },
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        borderRadius: RADIUS,
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.04)'
      }
    }
  },
  MuiDialog: {
    styleOverrides: {
      paper: { borderRadius: RADIUS }
    }
  },
  MuiPaper: {
    styleOverrides: {
      rounded: { borderRadius: RADIUS }
    }
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 4 }
    }
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: { borderRadius: RADIUS }
    }
  },
  MuiFilledInput: {
    styleOverrides: {
      root: { borderRadius: RADIUS }
    }
  },
  MuiAlert: {
    styleOverrides: {
      root: { borderRadius: RADIUS }
    }
  },
  MuiTableContainer: {
    styleOverrides: {
      root: { borderRadius: RADIUS }
    }
  }
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f2e5e',
      light: '#3b5a8f',
      dark: '#07152c',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#ffffff',
      light: '#ffffff',
      dark: '#f1f5f9',
      contrastText: '#0f2e5e'
    },
    background: {
      default: '#f3f7fa',
      paper: '#ffffff'
    },
    text: {
      primary: '#0f2e5e',
      secondary: '#475a7a'
    },
    divider: '#e2e8f0'
  },
  typography: baseTypography,
  shape: { borderRadius: RADIUS },
  components: {
    ...sharedComponents,
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: RADIUS,
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0'
        }
      }
    }
  }
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#5b8ec9',
      light: '#8db3e0',
      dark: '#3b6a9e',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#ffffff',
      light: '#ffffff',
      dark: '#1e2e4a',
      contrastText: '#f0f4f8'
    },
    background: {
      default: '#040a17',
      paper: '#081a36'
    },
    text: {
      primary: '#f0f4f8',
      secondary: '#9cb0c9'
    },
    divider: '#1e2e4a'
  },
  typography: baseTypography,
  shape: { borderRadius: RADIUS },
  components: {
    ...sharedComponents,
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: RADIUS,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.1)',
          border: '1px solid #1e2e4a'
        }
      }
    }
  }
});
