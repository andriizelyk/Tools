import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CompareIcon from '@mui/icons-material/Compare';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PaletteIcon from '@mui/icons-material/Palette';
import QrCode2Icon from '@mui/icons-material/QrCode2';

const FormatterPage = lazy(() => import('./formatter/FormatterPage'));
const UrlParserPage = lazy(() => import('./urlParser/UrlParserPage'));
const JwtPage = lazy(() => import('./jwt/JwtPage'));
const UuidPage = lazy(() => import('./uuid/UuidPage'));
const TimestampPage = lazy(() => import('./timestamp/TimestampPage'));
const DiffPage = lazy(() => import('./diff/DiffPage'));
const CronPage = lazy(() => import('./cron/CronPage'));
const ColorPage = lazy(() => import('./color/ColorPage'));
const QrPage = lazy(() => import('./qr/QrPage'));

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
  {
    path: 'jwt',
    title: 'JWT Decoder',
    description: 'Inspect the header, payload and expiry of a JSON Web Token.',
    icon: VpnKeyIcon,
    component: JwtPage,
  },
  {
    path: 'uuid',
    title: 'UUID / GUID Generator',
    description: 'Generate v4 or v7 identifiers in bulk with format options.',
    icon: FingerprintIcon,
    component: UuidPage,
  },
  {
    path: 'timestamp',
    title: 'Timestamp Converter',
    description: 'Convert Unix epoch values and dates between formats and time zones.',
    icon: ScheduleIcon,
    component: TimestampPage,
  },
  {
    path: 'diff',
    title: 'Text Diff',
    description: 'Compare two texts line by line and highlight the changes.',
    icon: CompareIcon,
    component: DiffPage,
  },
  {
    path: 'cron',
    title: 'Cron Expression Explainer',
    description: 'Translate cron expressions to plain English and preview the next runs.',
    icon: AccessTimeIcon,
    component: CronPage,
  },
  {
    path: 'color',
    title: 'Color Tools',
    description: 'Convert HEX, RGB and HSL, check WCAG contrast and build palettes.',
    icon: PaletteIcon,
    component: ColorPage,
  },
  {
    path: 'qr',
    title: 'QR Code Generator',
    description: 'Generate QR codes from text or URLs and download them as PNG or SVG.',
    icon: QrCode2Icon,
    component: QrPage,
  },
];
