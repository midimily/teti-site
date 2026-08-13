import {defineTheme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';

export const tetiTheme = defineTheme({
  name: 'teti',
  extends: neutralTheme,
  tokens: {
    '--color-accent': '#2563eb',
    '--color-accent-muted': '#eef4ff',
    '--color-text-accent': '#1d4ed8',
    '--color-icon-accent': '#2563eb',
    '--color-background-body': '#ffffff',
    '--color-background-surface': '#ffffff',
    '--color-background-card': '#ffffff',
    '--color-background-muted': '#f7f8fa',
    '--color-background-blue': '#eef4ff',
    '--color-background-teal': '#f2f4f7',
    '--color-border': '#e4e7ec',
    '--color-border-emphasized': '#cfd5df',
    '--radius-element': '6px',
    '--radius-container': '8px',
    '--radius-page': '8px',
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
