# Clay-Style Design Spec (Premium Agency Landing)

## Goals
- High-end, minimal, editorial feel
- Strong typographic hierarchy
- Lots of negative space
- Smooth motion + subtle interaction
- Focus on case studies + outcomes

---

## Typography

### Font pairing
- Primary (UI / body): modern grotesk / neo-grotesk sans (examples: Inter, Neue Haas Grotesk, Söhne, General Sans)
- Display (optional): slightly more character for headlines (examples: Neue Montreal, PP Neue Machina for accent headings)

### Scale (desktop)
- H1: 56–72px, 1.0–1.1 line-height, tracking -0.02em
- H2: 40–48px, 1.1–1.2, tracking -0.02em
- H3: 28–32px, 1.2–1.3
- Body: 16–18px, 1.6–1.8
- Small: 13–14px, 1.5–1.7
- Button/Label: 13–14px, 1.0–1.2, tracking 0.02–0.06em, uppercase optional

### Scale (mobile)
- H1: 34–40px
- H2: 26–30px
- Body: 16px

### Rules
- Headlines: tighter tracking, heavier weight (500–700)
- Body: normal weight (400–500), generous line-height
- Use “quiet” text color for paragraphs (not pure black)

---

## Color System

### Base palette
- Background: near-white or near-black (pick one)
- Primary text: near-black (e.g., #0B0D12) or near-white
- Secondary text: 60–75% opacity of primary
- Borders: very low-contrast (8–12% opacity)

### Accent usage
- One accent color max (used for links, small highlights, pills)
- Gradients only when tied to visuals (hero art, highlights), not everywhere

---

## Layout & Grid

### Container
- Max width: 1120–1240px
- Gutters: 24px mobile, 48–80px desktop
- Section padding: 88–120px desktop, 56–72px mobile

### Grid
- Use a simple 12-col grid
- Case studies: 2-col or 3-col cards with consistent heights

### Rhythm
- Large gaps between sections (Clay feel = “room to breathe”)
- Headlines sit close to subhead; paragraphs have longer spacing

---

## Components

### Header / Nav
- Minimal nav items: Work, Services, About, Blog, Contact
- CTA: “Let’s talk” / “Contact”
- Sticky nav optional, subtle background blur on scroll

### Hero
- One strong headline + short subhead
- Optional: marquee client logos
- Visual: large image or muted animation block

### Case Study Cards (signature)
- Large thumbnail, brand mark overlay
- Title + 1–2 line description
- Tag chips for industry/services
- Hover: image scale 1.02, slight shadow, underline title

Card specs:
- Radius: 16–24px
- Border: 1px low-contrast
- Padding: 20–28px

### Tags / Chips
- Rounded pill
- Small text (13px)
- Subtle background fill

### Section Pattern (common)
- Eyebrow label (small uppercase) + big heading + short paragraph
- Then grid of cards or a split image/text

### Footer
- Multi-column links
- Locations
- Social
- Email + phone

---

## Motion

### Principles
- Subtle, not flashy
- Use scroll reveal, parallax-lite, and hover micro-interactions

### Timing
- 180–240ms for hover
- 400–700ms for section reveals
- Easing: cubic-bezier(0.2, 0.8, 0.2, 1)

### Patterns
- Fade + translateY 8–16px on reveal
- Card hover: translateY -2px + shadow
- Image hover: scale 1.02

---

## Imagery & Visual Style
- Large, clean screenshots
- Brand logos used sparingly
- If using illustrations: soft gradients, subtle noise
- Avoid busy patterns; keep backgrounds calm

---

## Content Style
- Short, confident sentences
- Outcome-driven bullets:
  - “Reduced time-to-X by Y%”
  - “Improved conversion by Z%”
- Use numbers frequently

---

## SEO + Accessibility
- One H1 per page
- Use semantic sections + headings
- Contrast ratio AA at minimum
- Motion respects prefers-reduced-motion

---

## Implementation Notes (Next.js + Tailwind)
- Use CSS variables for typography + colors
- Use `clamp()` for responsive type
- Preload fonts, `font-display: swap`
- Prefer `backdrop-blur` + translucent nav bg