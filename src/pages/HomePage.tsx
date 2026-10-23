import { Link as RouterLink } from 'react-router-dom';
import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { tools } from '../tools/registry';
import './HomePage.css';

export default function HomePage() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Choose a tool
      </Typography>
      <div className="tool-grid">
        {tools.map(({ path, title, description, icon: Icon }) => (
          <Card key={path} variant="outlined" className="tool-card">
            <CardActionArea component={RouterLink} to={`/${path}`} className="tool-card-action">
              <CardContent>
                <Icon color="primary" className="tool-card-icon" />
                <Typography variant="h6" component="h2" gutterBottom>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </div>
    </>
  );
}
