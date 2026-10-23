import { useEffect, useState } from 'react';
import { Outlet, Link as RouterLink } from 'react-router-dom';
import { AppBar, Button, Toolbar, Typography } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import SearchIcon from '@mui/icons-material/Search';
import CommandPalette from './CommandPalette';
import './Layout.css';

const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

export default function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <RouterLink to="/" className="layout-brand">
            <ConstructionIcon />
            <Typography variant="h6" component="span">
              Dev Tools
            </Typography>
          </RouterLink>
          <span className="toolbar-spacer" />
          <Button color="inherit" variant="outlined" startIcon={<SearchIcon />} onClick={() => setPaletteOpen(true)}>
            Search
            <kbd className="layout-kbd">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
          </Button>
        </Toolbar>
      </AppBar>
      <main className="app-main">
        <Outlet />
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
