# SEOIntel Blog Engine — Implementation Plan

> **Project**: AI-powered, location-specific blog generation platform  
> **First Customer**: caseintel.io  
> **Tech Stack**: Next.js 14 + TypeScript + Prisma + PostgreSQL + Anthropic Claude + Framer Motion  
> **Design Style**: Clay-inspired premium agency aesthetic

---

## Overview

Building a white-label SaaS that generates SEO-optimized, city-specific blog content using AI. Each article is enriched with real local data (demographics, legal stats, economic data) so Google sees genuinely unique content, not just city name swaps.

**The Clever Pattern**: One topic × multiple cities = multiple unique articles that rank separately in Google.

---

## Phase 1: Foundation & Core Generation (MVP for caseintel.io)

**Goal**: Get caseintel.io publishing location-specific legal blog content within 4-6 weeks.

### 1.1 Project Setup & Database (Week 1)

**Tasks**:
- [ ] Initialize Next.js 14 project with TypeScript + App Router
- [ ] Install dependencies (Prisma, Anthropic SDK, NextAuth, Tailwind, shadcn/ui)
- [ ] Set up PostgreSQL database (local Docker + production on Vercel/Supabase)
- [ ] Implement Prisma schema (all tables from spec)
- [ ] Create database migrations
- [ ] Build seed file with 50 US cities (hardcoded data for top 15, basic data for rest)
- [ ] Seed default caseintel tenant + 5 legal topics
- [ ] Set up environment variables (.env.example)

**Deliverables**:
- Working database with seeded cities, tenant, and topics
- Prisma client configured and tested
- All tables created with proper relationships

---

### 1.2 Authentication & Admin Layout (Week 1-2)

**Tasks**:
- [ ] Configure NextAuth.js v5 with Prisma adapter
- [ ] Implement email/password authentication
- [ ] Add tenant context to session JWT
- [ ] Create middleware to protect /admin routes
- [ ] Build admin layout with sidebar navigation
- [ ] Implement responsive sidebar (desktop full, mobile hamburger)
- [ ] Create admin header with tenant name + user avatar
- [ ] Set up shadcn/ui components (Button, Input, Card, Badge, Dialog, etc.)

**Deliverables**:
- Login page with working authentication
- Protected admin dashboard with navigation
- Clean, responsive admin UI shell

---

### 1.3 Topic & City Management (Week 2)

**Tasks**:
- [ ] Build Topic Manager page (`/admin/topics`)
  - [ ] Topic tag input component (bubble/chip UI)
  - [ ] Add/remove topics with keyboard shortcuts
  - [ ] Display article count per topic
  - [ ] API routes: GET/POST/DELETE topics
- [ ] Build City Selector page (`/admin/cities`)
  - [ ] Searchable city grid with toggle selection
  - [ ] City data preview panel (population, demographics, legal data)
  - [ ] Selected cities display as chips
  - [ ] API routes: GET cities, POST/DELETE tenant-cities

**Deliverables**:
- Working topic management with Twitter/X-style chip selector
- City selection interface with data preview
- Tenant can configure which cities to target

---

### 1.4 AI Integration & Content Generation (Week 2-3)

**Tasks**:
- [ ] Set up Anthropic Claude client
- [ ] Implement article generation prompt template
- [ ] Build article generation function with city data enrichment
- [ ] Create single article generation API (`POST /api/ai/generate-article`)
- [ ] Test article generation with real city data
- [ ] Implement markdown parsing and word count calculation
- [ ] Add slug generation with uniqueness check
- [ ] Store generated articles with REVIEW status

**Deliverables**:
- Working AI article generation for single topic + city
- Generated articles include city-specific data naturally woven in
- Articles saved to database with proper metadata

---

### 1.5 Batch Article Generator (Week 3-4)

**Tasks**:
- [ ] Build Article Generator page (`/admin/generate`)
  - [ ] Step 1: Topic selector (dropdown + custom input)
  - [ ] Step 2: City multi-select (max 8, gray out existing combos)
  - [ ] Step 3: Optional custom instructions textarea
  - [ ] Step 4: Preview panel showing what will be generated
  - [ ] Generate button with article count display
- [ ] Implement batch generation API (`POST /api/ai/generate-batch`)
  - [ ] Create GenerationBatch record
  - [ ] Sequential generation (one city at a time)
  - [ ] Progress tracking per city
  - [ ] Error handling with retry capability
- [ ] Build real-time progress UI
  - [ ] Poll batch status every 3 seconds
  - [ ] Show per-city progress (queued → generating → complete)
  - [ ] Display word count and view link when complete
