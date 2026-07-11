# DaisyUI Study Notes for Teti Homepage 1.0

## Conclusion

DaisyUI should not be introduced into the current MVP. It is a Tailwind CSS
plugin, while this project is currently React + Vite + Astryx + plain CSS
tokens. Adding DaisyUI now would require adding Tailwind, changing the styling
pipeline, and rewriting component expression around utility classes.

The useful part is DaisyUI's component vocabulary:

- `btn-primary` and `btn-outline` map well to Teti's Connect and Download
  actions.
- `badge` maps well to Teti skill tags.
- `stat` maps well to network-state counters, as long as they stay lightweight
  and do not become a SaaS dashboard.
- `modal` maps well to the desktop-app fallback after a `teti://` handoff.
- `indicator` maps well to online/thinking/idle presence on the small Teti logo.

## Adopted Patterns

| DaisyUI idea | Teti implementation | Adopted |
| --- | --- | --- |
| Theme colors | CSS tokens in `src/styles.css` and Astryx tokens in `src/theme.ts` | Yes |
| Button variants | Astryx `Button` with primary/secondary variants | Yes |
| Badge | Astryx `Badge` for skill tags | Yes |
| Stat | Custom `Stats` component with network labels | Yes |
| Modal | Custom `DownloadModal` with DaisyUI-like actions | Yes |
| Indicator | `StatusIndicator` + avatar status dot | Yes |
| Card grid | Avoided for registry; rows preserve scanning density | No |

## Token Direction

The Teti MVP uses a light blue system:

- Primary: `#2563EB`
- Bright: `#3B82F6`
- Soft blue: `#DBEAFE`
- Light cyan: `#E0F2FE`
- Background: `#F8FBFF`
- Surface: `rgba(255,255,255,0.82)`
- Text primary: `#0F172A`
- Text secondary: `#475569`
- Border: `rgba(37,99,235,0.12)`
- Shadow: `0 20px 60px rgba(37,99,235,0.10)`

## Product Fit

Teti.bot is a public companion-network explorer, so it should feel like a
registry and identity layer. It should not feel like a logged-in analytics
dashboard or marketplace. A list-first structure gives the first version the
right density: users can compare names, status, abilities, and connection
availability without scanning a decorative card grid.
