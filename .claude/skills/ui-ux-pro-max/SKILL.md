---
name: ui-ux-pro-max
description: AI skill that provides design intelligence for building professional UI/UX across multiple platforms. Includes 50+ design styles, 161 color palettes, 57 font pairings, 99 UX guidelines, 25 chart types, and support for 10+ tech stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, HTML/Tailwind, shadcn/ui). Use when designing websites, landing pages, dashboards, mobile apps, or any UI/UX project. Features AI-powered Design System Generator that analyzes requirements and generates complete design systems in seconds.
compatibility: Claude Code, Cursor, Windsurf, Kiro, GitHub Copilot, Roo Code, KiloCode
---

# UI/UX Pro Max — AI Design Intelligence Skill

## What This Does

AI-powered design intelligence toolkit for building professional UI/UX across all platforms.

**Problem:** Design decisions take time. Style consistency is hard. Cross-platform coordination is complex.

**Solution:** AI analyzes your project. Generates complete design system. Provides style recommendations. Implements with best practices.

## Core Features

### 1. Design System Generator

AI-powered reasoning engine that analyzes project requirements and generates complete design system in seconds.

```bash
python3 search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
```

**Output:**
- Color palette (primary, secondary, accent, neutral, semantic)
- Typography system (font pairing, sizes, weights, line heights)
- Component library (button, card, modal, form styles)
- Layout patterns (spacing, grid, responsive breakpoints)
- Visual style (glassmorphism, minimalism, etc.)

### 2. Design System Persistence

Save design systems for hierarchical retrieval across sessions:

```bash
python3 search.py "<query>" --design-system --persist -p "Project Name"
```

Creates `design-system/MASTER.md` with:
- Master styles (authoritative source)
- Override patterns (project-specific adjustments)
- Component specs (exact measurements, spacing, colors)

### 3. Smart Recommendations

Based on product type, industry, and requirements, finds best matching:
- Design styles
- Color palettes
- Font pairings
- Layout patterns
- Component patterns

## Design Styles (50+)

Choose from vetted design approaches:

| Style | Best For | Characteristics |
|-------|----------|-----------------|
| **Glassmorphism** | Modern, premium feel | Frosted glass, transparency |
| **Minimalism** | Clean, focused experience | Whitespace, simple shapes |
| **Brutalism** | Bold, authentic brands | Raw materials, honesty |
| **Neumorphism** | Soft, intuitive interface | Subtle shadows, sculpted |
| **Bento Grid** | Content-rich layouts | Organized grid, varied sizes |
| **Dark Mode** | Eye comfort, modern | Inverted colors, proper contrast |
| **Skeuomorphism** | Familiar, intuitive | Real-world metaphors |
| **Flat Design** | Timeless, clear UI | No depth, bold colors |

Plus 40+ more styles for every brand personality.

## Color Palettes (161)

Pre-designed color systems including:

**By Industry:**
- Tech & SaaS (blues, purples, grays)
- Healthcare (greens, blues, warmth)
- E-commerce (vibrant, energetic)
- Finance (trust-based, conservative)
- Creative (bold, expressive)

**By Mood:**
- Professional (corporate, trustworthy)
- Playful (fun, energetic)
- Minimal (simple, clean)
- Warm (friendly, approachable)
- Cool (modern, sophisticated)

Each palette includes:
- Primary color
- Secondary accent
- Neutral gray scale
- Semantic colors (success, error, warning, info)
- Accessible contrast ratios (WCAG AA+)

## Font Pairings (57)

Curated typography combinations:

**Popular Pairings:**
- Montserrat + Open Sans (modern, clean)
- Playfair Display + Inter (elegant, readable)
- Sora + Geist (contemporary, tech)
- Outfit + Poppins (bold, friendly)
- IBM Plex Serif + IBM Plex Sans (professional)