- [ ] Add deduplication checks (prevent duplicate topic + city combos)

**Deliverables**:
- Full batch generation workflow: 1 topic × N cities → N unique articles
- Real-time progress tracking UI
- Proper error handling and retry logic

---

### 1.6 Article Management & Editor (Week 4)

**Tasks**:
- [ ] Build Article List page (`/admin/articles`)
  - [ ] Filterable table (status, topic, city, search)
  - [ ] Inline actions: Edit, Preview, Publish, Archive, Delete
  - [ ] Pagination
- [ ] Build Article Editor page (`/admin/articles/[id]`)
  - [ ] Split pane: markdown editor (left) + live preview (right)
  - [ ] Editor toolbar (bold, italic, headings, links, images)
  - [ ] SEO fields sidebar (meta title with char count, meta description)
  - [ ] Status selector
  - [ ] Featured image URL input
  - [ ] Auto-save every 30 seconds
  - [ ] Publish button
  - [ ] Regenerate button (re-run AI with optional new instructions)
- [ ] Implement article update API (`PATCH /api/v1/articles/[id]`)
- [ ] Implement publish API (`POST /api/v1/articles/[id]/publish`)

**Deliverables**:
- Article management interface with filtering and search
- Full-featured article editor with live preview
- Publish workflow that sets status and triggers ISR revalidation

---

### 1.7 Public Blog Frontend (Week 5)

**Tasks**:
- [ ] Build blog layout (`/app/(blog)/layout.tsx`)
  - [ ] Clean reading experience with Clay-inspired design
  - [ ] Blog header and footer
- [ ] Build blog index page (`/blog/page.tsx`)
  - [ ] Paginated article list (12 per page)
  - [ ] Article cards with featured image, title, excerpt, topic/city badges
  - [ ] Filter by topic and city
- [ ] Build article page (`/blog/[slug]/page.tsx`)
  - [ ] Server component with ISR (revalidate every hour)
  - [ ] Dynamic metadata for SEO (title, description, OG tags)
  - [ ] JSON-LD structured data (Article + BreadcrumbList)
  - [ ] Breadcrumbs component
  - [ ] Article header (title, date, topic, city badges)
  - [ ] Article content renderer (react-markdown with plugins)
  - [ ] Table of contents (auto-generated from headings)
  - [ ] Related articles section
- [ ] Build topic archive page (`/blog/topics/[topic]/page.tsx`)
- [ ] Build city archive page (`/blog/cities/[city]/page.tsx`)
- [ ] Implement dynamic sitemap (`/sitemap.ts`)

**Deliverables**:
- Fully functional public blog with SEO optimization
- Article pages with proper metadata and structured data
- Topic and city archive pages
- Dynamic sitemap for search engines

---

### 1.8 Dashboard & Settings (Week 5-6)

**Tasks**:
- [ ] Build Dashboard page (`/admin/dashboard`)
  - [ ] Stats cards (total articles, pipeline count, topics, cities)
  - [ ] Recent activity list
  - [ ] Quick action buttons
- [ ] Build Settings page (`/admin/settings`)
  - [ ] Business profile section (name, website URL, description)
  - [ ] Branding section (logo URL, color pickers)
  - [ ] Blog configuration (title, tagline, articles per page)
- [ ] Implement settings update API

**Deliverables**:
- Admin dashboard with key metrics
- Settings page for tenant configuration

---

### 1.9 Polish & Launch Prep (Week 6)

**Tasks**:
- [ ] Apply Clay-inspired design system across all pages
  - [ ] Typography scale (56-72px headlines, generous line-height)
  - [ ] Color system (near-white bg, near-black text, subtle borders)
  - [ ] Spacing and rhythm (88-120px section padding)
  - [ ] Component styling (rounded cards, subtle shadows)
- [ ] Add Framer Motion animations
  - [ ] Fade + translateY on scroll reveals
  - [ ] Card hover effects (translateY -2px + shadow)
  - [ ] Smooth page transitions
- [ ] Implement loading states and skeletons
- [ ] Add error boundaries and user-friendly error messages
- [ ] Test all workflows end-to-end
- [ ] Performance optimization (image optimization, code splitting)
- [ ] SEO audit (meta tags, structured data, sitemap)
- [ ] Deploy to Vercel with production database

**Deliverables**:
- Polished, production-ready application
- Clay-inspired design fully implemented
- Smooth animations and interactions
- Deployed and accessible at caseintel.io/blog

---

## Phase 2: Data Enrichment & Advanced Features (Post-MVP)

**Goal**: Enhance content quality with real-time city data and add power-user features.

