import type { CSSProperties } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardActionArea, CardContent, IconButton, Tooltip, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useFavorites } from '../hooks/useFavorites';
import { tools, type ToolDefinition } from '../tools/registry';
import './HomePage.css';

function ToolCard({ tool }: { tool: ToolDefinition }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(tool.path);
  const Icon = tool.icon;

  return (
    <Card variant="outlined" className="tool-card" style={{ '--tool-accent': tool.accent } as CSSProperties}>
      <CardActionArea component={RouterLink} to={`/${tool.path}`} className="tool-card-action">
        <CardContent>
          <span className="tool-card-badge">
            <Icon className="tool-card-icon" />
          </span>
          <Typography variant="h6" component="h2" gutterBottom>
            {tool.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tool.description}
          </Typography>
        </CardContent>
      </CardActionArea>
      <Tooltip title={favorite ? 'Remove from favorites' : 'Add to favorites'}>
        <IconButton
          className="tool-card-star"
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={() => toggleFavorite(tool.path)}
        >
          {favorite ? <StarIcon color="warning" /> : <StarBorderIcon />}
        </IconButton>
      </Tooltip>
    </Card>
  );
}

export default function HomePage() {
  const { favorites } = useFavorites();
  const favoriteTools = favorites
    .map((path) => tools.find((t) => t.path === path))
    .filter((t): t is ToolDefinition => !!t);

  return (
    <>
      {favoriteTools.length > 0 && (
        <section className="tool-section">
          <Typography variant="h4" component="h1" gutterBottom>
            Favorites
          </Typography>
          <div className="tool-grid">
            {favoriteTools.map((tool) => (
              <ToolCard key={tool.path} tool={tool} />
            ))}
          </div>
        </section>
      )}
      <section className="tool-section">
        <Typography variant="h4" component={favoriteTools.length ? 'h2' : 'h1'} gutterBottom>
          {favoriteTools.length ? 'All tools' : 'Choose tool'}
        </Typography>
        <div className="tool-grid">
          {tools.map((tool) => (
            <ToolCard key={tool.path} tool={tool} />
          ))}
        </div>
      </section>
    </>
  );
}