Each pairing includes:
- Font weights (regular, medium, semibold, bold)
- Recommended sizes (h1, h2, h3, body, caption)
- Line heights for readability
- Letter spacing guidelines
- Accessibility notes

## Component Styles

Pre-built component specifications for:

| Category | Components |
|----------|-----------|
| **Navigation** | Navbar, sidebar, breadcrumbs, tabs |
| **Forms** | Input, select, checkbox, radio, toggle |
| **Feedback** | Button, alert, toast, badge, tag |
| **Layout** | Card, modal, dialog, drawer, tooltip |
| **Data** | Table, list, grid, pagination |
| **Media** | Image, avatar, icon, gallery |

Each component includes:
- Visual design specs
- Interaction states (hover, active, disabled, error)
- Responsive behavior
- Accessibility requirements
- Animation guidelines

## Tech Stack Support (10+)

### Web
- **React** — Hooks, state, component patterns
- **Next.js** — Server/client components, layouts
- **Vue 3** — Composition API, store
- **Svelte** — Reactive declarations
- **HTML/Tailwind** — Utility-first CSS
- **ShadCN/UI** — Composable components

### Mobile
- **React Native** — iOS & Android
- **Flutter** — Dart-based UI
- **SwiftUI** — iOS apps
- **Jetpack Compose** — Android UI

Each stack gets:
- Component implementation examples
- Best practice patterns
- Responsive design patterns
- Performance optimization tips

## UX Guidelines (99)

Comprehensive best practices covering:

### Accessibility
- WCAG 2.1 Level AA compliance
- Color contrast requirements
- Keyboard navigation
- Screen reader support
- Focus management

### Interaction Design
- Button sizes and spacing
- Click targets (minimum 44px)
- Hover states
- Loading patterns
- Error messages
- Confirmation dialogs

### Layout & Spacing
- 8px/16px grid system
- Safe spacing rules
- Responsive breakpoints
- Mobile-first approach
- Touch-friendly sizing

### Typography
- Reading line length (50-75 characters)
- Font size progression
- Line height ratios
- Heading hierarchy
- Text contrast

### Animation
- Micro-interactions (200-500ms)
- Transition curves (easing)
- Loading indicators
- Skeleton screens
- Page transitions

## Chart Types (25)

Pre-styled visualizations for data:

- Bar charts
- Line charts
- Pie & donut charts
- Area charts
- Scatter plots
- Heatmaps
- Candlestick charts
- Gauge charts
- Funnel charts
- Sankey diagrams

Each chart includes:
- Color scheme matching design system
- Responsive sizing
- Accessibility labels
- Annotation patterns
- Export capabilities

## Installation

### Option 1: Claude Code Marketplace
```
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

### Option 2: Manual Installation
```bash
git clone https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git
# Extract to your project's .claude/skills/ui-ux-pro-max/
```

### Option 3: Init Command
```bash
uipro init --ai claude
```

## Usage

### 1. Generate Design System

```bash
python3 search.py "SaaS product management tool" --design-system -p "ProjectHub"
```

Creates complete design system tailored to your product.

### 2. Search Design Patterns

```bash
python3 search.py "data dashboard" --domain "analytics"
```

Finds best matching styles, colors, components for your use case.

### 3. Get Style Recommendations

```bash
python3 search.py "modern tech startup" --color-palette --fonts
```

Gets color palette and font pairing suggestions.

### 4. Build with Design System

```
I'm building the dashboard page. Please read design-system/MASTER.md.
Generate the dashboard layout with the design system colors and typography.
```

Claude reads your design system and implements with consistency.

## Real-World Examples

### Example 1: SaaS Landing Page

**Request:**
```
Build a landing page for a project management SaaS
```

**System generates:**
- Modern, professional style (suitable for enterprise)
- Blue + purple color palette (trust + innovation)
- Clear typography hierarchy
- Component specs for hero, features, pricing, CTA
- Responsive design for mobile

**Output:**
- Figma-ready design specs
- React/Next.js implementation
- Tailwind CSS
- Responsive breakpoints

### Example 2: Fintech App

**Request:**
```
Design a banking app with dark theme, modern feel
```

**System generates:**
- Minimalist + dark mode style
- Teal + dark gray palette (modern finance)
- Typography for readability
- Component specs (transaction list, transfer form, cards)
- Mobile-first design

**Output:**
- SwiftUI specs (iOS)
- Jetpack Compose (Android)
- Dark mode colors
- Accessibility compliance

### Example 3: Creative Portfolio

**Request:**
```
Portfolio website for freelance designer, bold and creative
```

**System generates:**
- Glassmorphism + bento grid style
- Bold accent colors
- Creative typography pairing
- Portfolio gallery specs
- Contact form design

**Output:**
- Next.js implementation
- Tailwind CSS
- Interactive animations
- Mobile responsive

## Design System Structure

Generated `design-system/MASTER.md` includes:

```markdown
# Design System - Project Name

