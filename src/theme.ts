import {defineTheme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';

export const tetiTheme = defineTheme({
  name: 'teti',
  extends: neutralTheme,
  tokens: {
    '--color-accent': '#2563eb',
    '--color-accent-muted': '#dbeafe',
    '--color-text-accent': '#1d4ed8',
    '--color-icon-accent': '#2563eb',
    '--color-background-body': '#f8fbff',
    '--color-background-surface': '#ffffff',
    '--color-background-card': '#ffffff',
    '--color-background-muted': '#eff6ff',
    '--color-background-blue': '#dbeafe',
    '--color-background-teal': '#e0f2fe',
    '--color-border': 'rgba(37, 99, 235, 0.14)',
    '--color-border-emphasized': 'rgba(37, 99, 235, 0.28)',
    '--radius-element': '10px',
    '--radius-container': '16px',
    '--radius-page': '28px',
  },
  typography: {
    scale: {base: 15, ratio: 1.18},
    body: {
      family: 'Inter',
      fallbacks:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    heading: {
      family: 'Inter',
      fallbacks:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      weight: 'semibold',
    },
  },
});
