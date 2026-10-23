import { Outlet, Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import './Layout.css';

export default function Layout() {
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
        </Toolbar>
      </AppBar>
      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}