## Color Palette
- Primary: #3B82F6
- Secondary: #8B5CF6
- Accent: #EC4899
- Neutral: Gray scale

## Typography
- Display: Playfair Display (font-size, weight, line-height)
- Heading: Inter (font-size, weight, line-height)
- Body: Inter (font-size, weight, line-height)
- Caption: Inter (font-size, weight, line-height)

## Spacing
- Base unit: 8px
- Padding: 8px, 16px, 24px, 32px
- Gap: 8px, 16px, 24px, 32px

## Components
- Button specs (sizes, states, colors)
- Card specs (padding, shadow, border)
- Form specs (input, label, error states)
- Navigation specs (navbar, sidebar, breadcrumbs)

## Layout
- Breakpoints (mobile, tablet, desktop)
- Grid system (12 columns)
- Safe areas, gutters

## Animation
- Transition timing (200ms, 300ms, 500ms)
- Easing functions (ease-in-out, ease-out)
```

## Pro Tips

### 1. Start with Design System
Generate complete system before building anything. It guides all decisions.

### 2. Use --persist for Consistency
Save design system so every page/component follows same spec.

### 3. Layer for Flexibility
Master styles + project overrides = consistency + flexibility.

### 4. Reference in Prompts
Always mention design system: "Build this using design-system/MASTER.md"

### 5. Validate Before Building
Generate system, review it, adjust, then build.

## Integration

**Works great with:**
- **Frontend Design Skill** — Complements UI implementation
- **Code Simplifier** — Keeps design code clean
- **Context7** — Gets component documentation
- **Superpowers** — Design system in planning phase

## Stats

- **50+ design styles**
- **161 color palettes**
- **57 font pairings**
- **99 UX guidelines**
- **25 chart types**
- **10+ tech stacks**
- **Active maintenance** (v2.1.1+)
- **65k GitHub stars**

## Commands

### Search & Generate
```bash
# Generate complete design system
python3 search.py "<product_type> <industry>" --design-system -p "Name"

# Search styles for specific domain
python3 search.py "<query>" --domain "domain_name"

# Get color palettes for product type
python3 search.py "<query>" --color-palette

# Get font pairings
python3 search.py "<query>" --fonts
```

### Persistence
```bash
# Save design system for reuse
python3 search.py "<query>" --design-system --persist -p "Name"

# Add page-specific overrides
python3 search.py "<query>" --design-system --persist -p "Name" --page "dashboard"
```

## Resources

- **GitHub:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- **Marketplace:** Claude Code plugin marketplace
- **Creator:** NextLevelBuilder

## Philosophy

> "Every project deserves professional design. AI should make that easy and fast."

This skill automates design decisions. Ensures consistency. Speeds up implementation.

---

**GitHub:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

**Install:** Via Claude Code marketplace or manual

**Powers:** Professional UI/UX across all platforms

---

**50+ styles. 161 colors. 57 fonts. One command.**
