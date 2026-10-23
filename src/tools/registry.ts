import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';

const FormatterPage = lazy(() => import('./formatter/FormatterPage'));
const UrlParserPage = lazy(() => import('./urlParser/UrlParserPage'));

export interface ToolDefinition {
  path: string;
  title: string;
  description: string;
  icon: SvgIconComponent;
  component: ComponentType | LazyExoticComponent<ComponentType>;
}

export const tools: ToolDefinition[] = [
  {
    path: 'formatter',
    title: 'Code Formatter',
    description: 'Beautify JSON, YAML, XML, C#, JavaScript and TypeScript.',
    icon: CodeIcon,
    component: FormatterPage,
  },
  {
    path: 'url-parser',
    title: 'URL Parser',
    description: 'Split a URL into host, path and query parameters, edit and encode each part.',
    icon: LinkIcon,
    component: UrlParserPage,
  },
];
