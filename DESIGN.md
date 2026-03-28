# Design System — PAL'OESTE (paloeste.com)

## Product Context
- **What this is:** Digital magazine + business directory for western Puerto Rico. 162+ businesses, WhatsApp bot (*7711), events calendar, musicians directory, sponsor tiers, physical+digital magazine editions.
- **Who it's for:** Locals and visitors looking for businesses, food, events, and culture in the west coast of Puerto Rico. Spanish-speaking, mobile-first.
- **Space/industry:** Local discovery / city guide (Eater, Thrillist, TimeOut, The Infatuation are the best-in-class peers)
- **Project type:** Hybrid — editorial magazine + structured directory + sponsor platform

## Aesthetic Direction
- **Direction:** Coastal Editorial
- **Decoration level:** Intentional — subtle warmth through stone tones and occasional texture. The PR flag gradient at the top stays (it's the most distinctive visual element). Not maximalist, not sterile.
- **Mood:** Warm, confident, Caribbean. Like a well-designed local magazine you'd pick up at a coffee shop in Boquerón. Not a SaaS dashboard, not a WordPress template.
- **Reference sites:** eater.com (editorial + directory hybrid), thrillist.com (magazine energy with display type), timeout.com/san-juan (local city guide), theinfatuation.com (photo-forward editorial)
- **Deliberate contrast:** Every local directory in PR looks either like a WordPress template from 2015 or a generic Yelp clone. paloeste.com should feel like it belongs to the west coast — warm, coastal, with magazine energy that none of the competitors have.

## Typography
- **Display/Hero:** Cabinet Grotesk (Black 900, Bold 700, Medium 500) — punchy, editorial, modern. Nobody in the PR directory space uses it. Has the magazine energy that system fonts and Geist lack. Gives headlines personality without sacrificing legibility.
- **Body:** DM Sans (400, 500, 700, 400i) — clean, warm, excellent Spanish-language rendering. Highly legible at body sizes.
- **UI/Labels:** DM Sans 700 — same family, bold weight for labels and navigation
- **Data/Tables:** Geist (tabular-nums) — keep for functional elements where precision matters (prices, stats, ratings, hours)
- **Code:** Geist Mono (if needed)
- **Loading:** Fontshare CDN for Cabinet Grotesk, Google Fonts for DM Sans, next/font for Geist
  ```html
  <!-- Cabinet Grotesk from Fontshare (free for commercial use) -->
  <link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700,900&display=swap" rel="stylesheet">
  <!-- DM Sans from Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">
  ```
- **Scale:**
  - Hero: clamp(2.4rem, 5vw, 3.6rem) — Cabinet Grotesk 900
  - H2: 1.75rem — Cabinet Grotesk 900
  - H3: 1.2rem — Cabinet Grotesk 700
  - Subtitle: 1.1rem — Cabinet Grotesk 500
  - Body: 16px / 1.6 — DM Sans 400
  - Small: 14px — DM Sans 400
  - Label: 11px uppercase 0.1em tracking — DM Sans 700
  - Button: 14px — DM Sans 700
  - Data: 14px tabular-nums — Geist

## Color
- **Approach:** Restrained with two intentional accents — red (PR flag, primary brand) and ocean blue (coastal identity, secondary)
- **Background (--bg):** `#FAFAF7` — warm off-white, not clinical
- **Surface (--surface):** `#F2F0EB` — sand, for cards and containers
- **Text (--text):** `#1C1917` — stone-900, warm black
- **Text muted (--text-muted):** `#78716C` — stone-500
- **Accent (--accent):** `#DC2626` — red-600. PR flag red. Bold, brand-defining, used sparingly.
- **Accent hover (--accent-hover):** `#B91C1C` — red-700
- **Secondary (--secondary):** `#1E3A5F` — deep ocean blue. For sponsor blocks, dark CTAs, nautical personality.
- **Border (--border):** `#E7E5E0` — warm stone
- **Semantic:**
  - Success: `#16A34A` (green-600)
  - Warning: `#D97706` (amber-600)
  - Error: `#DC2626` (same as accent)
  - Info: `#2563EB` (blue-600)
- **Dark mode strategy:** Invert surfaces (bg → `#1A1816`, surface → `#262320`), warm text (`#F2F0EB`), increase accent brightness to `#EF4444`, reduce border contrast to `#3A3530`, shift secondary to `#3B82F6`

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable — generous whitespace on editorial sections, tighter on directory cards and data tables
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** Hybrid — editorial grid for homepage and magazine content (asymmetric, photo-forward sections), disciplined grid for directory listings and business profiles (scannable, data-dense)
- **Grid:** 3-column for card grids, single-column for editorial content
- **Max content width:** 1100px (wide sections), 800px (editorial body)
- **Border radius:** sm: 4px, md: 8px, lg: 10px, xl: 12px, full: 9999px (pills and buttons)

## Motion
- **Approach:** Minimal-functional
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150ms) medium(250ms)
- **Hover effects:** Cards lift 2px with subtle shadow. Buttons darken. Links color-shift. No scroll animations, no parallax. The content IS the show.

## Component Patterns
- **Navigation:** Sticky header, glassmorphic bg, logo left, links center, CTA pill right (red accent)
- **Hero:** PR flag gradient bar (3-4px) at top. Cabinet Grotesk Black headline. Search bar with pill button. Category pills below.
- **Place cards:** Surface bg, 1px border, 10px radius. Emoji/photo top, name+meta+tags below. PRO badge on sponsored listings. Lift on hover.
- **Sponsor blocks:** Ocean blue (--secondary) bg, white text, sponsor badge in red, CTA buttons. Full-width within content area.
- **Event rows:** Date column (month small red, day large) + event info. Badge pills for category (Familiar green, Música blue).
- **WhatsApp CTA:** Ocean blue bg, centered, green WhatsApp button. Appears on homepage and business profiles.
- **Business profile:** Avatar + name/category + stats row. Action buttons (call, directions, share). Detail grid (2-col) with labeled items.
- **Buttons:** Primary (red filled pill), Secondary (ocean blue filled pill), Outline (border pill), Ghost (text only with hover bg)
- **Inputs:** 1.5px border, 8px radius, accent border on focus, pill variant for search

## Logo Treatment
- **Text logo:** Cabinet Grotesk 900, lowercase: `pal'` in --text + `oeste` in --accent
- **Consistent across:** header, footer, favicon, OG images

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-27 | Design system created for paloeste.com | Replaces mastiempo.net DESIGN.md — different product needs different design system |
| 2026-03-27 | Coastal Editorial aesthetic | Differentiate from every WordPress/Yelp directory in PR. Magazine energy for an editorial+directory hybrid. |
| 2026-03-27 | Cabinet Grotesk for display | Editorial personality that Geist/system fonts lack. Free on Fontshare. Nobody in PR local space uses it. |
| 2026-03-27 | Warm stone palette over zinc | Every shadcn site uses zinc and looks the same. Stone tones say "Caribbean" without being loud. |
| 2026-03-27 | Keep red-600 as primary accent | PR flag recognition, already established in brand, bold and confident |
| 2026-03-27 | Deep ocean blue as secondary | Replaces arbitrary blue-900. Creates red+blue color story tied to geography (coast) and flag. Used for sponsor blocks and dark CTAs. |
| 2026-03-27 | DM Sans for body text | Clean, warm, proven Spanish rendering. Same as mastiempo.net — consistency across Angel's products. |
| 2026-03-27 | Geist retained for data only | Good tabular-nums support for prices, stats, ratings. Not used for body or headlines. |
