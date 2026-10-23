import { createTheme } from '@mui/material';

// Spacing and radii are expressed in rem so the whole UI scales with the root font size.
const theme = createTheme({
  spacing: (factor: number) => `${factor * 0.5}rem`,
  shape: { borderRadius: '0.5rem' as unknown as number },
  palette: {
    mode: 'dark',
    primary: { main: '#90a4ff' },
    background: { default: '#0f1218', paper: '#181c25' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none' } } },
  },
});

export default theme;
