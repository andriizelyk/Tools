import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import HomeIcon from '@mui/icons-material/Home';
import { useFavorites } from '../hooks/useFavorites';
import { tools } from '../tools/registry';
import './CommandPalette.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Entry {
  key: string;
  to: string;
  title: string;
  description: string;
  icon: typeof HomeIcon;
  favorite: boolean;
}

export default function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { isFavorite } = useFavorites();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const entries = useMemo(() => {
    const all: Entry[] = [
      { key: 'home', to: '/', title: 'Home', description: 'All tools', icon: HomeIcon, favorite: false },
      ...tools.map((t) => ({
        key: t.path,
        to: `/${t.path}`,
        title: t.title,
        description: t.description,
        icon: t.icon,
        favorite: isFavorite(t.path),
      })),
    ];
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return all
      .filter((e) => terms.every((t) => `${e.title} ${e.description}`.toLowerCase().includes(t)))
      .sort((a, b) => Number(b.favorite) - Number(a.favorite));
  }, [query, isFavorite]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  const go = (entry: Entry | undefined) => {
    if (!entry) return;
    navigate(entry.to);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, entries.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(entries[active]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { className: 'palette-paper' } }}>
      <TextField
        autoFocus
        fullWidth
        placeholder="Jump to a tool…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
        className="palette-input"
      />
      <List className="palette-list">
        {entries.length === 0 && (
          <Typography color="text.secondary" className="palette-empty">
            No matching tools.
          </Typography>
        )}
        {entries.map((entry, i) => (
          <ListItemButton
            key={entry.key}
            selected={i === active}
            onMouseMove={() => setActive(i)}
            onClick={() => go(entry)}
            ref={(el) => {
              if (el && i === active) el.scrollIntoView({ block: 'nearest' });
            }}
          >
            <ListItemIcon>
              <entry.icon />
            </ListItemIcon>
            <ListItemText primary={entry.title} secondary={entry.description} />
            {entry.favorite && <StarIcon fontSize="small" color="warning" />}
          </ListItemButton>
        ))}
      </List>
    </Dialog>
  );
}
