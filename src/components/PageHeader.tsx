import { Link as RouterLink, useLocation } from 'react-router-dom';
import { IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { tools } from '../tools/registry';

interface Props {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: Props) {
  const { pathname } = useLocation();
  const tool = tools.find((t) => pathname === `/${t.path}`);
  const Icon = tool?.icon;
  return (
    <>
      <div className="page-header">
        <IconButton component={RouterLink} to="/" aria-label="Back to tools">
          <ArrowBackIcon />
        </IconButton>
        {Icon && <Icon className="page-header-icon" style={{ color: tool.accent }} />}
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
      </div>
      {description && (
        <Typography color="text.secondary" className="page-description">
          {description}
        </Typography>
      )}
    </>
  );
}
