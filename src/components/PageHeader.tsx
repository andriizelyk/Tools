import { Link as RouterLink } from 'react-router-dom';
import { IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Props {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: Props) {
  return (
    <>
      <div className="page-header">
        <IconButton component={RouterLink} to="/" aria-label="Back to tools">
          <ArrowBackIcon />
        </IconButton>
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