### 2.1 City Data Enrichment (Week 7-8)

**Tasks**:
- [ ] Integrate Census API for demographics and population data
- [ ] Integrate BLS API for economic data (unemployment, wages, cost of living)
- [ ] Build city data enrichment orchestrator
- [ ] Implement data refresh cron job (monthly via Vercel Cron)
- [ ] Add "Refresh Data" button in City Selector
- [ ] Update article generation prompts to use enriched data

**Deliverables**:
- Real-time city data from Census and BLS APIs
- Automated monthly data refresh
- Articles enriched with current, accurate city statistics

---

### 2.2 Idea Generation Workflow (Week 8)

**Tasks**:
- [ ] Build Ideas page (`/admin/ideas`)
  - [ ] Generate ideas for topic + cities
  - [ ] Display idea cards with title, outline, keywords
  - [ ] Accept/reject actions
  - [ ] Generate article from accepted idea
- [ ] Implement idea generation API (`POST /api/ai/generate-ideas`)
- [ ] Implement idea management APIs (accept, reject, generate from idea)

**Deliverables**:
- Optional brainstorming workflow before full article generation
- AI-suggested article angles and outlines

---

### 2.3 Website Analysis & Topic Suggestions (Week 9)

**Tasks**:
- [ ] Build website scraper/analyzer
- [ ] Implement website analysis prompt for Claude
- [ ] Add "Analyze Website" button in Settings
- [ ] Display AI-extracted business context
- [ ] Add "Suggest Topics" button in Topic Manager
- [ ] Generate topic suggestions based on business context

**Deliverables**:
- AI analyzes tenant website and extracts business context
- AI suggests relevant topics based on business type

---

### 2.4 Advanced Editor Features (Week 9-10)

**Tasks**:
- [ ] Add internal link suggestion system
- [ ] Implement "Regenerate Section" feature (highlight paragraph → regenerate)
- [ ] Add quality checklist sidebar (city data count, meta length, word count)
- [ ] Implement A/B title testing (generate multiple title variants)
- [ ] Add content scheduling (publish at specific date/time)

**Deliverables**:
- Enhanced editor with AI-powered editing tools
- Quality assurance features to prevent thin content

---

## Phase 3: White-Label SaaS (Future)

**Goal**: Open platform to multiple customers with multi-tenant architecture.

### 3.1 Multi-Tenant Infrastructure

**Tasks**:
- [ ] Implement hostname-based tenant resolution
- [ ] Add custom domain support (Vercel Domains API)
- [ ] Build tenant onboarding flow
- [ ] Implement Stripe billing integration
- [ ] Add API key management for programmatic access
- [ ] Build public Content API (`/api/v1/content/*`)

---

### 3.2 Analytics & Optimization

**Tasks**:
- [ ] Integrate Google Search Console API
- [ ] Build analytics dashboard (traffic, rankings, CTR)
- [ ] Add keyword tracking
- [ ] Implement A/B testing for titles and meta descriptions

---

### 3.3 Bulk Operations & Templates

**Tasks**:
- [ ] Bulk generation mode (10 topics × 20 cities = 200 articles)
- [ ] Article template system (reusable structures)
- [ ] Batch editing (update meta descriptions across multiple articles)
- [ ] Content calendar view

---

## Technical Decisions

### Why Framer Motion over other animation libraries?
- Best-in-class React animation library
- Declarative API matches Next.js component model
- Excellent performance with layout animations
- Perfect for Clay-style subtle interactions

### Why Not Strapi?
- Our admin dashboard IS the CMS
- No need for a separate headless CMS layer
- Simpler architecture, fewer moving parts
- Direct database access in server components is faster

### Database Choice: PostgreSQL
- JSONB for flexible city data storage
- Excellent full-text search capabilities
- Mature ecosystem with Prisma
- Easy to scale on Vercel/Supabase

---

## Success Metrics (Phase 1)

- [ ] Generate 50+ location-specific articles for caseintel.io
- [ ] Each article 1,500-2,000 words with 3+ city-specific data points
- [ ] All articles pass SEO checklist (meta tags, structured data, etc.)
- [ ] Admin can generate 8 articles in under 10 minutes
- [ ] Blog pages load in under 2 seconds (Lighthouse 90+)
- [ ] Zero duplicate content penalties from Google

---

## Next Steps

1. **Review this plan** — confirm phases and priorities
2. **Start Phase 1.1** — set up project and database
3. **Iterate weekly** — ship working features every week
4. **Launch MVP** — get caseintel.io publishing within 6 weeks

Ready to start Phase 1.1?
