# CaseIntel Blog Engine — Full Build Specification

> **Purpose**: This document is a complete specification for building a white-label, AI-powered blog generation platform. The first customer is caseintel.io. Drop this into Cursor and build iteratively section by section.

---

## 1. Product Overview

### What This Is
A SaaS platform that lets businesses generate SEO-optimized, location-specific blog content using AI. Inspired by Clever Real Estate's strategy of indexing the same topic across dozens of cities (e.g., "How to Sell a House By Owner in New York" / "...in Pennsylvania" / "...in Texas") — each with genuinely unique, data-enriched content so Google indexes them as separate, valuable pages.

### The Clever Pattern (What We're Replicating)
Clever had ~5 blog templates on the same topic, each localized to a different city/state. The key insight: they didn't just find-and-replace the city name. Each article wove in real local data — state laws, local market statistics, regional costs, local court/legal references — so that the Phoenix version genuinely reads differently from the Austin version. Google's Helpful Content Update specifically penalizes lazy location swaps, so real data enrichment is critical.

### First Customer: caseintel.io
CaseIntel is a legal tech product. The blog will live at `caseintel.io/blog/` (subdirectory, not subdomain — better for SEO link equity). Topics will be legal-focused: personal injury statistics, how to file claims, lawyer hiring guides, case study breakdowns — all localized per city.

### White-Label Vision (Phase 2)
Any business can sign up, configure their topics + target cities, and generate location-specific blog content for their own domain. Multi-tenant from day one in the database, but single-tenant UX for Phase 1.

---

## 2. Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Framework** | Next.js 14+ (App Router) | SSR/SSG critical for SEO; API routes for white-label API; React for admin |
| **Language** | TypeScript | Type safety across the full stack |
| **Database** | PostgreSQL | Multi-tenant with `tenant_id`; JSONB for flexible city data |
| **ORM** | Prisma | Type-safe queries, migrations, good DX with Next.js |
| **Auth** | NextAuth.js (Auth.js v5) | Multi-tenant auth with tenant context in session |
| **AI** | Anthropic Claude API (`@anthropic-ai/sdk`) | Content generation + idea generation |
| **Cache** | Redis (via Upstash) | Cache generated content, rate limiting API |
| **Styling** | Tailwind CSS + shadcn/ui | Fast admin dashboard development |
| **Markdown** | `react-markdown` + `remark-gfm` | Render article content stored as markdown |
| **Deployment** | Vercel | Perfect for Next.js, edge functions, custom domains later |
| **City Data** | Census API, BLS API, custom data | Real location-specific data for content enrichment |

### Package.json Dependencies
```json
{
  "name": "caseintel-blog",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "@prisma/client": "^5.20.0",
    "next-auth": "^5.0.0-beta.25",
    "@auth/prisma-adapter": "^2.7.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "rehype-highlight": "^7.0.0",
    "rehype-slug": "^6.0.0",
    "slugify": "^1.6.6",
    "zod": "^3.23.0",
    "@upstash/redis": "^1.34.0",
    "@upstash/ratelimit": "^2.0.0",
    "lucide-react": "^0.400.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "prisma": "^5.20.0",
    "tsx": "^4.19.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0"
  }
}
```

---

## 3. Database Schema (Prisma)

Create this as `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTH TABLES (managed by NextAuth)
// ============================================

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // hashed, for email/password auth
  tenantId      String
  role          UserRole  @default(ADMIN)
  accounts      Account[]
  sessions      Session[]
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([provider, providerAccountId])
}

model Session {
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@id([identifier, token])
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  EDITOR
  VIEWER
}

// ============================================
// MULTI-TENANT CORE
// ============================================

model Tenant {
  id                  String         @id @default(cuid())
  name                String         // e.g., "CaseIntel"
  slug                String         @unique // e.g., "caseintel" — used in routing
  domain              String?        // custom domain, nullable (e.g., "caseintel.io")
  websiteUrl          String?        // their main site URL for AI to analyze
  businessDescription String?        @db.Text // free-text context about the business
  businessContext     Json?          // AI-extracted context from website analysis
  logoUrl             String?
  brandColors         Json?          // { primary: "#hex", secondary: "#hex", accent: "#hex" }
  planTier            PlanTier       @default(FREE)
  users               User[]
  topics              Topic[]
  tenantCities        TenantCity[]
  articles            Article[]
  articleIdeas        ArticleIdea[]
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
}

enum PlanTier {
  FREE
  PRO
  ENTERPRISE
}

// ============================================
// TOPICS — the "bubble/chip" tag system
// ============================================

model Topic {
  id           String        @id @default(cuid())
  tenantId     String
  name         String        // e.g., "Personal Injury", "Home Buying"
  slug         String        // e.g., "personal-injury"
  description  String?       // optional description of this topic area
  isCustom     Boolean       @default(true) // user-created vs AI-suggested
  tenant       Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  articles     Article[]
  articleIdeas ArticleIdea[]
  createdAt    DateTime      @default(now())

  @@unique([tenantId, slug])
  @@index([tenantId])
}

// ============================================
// CITIES — shared across tenants, enriched with real data
// ============================================

model City {
  id              String       @id @default(cuid())
  name            String       // e.g., "Phoenix"
  state           String       // e.g., "Arizona"
  stateCode       String       // e.g., "AZ"
  slug            String       @unique // e.g., "phoenix-az"
  population      Int?
  metroPopulation Int?
  metroData       Json?        // { costOfLiving: 95.2, medianIncome: 62000, ... }
  legalData       Json?        // { totalCourts: 12, avgSettlement: 45000, firmCount: 340, ... }
  economicData    Json?        // { majorEmployers: [...], unemploymentRate: 3.2, ... }
  demographics    Json?        // { medianAge: 34, ... }
  lastDataRefresh DateTime?
  tenantCities    TenantCity[]
  articles        Article[]
  articleIdeas    ArticleIdea[]
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([stateCode])
}

// Junction table: which cities each tenant targets
model TenantCity {
  tenantId  String
  cityId    String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  city      City     @relation(fields: [cityId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@id([tenantId, cityId])
  @@index([tenantId])
  @@index([cityId])
}

// ============================================
// ARTICLE IDEAS — AI-generated suggestions
// ============================================

model ArticleIdea {
  id               String      @id @default(cuid())
  tenantId         String
  topicId          String
  cityId           String?     // nullable if idea is not city-specific
  suggestedTitle   String
  suggestedOutline Json?       // [{ heading: "...", bullets: ["...", "..."] }, ...]
  seoKeywords      String[]    // target keywords
  estimatedVolume  Int?        // estimated monthly search volume
  status           IdeaStatus  @default(SUGGESTED)
  articleId        String?     @unique // links to generated article if accepted
  tenant           Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  topic            Topic       @relation(fields: [topicId], references: [id], onDelete: Cascade)
  city             City?       @relation(fields: [cityId], references: [id])
  article          Article?    @relation(fields: [articleId], references: [id])
  createdAt        DateTime    @default(now())

  @@index([tenantId, status])
  @@index([tenantId, topicId])
}

enum IdeaStatus {
  SUGGESTED
  ACCEPTED
  REJECTED
  GENERATED
}

// ============================================
// ARTICLES — the core content
// ============================================

model Article {
  id                String        @id @default(cuid())
  tenantId          String
  topicId           String
  cityId            String?       // nullable for non-location articles
  title             String
  slug              String
  content           String        @db.Text // markdown content
  metaTitle         String?       // SEO title tag (max 60 chars)
  metaDescription   String?       // SEO meta description (max 160 chars)
  featuredImageUrl  String?
  status            ArticleStatus @default(DRAFT)
  wordCount         Int?
  readingTimeMin    Int?
  aiModelUsed       String?       // e.g., "claude-sonnet-4-5-20250929"
  aiPromptSnapshot  Json?         // the full prompt used, for reproducibility
  internalLinks     Json?         // suggested internal links to other articles
  publishedAt       DateTime?
  tenant            Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  topic             Topic         @relation(fields: [topicId], references: [id])
  city              City?         @relation(fields: [cityId], references: [id])
  idea              ArticleIdea?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@unique([tenantId, slug])
  @@unique([tenantId, topicId, cityId]) // prevent duplicate topic+city combos
  @@index([tenantId, status, publishedAt])
  @@index([tenantId, topicId])
  @@index([tenantId, cityId])
}

enum ArticleStatus {
  DRAFT
  REVIEW
  PUBLISHED
  ARCHIVED
}

// ============================================
// GENERATION BATCHES — track batch article generation
// ============================================

model GenerationBatch {
  id              String            @id @default(cuid())
  tenantId        String
  topicId         String
  instructions    String?           @db.Text // custom instructions for this batch
  status          BatchStatus       @default(IN_PROGRESS)
  totalArticles   Int
  completedCount  Int               @default(0)
  failedCount     Int               @default(0)
  batchItems      GenerationBatchItem[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([tenantId, status])
}

model GenerationBatchItem {
  id          String          @id @default(cuid())
  batchId     String
  cityId      String
  articleId   String?         // populated once article is generated
  status      BatchItemStatus @default(QUEUED)
  error       String?         // error message if failed
  batch       GenerationBatch @relation(fields: [batchId], references: [id], onDelete: Cascade)
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime        @default(now())

  @@index([batchId])
}

enum BatchStatus {
  IN_PROGRESS
  COMPLETE
  PARTIAL_FAILURE
}

enum BatchItemStatus {
  QUEUED
  GENERATING
  COMPLETE
  FAILED
}
```

---

## 4. Project File Structure

```
caseintel-blog/
├── .env                           # Environment variables (see section 5)
├── .env.example                   # Template for env vars
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── prisma/
│   ├── schema.prisma              # Full schema above
│   └── seed.ts                    # Seed 50 US cities with real data
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout — html, body, fonts
│   │   ├── page.tsx               # Landing page / redirect to admin
│   │   │
│   │   ├── (admin)/               # Route group for admin pages
│   │   │   ├── layout.tsx         # Admin layout — sidebar + header
│   │   │   └── admin/
│   │   │       ├── dashboard/
│   │   │       │   └── page.tsx   # Overview: article count, pipeline stats
│   │   │       ├── topics/
│   │   │       │   └── page.tsx   # Topic tag manager (bubble/chip UI)
│   │   │       ├── cities/
│   │   │       │   └── page.tsx   # City selector with data preview
│   │   │       ├── generate/
│   │   │       │   └── page.tsx   # ⭐ MAIN PAGE: batch article generator wizard
│   │   │       ├── ideas/
│   │   │       │   └── page.tsx   # Optional: brainstorm ideas before generating
│   │   │       ├── articles/
│   │   │       │   ├── page.tsx   # Article list with status filters
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx  # Article editor + preview
│   │   │       └── settings/
│   │   │           └── page.tsx   # Business context, branding, domain
│   │   │
│   │   ├── (blog)/                # Route group for public blog
│   │   │   ├── layout.tsx         # Blog layout — clean reading experience
│   │   │   └── blog/
│   │   │       ├── page.tsx       # Blog index — paginated article list
│   │   │       ├── [slug]/
│   │   │       │   └── page.tsx   # Individual article page (SSR/ISR)
│   │   │       ├── cities/
│   │   │       │   └── [city]/
│   │   │       │       └── page.tsx  # All articles for a city
│   │   │       └── topics/
│   │   │           └── [topic]/
│   │   │               └── page.tsx  # All articles for a topic
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts   # NextAuth API route
│   │   │   ├── ai/
│   │   │   │   ├── generate-batch/
│   │   │   │   │   └── route.ts   # POST — batch generate: 1 topic × N cities
│   │   │   │   ├── generate-batch/[batchId]/
│   │   │   │   │   └── route.ts   # GET — poll batch generation progress
│   │   │   │   ├── generate-article/
│   │   │   │   │   └── route.ts   # POST — single article generation/regeneration
│   │   │   │   ├── generate-ideas/
│   │   │   │   │   └── route.ts   # POST — brainstorm ideas (optional flow)
│   │   │   │   └── analyze-website/
│   │   │   │       └── route.ts   # POST — analyze tenant website for context
│   │   │   └── v1/                # Public API (for white-label phase)
│   │   │       ├── ideas/
│   │   │       │   └── route.ts   # GET list, POST generate
│   │   │       ├── articles/
│   │   │       │   ├── route.ts   # GET list
│   │   │       │   └── [id]/
│   │   │       │       └── route.ts  # GET, PATCH, POST publish
│   │   │       └── cities/
│   │   │           ├── route.ts   # GET list available cities
│   │   │           └── [id]/
│   │   │               └── route.ts  # GET city with enrichment data
│   │   │
│   │   └── sitemap.ts             # Dynamic sitemap generation
│   │
│   ├── components/
│   │   ├── admin/
│   │   │   ├── sidebar.tsx        # Admin navigation sidebar
│   │   │   ├── header.tsx         # Admin header with tenant name
│   │   │   ├── topic-tag-input.tsx   # Bubble/chip tag selector component
│   │   │   ├── city-selector.tsx     # City search + select component
│   │   │   ├── city-data-preview.tsx # Preview city enrichment data
│   │   │   ├── article-generator.tsx  # ⭐ Batch generation wizard (topic + cities → articles)
│   │   │   ├── generation-progress.tsx # Real-time batch progress tracker
│   │   │   ├── idea-card.tsx         # Article idea card with actions
│   │   │   ├── article-editor.tsx    # Markdown editor for articles
│   │   │   ├── article-preview.tsx   # Preview rendered article
│   │   │   ├── article-list.tsx      # Filterable article table
│   │   │   └── stats-card.tsx        # Dashboard stat cards
│   │   │
│   │   ├── blog/
│   │   │   ├── article-card.tsx      # Blog listing card
│   │   │   ├── article-content.tsx   # Rendered markdown article
│   │   │   ├── article-header.tsx    # Title, date, topic, city badges
│   │   │   ├── blog-header.tsx       # Blog site header
│   │   │   ├── blog-footer.tsx       # Blog footer
│   │   │   ├── breadcrumbs.tsx       # SEO breadcrumb navigation
│   │   │   ├── related-articles.tsx  # "More articles about [city/topic]"
│   │   │   └── table-of-contents.tsx # Auto-generated from headings
│   │   │
│   │   └── ui/                       # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── badge.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── select.tsx
│   │       ├── textarea.tsx
│   │       ├── tabs.tsx
│   │       ├── toast.tsx
│   │       └── skeleton.tsx
│   │
│   ├── lib/
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── auth.ts                # NextAuth configuration
│   │   ├── utils.ts               # cn() helper, slugify, etc.
│   │   ├── constants.ts           # App-wide constants
│   │   │
│   │   ├── ai/
│   │   │   ├── client.ts          # Anthropic SDK client setup
│   │   │   ├── prompts.ts         # All prompt templates (see section 8)
│   │   │   ├── generate-ideas.ts  # Idea generation logic
│   │   │   ├── generate-article.ts # Full article generation logic
│   │   │   └── analyze-website.ts  # Website scraping + AI analysis
│   │   │
│   │   └── city-data/
│   │       ├── enrichment.ts      # Orchestrate city data from all sources
│   │       ├── census.ts          # Census API connector
│   │       ├── bls.ts             # Bureau of Labor Statistics connector
│   │       └── legal.ts           # Legal-specific data sources
│   │
│   └── types/
│       └── index.ts               # Shared TypeScript types
│
├── public/
│   ├── images/
│   └── favicon.ico
│
└── README.md
```

---

## 5. Environment Variables

Create `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/caseintel_blog"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Anthropic AI
ANTHROPIC_API_KEY="sk-ant-..."

# Upstash Redis (optional for dev, required for prod)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# City Data APIs
CENSUS_API_KEY=""
BLS_API_KEY=""

# Default tenant for Phase 1
DEFAULT_TENANT_SLUG="caseintel"
```

---

## 6. Core Implementation Details

### 6.1 Prisma Client Singleton

`src/lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### 6.2 Auth Configuration

`src/lib/auth.ts` — NextAuth v5 config:
- Use Prisma adapter for session/account storage
- Email + password credentials provider (for Phase 1)
- Include `tenantId` and `role` in the session JWT
- Session callback injects tenant context so every authenticated request knows which tenant
- Middleware protects all `/admin/*` routes

### 6.3 Multi-Tenant Middleware

`src/middleware.ts`:
```typescript
// Phase 1: Simple — protect /admin routes, inject tenant from session
// Phase 2: Check request hostname → resolve tenant → inject into headers
// For now, use DEFAULT_TENANT_SLUG from env for the blog routes
```

### 6.4 Admin Layout

`src/app/(admin)/layout.tsx`:
- Sidebar navigation: Dashboard, Topics, Cities, Ideas, Articles, Settings
- Icons from lucide-react
- Header shows tenant name + user avatar
- Protected by auth middleware — redirect to login if unauthenticated
- Mobile responsive — sidebar collapses to hamburger menu

---

## 7. Admin Pages — Detailed Specifications

### 7.1 Topic Tag Manager (`/admin/topics`)

**UI Pattern**: Twitter/X interest selector — bubbles/chips that you can add, click to select, and remove.

**Behavior**:
1. Page loads showing all existing topics as colored chips/badges
2. Input field at top: type a topic name → press Enter or click "Add" → creates new topic chip
3. Each chip has an X button to delete the topic
4. Chips show: topic name + article count badge (e.g., "Personal Injury (12)")
5. "Suggest Topics" button → calls AI to analyze the tenant's website and suggest relevant topics
6. AI-suggested topics appear as outlined/dashed chips — click to accept, X to dismiss

**API Calls**:
- `GET /api/v1/topics` — list topics for tenant
- `POST /api/v1/topics` — create new topic `{ name: string }`
- `DELETE /api/v1/topics/:id` — remove topic
- `POST /api/ai/analyze-website` — analyze website and suggest topics

**Component**: `topic-tag-input.tsx`
- Uses React state for tag list
- Controlled input with keyboard handlers (Enter to add)
- Animated chip additions/removals (framer-motion or CSS transitions)
- Debounced search/filter as you type

### 7.2 City Selector (`/admin/cities`)

**UI Pattern**: Searchable grid of city cards with add/remove toggles.

**Behavior**:
1. Search bar at top — filters the city grid in real time
2. Cities displayed as cards in a responsive grid (3-4 columns)
3. Each card shows: city name, state, population, toggle button
4. Selected cities have a filled/highlighted toggle; unselected are outlined
5. Clicking a city card expands to show a "data preview" panel:
   - Population, cost of living index, median income
   - Legal data (if available): court count, firm count, avg settlement
   - "Last refreshed" timestamp
6. "Selected Cities" section at top shows all currently targeted cities as chips

**API Calls**:
- `GET /api/v1/cities` — list all available cities
- `POST /api/v1/tenant-cities` — add city to tenant `{ cityId: string }`
- `DELETE /api/v1/tenant-cities/:cityId` — remove city from tenant
- `GET /api/v1/cities/:id` — get full city enrichment data

### 7.3 Article Generator (`/admin/generate`) — THE CORE WORKFLOW

This is the main page users interact with. One topic → multiple cities → batch of unique articles.

**UI Pattern**: Step-by-step wizard / form with live preview of what will be generated.

**The Flow (what the user sees):**

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Choose a Topic                                     │
│  ┌──────────────────────────────────────────────────┐       │
│  │ Select a topic...                            ▼   │       │
│  └──────────────────────────────────────────────────┘       │
│  OR type a custom one-off topic: [________________]         │
│                                                             │
│  STEP 2: Select Cities (max 8)                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │✅Phoenix│ │✅Austin │ │✅Boston │ │  Dallas │         │
│  │  AZ     │ │  TX     │ │  MA     │ │  TX     │         │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │✅Philly │ │✅NYC   │ │ Chicago │ │ Seattle │         │
│  │  PA     │ │  NY     │ │  IL     │ │  WA     │         │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
│                                                             │
│  5 of 8 cities selected                                     │
│  ⚠️ 1 already has an article for this topic (grayed out)   │
│                                                             │
│  STEP 3: Customize (optional)                               │
│  [  Additional instructions or angle for the AI...       ]  │
│                                                             │
│  STEP 4: Preview What Will Be Generated                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ The following 5 articles will be generated:           │  │
│  │                                                       │  │
│  │ 1. how-ai-can-help-law-firms-in-philadelphia         │  │
│  │ 2. how-ai-can-help-law-firms-in-new-york             │  │
│  │ 3. how-ai-can-help-law-firms-in-boston                │  │
│  │ 4. how-ai-can-help-law-firms-in-austin               │  │
│  │ 5. how-ai-can-help-law-firms-in-phoenix              │  │
│  │                                                       │  │
│  │ Each article: ~1,500-2,000 words, unique city data    │  │
│  │ Estimated time: ~3-5 minutes                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [ 🚀 Generate 5 Articles ]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**After clicking "Generate":**
```
┌──────────────────────────────────────────────────────────────┐
│  Generating 5 articles for "How AI Can Help Law Firms"       │
│                                                              │
│  ✅ Philadelphia — Complete (1,847 words)         [View]     │
│  ✅ New York — Complete (1,923 words)             [View]     │
│  🔄 Boston — Generating...                        ████░░     │
│  ⏳ Austin — Queued                                          │
│  ⏳ Phoenix — Queued                                         │
│                                                              │
│  3 of 5 complete • ~2 min remaining                          │
└──────────────────────────────────────────────────────────────┘
```

**After all complete:**
- All 5 articles are saved with status: REVIEW
- User sees a summary with links to each article editor
- "Review & Publish All" button → opens a batch review page
- "Publish All" button (only after reviewing) → publishes all at once

**Behavior Details:**
1. Step 1: Dropdown of existing topics from the Topics page, OR a text input for a one-off custom topic
2. Step 2: Grid of the tenant's selected cities (from Cities page). Max 8 per batch.
   - Cities that already have an article for the selected topic are grayed out with a "✓ Already exists" badge
   - Clicking a grayed-out city does nothing (deduplication guard)
3. Step 3: Optional textarea for custom instructions (e.g., "Focus on small firms", "Include pricing comparisons")
4. Step 4: Preview panel shows the predicted URL slugs and article count
5. Generate button: disabled until at least 1 topic + 1 city selected. Shows count: "Generate 5 Articles"
6. Generation runs sequentially (one article at a time) to manage API costs and show progress
7. Each completed article immediately becomes viewable/editable
8. If generation fails for one city, others continue — failed ones show retry button

**API Call:**
- `POST /api/ai/generate-batch` — the main batch generation endpoint (see Section 12)

**Component: `article-generator.tsx`**
- Multi-step form with validation at each step
- Real-time progress tracking via polling or Server-Sent Events
- Uses React state for selections, React Query or SWR for API calls
- Animated progress indicators per city

### 7.3b Ideas Generator (`/admin/ideas`) — Optional Feature

For users who want to brainstorm before committing to full article generation:

**Behavior**:
1. Same Step 1-2 as the Article Generator (topic + cities)
2. Instead of "Generate Articles", click "Generate Ideas First"
3. AI returns 2-3 title/angle suggestions per city
4. User picks their preferred angle for each city
5. Then proceeds to batch generation with the selected angles

This is a secondary workflow — most users will go straight to batch generation. Ideas are useful when you want to explore different angles before spending API credits on full articles.

### 7.4 Article Manager (`/admin/articles`)

**UI Pattern**: Filterable table with inline actions.

**Layout**:
1. Filter bar: Status dropdown (All/Draft/Review/Published/Archived), Topic filter, City filter, Search
2. Table columns: Title | Topic | City | Status | Word Count | Updated | Actions
3. Actions per row: Edit | Preview | Publish/Unpublish | Archive | Delete
4. Clicking "Edit" navigates to `/admin/articles/[id]`

**Article Editor** (`/admin/articles/[id]`):
- Split pane: Left = markdown editor, Right = rendered preview
- Editor toolbar: Bold, Italic, Headings, Link, Image, Code block
- Sidebar panel with:
  - SEO fields: meta title (with character count /60), meta description (/160)
  - Status selector
  - Topic + City display (read-only, set during generation)
  - Featured image URL
  - Publish button
- Auto-save every 30 seconds
- "Regenerate" button → re-runs AI with same inputs + optional new instructions

### 7.5 Settings Page (`/admin/settings`)

**Sections**:
1. **Business Profile**
   - Business name
   - Website URL (with "Analyze Website" button → scrapes and extracts business context)
   - Business description (textarea, 500 char)
   - AI-extracted context (read-only display, JSON pretty-printed)
2. **Branding**
   - Logo upload URL
   - Primary color, Secondary color, Accent color (color pickers)
3. **Blog Configuration**
   - Blog title (e.g., "CaseIntel Legal Blog")
   - Blog description / tagline
   - Articles per page (default 12)
   - Enable/disable table of contents
4. **Domain** (Phase 2)
   - Custom domain configuration
   - DNS instructions

### 7.6 Dashboard (`/admin/dashboard`)

**Stats Cards** (top row):
- Total Articles (published count)
- Articles in Pipeline (draft + review count)
- Topics Active
- Cities Targeted

**Recent Activity** (below):
- Latest 10 articles with status, dates
- Quick action buttons

---

## 8. AI Content Generation Pipeline — Detailed Prompts

### 8.1 Website Analysis Prompt

```typescript
// src/lib/ai/prompts.ts

export const WEBSITE_ANALYSIS_PROMPT = `You are a business analyst. Analyze the following website content and extract structured information about this business.

Website URL: {websiteUrl}
Website Content:
{scrapedContent}

Extract and return as JSON:
{
  "businessType": "what kind of business this is",
  "industry": "primary industry",
  "services": ["list", "of", "services", "offered"],
  "targetAudience": "who they serve",
  "uniqueSellingPoints": ["what", "makes", "them", "different"],
  "toneOfVoice": "professional/casual/authoritative/friendly/etc",
  "keyTerms": ["industry", "specific", "terms", "they", "use"],
  "suggestedTopics": [
    {
      "name": "Topic Name",
      "description": "Why this topic would be good for their blog",
      "searchIntent": "what someone searching this would want"
    }
  ]
}`;
```

### 8.2 Idea Generation Prompt

```typescript
export const IDEA_GENERATION_PROMPT = `You are an SEO content strategist specializing in local/city-specific content that ranks well in Google search.

## Business Context
Business: {businessName}
Type: {businessType}
Description: {businessDescription}
Services: {services}
Target Audience: {targetAudience}
Tone: {toneOfVoice}

## Content Parameters
Topic Area: {topicName}
Target City: {cityName}, {stateCode}
City Data:
- Population: {population}
- Metro Population: {metroPopulation}
- Median Income: {medianIncome}
- Cost of Living Index: {costOfLiving}
{additionalCityData}

## Instructions
Generate exactly 5 unique blog article ideas that:
1. Target local search intent for {cityName} specifically
2. Naturally incorporate the city data provided (don't just name-drop the city)
3. Would be genuinely useful to someone in {cityName} looking for information about {topicName}
4. Include long-tail keyword opportunities
5. Are different enough from each other to avoid cannibalization

For each idea, return:
{
  "ideas": [
    {
      "title": "SEO-optimized title including city name (50-65 characters)",
      "outline": [
        { "heading": "H2 heading text", "description": "What this section covers" }
      ],
      "targetKeyword": "primary keyword to target",
      "secondaryKeywords": ["keyword2", "keyword3"],
      "searchIntent": "informational|transactional|navigational",
      "estimatedDifficulty": "low|medium|high",
      "uniqueAngle": "What makes this article specific to {cityName}, not generic"
    }
  ]
}

CRITICAL: Each idea must have a genuinely unique angle tied to {cityName}. Do NOT create articles that would work just as well for any other city with the name swapped. Reference specific city data, local landmarks, local laws, or regional trends.`;
```

### 8.3 Article Generation Prompt

```typescript
export const ARTICLE_GENERATION_PROMPT = `You are an expert content writer creating a comprehensive, SEO-optimized blog article. Write in a {toneOfVoice} tone.

## Business Context
Writing for: {businessName} ({businessType})
Website: {websiteUrl}
Key services: {services}

## Article Brief
Title: {articleTitle}
Target Keyword: {targetKeyword}
Secondary Keywords: {secondaryKeywords}
Outline:
{articleOutline}

## City-Specific Data for {cityName}, {stateCode}
Population: {population}
Metro Area Population: {metroPopulation}
Cost of Living Index: {costOfLiving} (national avg = 100)
Median Household Income: ${medianIncome}
{legalData}
{economicData}
{demographicData}

## Writing Instructions

1. **Length**: 1,500-2,000 words
2. **Format**: Markdown with proper heading hierarchy (H2 for main sections, H3 for subsections)
3. **SEO Requirements**:
   - Include the target keyword in the first 100 words
   - Use the target keyword 3-5 times naturally throughout
   - Include secondary keywords at least once each
   - Write a compelling meta title (max 60 chars, include city name)
   - Write a meta description (max 155 chars, include city name and a call to action)
4. **City-Specific Content**:
   - Weave in the city data NATURALLY — don't just list statistics
   - Reference local landmarks, neighborhoods, or institutions when relevant
   - Mention state-specific laws or regulations that affect the topic
   - Compare to national averages where the data supports it
   - Include at least 3 city-specific data points in the body
5. **Engagement**:
   - Start with a hook relevant to {cityName} residents
   - Include practical, actionable advice
   - End with a clear call-to-action related to {businessName}'s services
6. **Internal Linking Opportunities**: Suggest 2-3 places where internal links to other articles could go (format as [INTERNAL_LINK: suggested anchor text | topic hint])

Return as JSON:
{
  "metaTitle": "SEO title tag (max 60 chars)",
  "metaDescription": "Meta description (max 155 chars)",
  "content": "Full article in markdown",
  "wordCount": 1750,
  "readingTimeMin": 7,
  "internalLinkSuggestions": [
    { "anchorText": "text to link", "targetTopicHint": "what article to link to" }
  ]
}`;
```

### 8.4 AI Client Setup

```typescript
// src/lib/ai/client.ts
import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const AI_MODEL = 'claude-sonnet-4-5-20250929';
export const AI_MAX_TOKENS = 4096;
```

### 8.5 Generate Ideas Function

```typescript
// src/lib/ai/generate-ideas.ts
import { anthropic, AI_MODEL, AI_MAX_TOKENS } from './client';
import { IDEA_GENERATION_PROMPT } from './prompts';
import { db } from '../db';

interface GenerateIdeasInput {
  tenantId: string;
  topicId: string;
  cityId: string;
}

export async function generateIdeas({ tenantId, topicId, cityId }: GenerateIdeasInput) {
  // 1. Fetch tenant, topic, city with all enrichment data
  const [tenant, topic, city] = await Promise.all([
    db.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    db.topic.findUniqueOrThrow({ where: { id: topicId } }),
    db.city.findUniqueOrThrow({ where: { id: cityId } }),
  ]);

  // 2. Build prompt with real data
  const prompt = IDEA_GENERATION_PROMPT
    .replace('{businessName}', tenant.name)
    .replace('{businessType}', (tenant.businessContext as any)?.businessType || 'business')
    .replace('{businessDescription}', tenant.businessDescription || '')
    .replace('{services}', (tenant.businessContext as any)?.services?.join(', ') || '')
    .replace('{targetAudience}', (tenant.businessContext as any)?.targetAudience || '')
    .replace('{toneOfVoice}', (tenant.businessContext as any)?.toneOfVoice || 'professional')
    .replace('{topicName}', topic.name)
    .replaceAll('{cityName}', city.name)
    .replaceAll('{stateCode}', city.stateCode)
    .replace('{population}', city.population?.toLocaleString() || 'N/A')
    .replace('{metroPopulation}', city.metroPopulation?.toLocaleString() || 'N/A')
    .replace('{medianIncome}', (city.metroData as any)?.medianIncome?.toLocaleString() || 'N/A')
    .replace('{costOfLiving}', (city.metroData as any)?.costOfLiving?.toString() || 'N/A')
    .replace('{additionalCityData}', formatCityData(city));

  // 3. Call Claude
  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  });

  // 4. Parse response
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = JSON.parse(extractJSON(text));

  // 5. Save ideas to database
  const savedIdeas = await Promise.all(
    parsed.ideas.map((idea: any) =>
      db.articleIdea.create({
        data: {
          tenantId,
          topicId,
          cityId,
          suggestedTitle: idea.title,
          suggestedOutline: idea.outline,
          seoKeywords: [idea.targetKeyword, ...idea.secondaryKeywords],
          status: 'SUGGESTED',
        },
      })
    )
  );

  return savedIdeas;
}

function formatCityData(city: any): string {
  const parts: string[] = [];
  if (city.legalData) {
    const ld = city.legalData as any;
    if (ld.totalCourts) parts.push(`- Courts in metro area: ${ld.totalCourts}`);
    if (ld.firmCount) parts.push(`- Law firms in area: ${ld.firmCount}`);
    if (ld.avgSettlement) parts.push(`- Average settlement: $${ld.avgSettlement.toLocaleString()}`);
  }
  if (city.economicData) {
    const ed = city.economicData as any;
    if (ed.unemploymentRate) parts.push(`- Unemployment rate: ${ed.unemploymentRate}%`);
    if (ed.majorEmployers) parts.push(`- Major employers: ${ed.majorEmployers.join(', ')}`);
  }
  return parts.join('\n');
}

function extractJSON(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}
```

---

## 9. Blog Rendering — SEO Implementation

### 9.1 Article Page (`/blog/[slug]/page.tsx`)

This is the most critical page for SEO. Must include:

**Server Component** — fetches article at build/request time:
```typescript
// src/app/(blog)/blog/[slug]/page.tsx
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ArticleContent from '@/components/blog/article-content';
import ArticleHeader from '@/components/blog/article-header';
import Breadcrumbs from '@/components/blog/breadcrumbs';
import RelatedArticles from '@/components/blog/related-articles';
import TableOfContents from '@/components/blog/table-of-contents';

interface Props {
  params: { slug: string };
}

// Generate static params for all published articles (ISR)
export async function generateStaticParams() {
  const articles = await db.article.findMany({
    where: {
      tenantId: process.env.DEFAULT_TENANT_SLUG!,
      status: 'PUBLISHED',
    },
    select: { slug: true },
  });
  return articles.map((a) => ({ slug: a.slug }));
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return {};

  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription,
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDescription || '',
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      images: article.featuredImageUrl ? [article.featuredImageUrl] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.metaTitle || article.title,
      description: article.metaDescription || '',
    },
    alternates: {
      canonical: `/blog/${article.slug}`,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      '@type': 'Organization',
      name: article.tenant.name,
      url: article.tenant.websiteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: article.tenant.name,
      logo: { '@type': 'ImageObject', url: article.tenant.logoUrl },
    },
    image: article.featuredImageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXTAUTH_URL}/blog/${article.slug}`,
    },
  };

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Blog', item: '/blog' },
      article.topic && {
        '@type': 'ListItem',
        position: 2,
        name: article.topic.name,
        item: `/blog/topics/${article.topic.slug}`,
      },
      article.city && {
        '@type': 'ListItem',
        position: 3,
        name: article.city.name,
        item: `/blog/cities/${article.city.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: article.title,
        item: `/blog/${article.slug}`,
      },
    ].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <article className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs topic={article.topic} city={article.city} />
        <ArticleHeader article={article} />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-8 mt-8">
          <ArticleContent content={article.content} />
          <aside className="hidden lg:block">
            <TableOfContents content={article.content} />
          </aside>
        </div>
        <RelatedArticles
          tenantId={article.tenantId}
          currentArticleId={article.id}
          topicId={article.topicId}
          cityId={article.cityId}
        />
      </article>
    </>
  );
}
```

### 9.2 Dynamic Sitemap

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://caseintel.io';
  const tenantSlug = process.env.DEFAULT_TENANT_SLUG!;

  const articles = await db.article.findMany({
    where: { tenant: { slug: tenantSlug }, status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: { publishedAt: 'desc' },
  });

  const topics = await db.topic.findMany({
    where: { tenant: { slug: tenantSlug } },
    select: { slug: true },
  });

  const cities = await db.city.findMany({
    where: { tenantCities: { some: { tenant: { slug: tenantSlug } } } },
    select: { slug: true },
  });

  return [
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    ...articles.map((a) => ({
      url: `${baseUrl}/blog/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    ...topics.map((t) => ({
      url: `${baseUrl}/blog/topics/${t.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...cities.map((c) => ({
      url: `${baseUrl}/blog/cities/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
```

### 9.3 ISR Revalidation

In `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable ISR — revalidate blog pages every hour
  experimental: {},
};

module.exports = nextConfig;
```

On each blog page:
```typescript
export const revalidate = 3600; // Revalidate every hour
```

---

## 10. City Data Seed File

`prisma/seed.ts` — Seed the top 50 US cities with real data. Here's the structure:

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const cities = [
  {
    name: 'Phoenix',
    state: 'Arizona',
    stateCode: 'AZ',
    slug: 'phoenix-az',
    population: 1650070,
    metroPopulation: 4946145,
    metroData: {
      costOfLiving: 97.1,
      medianIncome: 65520,
      medianHomePrice: 425000,
      averageRent: 1450,
    },
    legalData: {
      totalCourts: 23,
      firmCount: 1840,
      avgPersonalInjurySettlement: 52000,
      autoAccidentRate: 4.2, // per 1000 residents
    },
    economicData: {
      unemploymentRate: 3.8,
      majorEmployers: ['Banner Health', 'Wells Fargo', 'Arizona State University', 'Intel', 'Honeywell'],
      topIndustries: ['Healthcare', 'Technology', 'Finance', 'Education'],
    },
    demographics: {
      medianAge: 33.8,
      collegeEducated: 31.2, // percentage
    },
  },
  {
    name: 'Austin',
    state: 'Texas',
    stateCode: 'TX',
    slug: 'austin-tx',
    population: 979882,
    metroPopulation: 2283371,
    metroData: {
      costOfLiving: 95.4,
      medianIncome: 75413,
      medianHomePrice: 520000,
      averageRent: 1650,
    },
    legalData: {
      totalCourts: 14,
      firmCount: 2100,
      avgPersonalInjurySettlement: 58000,
      autoAccidentRate: 3.9,
    },
    economicData: {
      unemploymentRate: 3.1,
      majorEmployers: ['Dell Technologies', 'University of Texas', 'Tesla', 'Apple', 'Samsung'],
      topIndustries: ['Technology', 'Education', 'Government', 'Healthcare'],
    },
    demographics: {
      medianAge: 34.4,
      collegeEducated: 47.1,
    },
  },
  // ... ADD 48 MORE CITIES following same structure
  // Include: Los Angeles, Chicago, Houston, San Antonio, Dallas, San Jose,
  // Jacksonville, San Francisco, Indianapolis, Columbus, Charlotte, Seattle,
  // Denver, Nashville, Oklahoma City, Portland, Las Vegas, Memphis,
  // Louisville, Baltimore, Milwaukee, Albuquerque, Tucson, Fresno,
  // Sacramento, Mesa, Kansas City, Atlanta, Omaha, Colorado Springs,
  // Raleigh, Long Beach, Virginia Beach, Miami, Oakland, Minneapolis,
  // Tampa, Tulsa, Arlington, New Orleans, Cleveland, Honolulu,
  // Anaheim, Pittsburgh, Cincinnati, Orlando, St. Louis, Newark
];

async function main() {
  console.log('Seeding cities...');

  for (const city of cities) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: { ...city, lastDataRefresh: new Date() },
      create: { ...city, lastDataRefresh: new Date() },
    });
  }

  // Seed default CaseIntel tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'caseintel' },
    update: {},
    create: {
      name: 'CaseIntel',
      slug: 'caseintel',
      domain: 'caseintel.io',
      websiteUrl: 'https://caseintel.io',
      businessDescription: 'CaseIntel is a legal technology platform that helps personal injury attorneys manage cases, track settlements, and grow their practice.',
      planTier: 'ENTERPRISE',
    },
  });

  // Seed default topics for CaseIntel
  const defaultTopics = [
    { name: 'Personal Injury', slug: 'personal-injury', isCustom: false },
    { name: 'Car Accidents', slug: 'car-accidents', isCustom: false },
    { name: 'Medical Malpractice', slug: 'medical-malpractice', isCustom: false },
    { name: 'Workers Compensation', slug: 'workers-compensation', isCustom: false },
    { name: 'Slip and Fall', slug: 'slip-and-fall', isCustom: false },
  ];

  for (const topic of defaultTopics) {
    await prisma.topic.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: topic.slug } },
      update: {},
      create: { ...topic, tenantId: tenant.id },
    });
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
```

---

## 10B. City Data Enrichment — API Integration Details

### Census API (demographics, population, income)

**Setup**: Get a free API key at https://api.census.gov/data/key_signup.html

```typescript
// src/lib/city-data/census.ts
const CENSUS_BASE = 'https://api.census.gov/data';
const ACS_YEAR = '2023'; // American Community Survey
const ACS_DATASET = 'acs/acs5';

interface CensusData {
  population: number;
  medianIncome: number;
  medianAge: number;
  collegeEducated: number; // percentage
  medianHomeValue: number;
}

export async function fetchCensusData(
  stateCode: string,
  cityName: string
): Promise<CensusData> {
  const stateFips = STATE_FIPS_MAP[stateCode]; // "04" for AZ, "48" for TX, etc.

  // Variables:
  // B01003_001E = total population
  // B19013_001E = median household income
  // B01002_001E = median age
  // B15003_022E = bachelor's degree count (for % calculation)
  // B25077_001E = median home value
  const variables = [
    'B01003_001E', 'B19013_001E', 'B01002_001E',
    'B15003_022E', 'B25077_001E', 'NAME'
  ].join(',');

  // Query for "place" level (cities) within state
  const url = `${CENSUS_BASE}/${ACS_YEAR}/${ACS_DATASET}?get=${variables}&for=place:*&in=state:${stateFips}&key=${process.env.CENSUS_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  // data[0] = headers, data[1+] = rows
  // Find the row matching city name
  const headers = data[0];
  const cityRow = data.slice(1).find((row: string[]) =>
    row[headers.indexOf('NAME')].toLowerCase().includes(cityName.toLowerCase())
  );

  if (!cityRow) throw new Error(`City ${cityName} not found in Census data`);

  return {
    population: parseInt(cityRow[headers.indexOf('B01003_001E')]),
    medianIncome: parseInt(cityRow[headers.indexOf('B19013_001E')]),
    medianAge: parseFloat(cityRow[headers.indexOf('B01002_001E')]),
    collegeEducated: 0, // calculate from B15003_022E / B01003_001E * 100
    medianHomeValue: parseInt(cityRow[headers.indexOf('B25077_001E')]),
  };
}

// State FIPS codes — used by Census API
const STATE_FIPS_MAP: Record<string, string> = {
  AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06', CO: '08', CT: '09',
  DE: '10', FL: '12', GA: '13', HI: '15', ID: '16', IL: '17', IN: '18',
  IA: '19', KS: '20', KY: '21', LA: '22', ME: '23', MD: '24', MA: '25',
  MI: '26', MN: '27', MS: '28', MO: '29', MT: '30', NE: '31', NV: '32',
  NH: '33', NJ: '34', NM: '35', NY: '36', NC: '37', ND: '38', OH: '39',
  OK: '40', OR: '41', PA: '42', RI: '44', SC: '45', SD: '46', TN: '47',
  TX: '48', UT: '49', VT: '50', VA: '51', WA: '53', WV: '54', WI: '55',
  WY: '56', DC: '11',
};
```

### BLS API (employment, wages, cost of living)

**Setup**: Get a free API key at https://data.bls.gov/registrationEngine/ (v2 allows 500 requests/day)

```typescript
// src/lib/city-data/bls.ts
const BLS_BASE = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

interface EconomicData {
  unemploymentRate: number;
  averageWeeklyWage: number;
  costOfLivingIndex: number; // calculated relative to national average
}

export async function fetchBLSData(
  stateCode: string,
  metroAreaCode: string // BLS uses CBSA codes for metro areas
): Promise<EconomicData> {
  // Series IDs follow patterns:
  // LAUCN + FIPS + 03 = unemployment rate for county
  // ENUXXXXXXXX5xx = quarterly census of employment and wages
  // CUURS + area code + SA0 = CPI (cost of living proxy)

  const currentYear = new Date().getFullYear().toString();

  const response = await fetch(BLS_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesid: [
        `LAUMT${metroAreaCode}00000003`, // metro unemployment rate
        `CUURS${metroAreaCode}SA0`,       // CPI for metro area
      ],
      startyear: (parseInt(currentYear) - 1).toString(),
      endyear: currentYear,
      registrationkey: process.env.BLS_API_KEY,
    }),
  });

  const data = await response.json();
  // Parse latest data points from each series
  // ... transform into EconomicData
  return {
    unemploymentRate: 0, // from parsed series data
    averageWeeklyWage: 0,
    costOfLivingIndex: 100, // relative to national CPI
  };
}

// BLS CBSA (metro area) codes for top 50 cities
export const METRO_AREA_CODES: Record<string, string> = {
  'phoenix-az': '38060',
  'austin-tx': '12420',
  'los-angeles-ca': '31080',
  'chicago-il': '16980',
  'houston-tx': '26420',
  'dallas-tx': '19100',
  'san-francisco-ca': '41860',
  'seattle-wa': '42660',
  'denver-co': '19740',
  'miami-fl': '33100',
  'atlanta-ga': '12060',
  'nashville-tn': '34980',
  'portland-or': '38900',
  'las-vegas-nv': '29820',
  'minneapolis-mn': '33460',
  // ... add all 50
};
```

### Legal Data Sources

For the legal vertical (caseintel.io), legal data is harder to get from a single API. Recommended approach:

```typescript
// src/lib/city-data/legal.ts

// Strategy: Combine multiple sources + AI estimation
// 1. State bar association data (number of attorneys per state) — scrape or use known data
// 2. PACER / court statistics — federal court data is public
// 3. State court annual reports — most states publish these as PDFs
// 4. For initial seed: use curated data + AI estimation

interface LegalData {
  totalCourts: number;
  firmCount: number;
  avgPersonalInjurySettlement: number;
  autoAccidentRate: number; // per 1000 residents
  topPracticeAreas: string[];
}

// For Phase 1: Use hardcoded curated data per city
// Sources to manually compile from:
// - American Bar Association lawyer demographics: https://www.americanbar.org/
// - National Center for State Courts: https://www.ncsc.org/
// - NHTSA crash statistics: https://www.nhtsa.gov/data
// - Insurance Information Institute: https://www.iii.org/

// For Phase 2: Consider paid legal data APIs:
// - Clio Legal Trends data
// - Thomson Reuters Westlaw
// - LexisNexis
```

### Enrichment Orchestrator

```typescript
// src/lib/city-data/enrichment.ts
import { fetchCensusData } from './census';
import { fetchBLSData, METRO_AREA_CODES } from './bls';
import { db } from '../db';

export async function refreshCityData(citySlug: string) {
  const city = await db.city.findUnique({ where: { slug: citySlug } });
  if (!city) throw new Error(`City not found: ${citySlug}`);

  const [census, bls] = await Promise.allSettled([
    fetchCensusData(city.stateCode, city.name),
    fetchBLSData(city.stateCode, METRO_AREA_CODES[citySlug] || ''),
  ]);

  const updates: any = { lastDataRefresh: new Date() };

  if (census.status === 'fulfilled') {
    updates.population = census.value.population;
    updates.metroData = {
      ...(city.metroData as any),
      medianIncome: census.value.medianIncome,
      medianHomePrice: census.value.medianHomeValue,
    };
    updates.demographics = {
      medianAge: census.value.medianAge,
      collegeEducated: census.value.collegeEducated,
    };
  }

  if (bls.status === 'fulfilled') {
    updates.economicData = {
      ...(city.economicData as any),
      unemploymentRate: bls.value.unemploymentRate,
      costOfLiving: bls.value.costOfLivingIndex,
    };
  }

  await db.city.update({ where: { slug: citySlug }, data: updates });
}

// Refresh all cities — run monthly via cron job or Vercel cron
export async function refreshAllCities() {
  const cities = await db.city.findMany({ select: { slug: true } });
  for (const city of cities) {
    try {
      await refreshCityData(city.slug);
      // Respect rate limits — 500 BLS requests/day, Census is generous
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (e) {
      console.error(`Failed to refresh ${city.slug}:`, e);
    }
  }
}
```

### Seed Strategy for All 50 Cities

For the initial seed, use a hybrid approach:
1. **Hardcode known data** for the top 10-15 cities (manually researched) in `prisma/seed.ts`
2. **Run Census + BLS enrichment** on first deploy to fill in the rest automatically
3. **Legal data**: Manually curate for the top 20 cities, leave null for others (AI will skip legal references if data is missing)
4. **Vercel Cron**: Set up a monthly cron to call `refreshAllCities()` to keep data fresh

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-cities",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

---

## 11. Key Component Specifications

### 11.1 Topic Tag Input Component

```
Component: topic-tag-input.tsx
Props: tenantId: string

Visuals:
- Input field with placeholder "Add a topic..."
- Below input: flex-wrap container of topic chips
- Each chip: rounded-full bg, topic name, article count badge, X button
- Color coding: custom topics = blue, AI-suggested = purple outline/dashed border
- "Suggest Topics with AI" button below the chips (secondary style)

State:
- topics: Topic[] (fetched from API on mount)
- inputValue: string
- isLoading: boolean (for AI suggestion)
- suggestedTopics: Topic[] (from AI, shown differently)

Keyboard:
- Enter in input → add topic
- Backspace in empty input → remove last topic
- Escape → clear input

Animations:
- Chip appears with scale-in animation
- Chip removal with fade-out
- Loading shimmer on AI suggestion chips
```

### 11.2 Article Content Renderer

```
Component: article-content.tsx
Props: content: string (markdown)

Uses: react-markdown with plugins:
- remark-gfm (tables, strikethrough, task lists)
- rehype-highlight (code syntax highlighting)
- rehype-slug (add IDs to headings for TOC links)

Custom renderers:
- h2/h3: Add anchor links on hover
- a: External links get target="_blank" rel="noopener noreferrer"
- img: Next/Image optimization wrapper
- [INTERNAL_LINK: ...]: Render as styled internal link placeholder (for editor)

Styling:
- Tailwind prose class for typography
- Responsive images
- Proper spacing between sections
```

---

## 12. API Route Specifications

### 12.1 Generate Ideas API

```
POST /api/ai/generate-ideas
Body: {
  topicIds: string[],    // which topics to generate for
  cityIds: string[],     // which cities to target
  instructions?: string  // optional custom angle
}
Response: {
  ideas: ArticleIdea[],
  count: number
}

Flow:
1. Validate request body with Zod
2. Fetch tenant from session
3. For each topic × city combination:
   a. Fetch topic, city with enrichment data
   b. Build prompt from template
   c. Call Claude API
   d. Parse response JSON
   e. Save ideas to database
4. Return all generated ideas

Rate limit: 10 requests per minute per tenant
```

### 12.2 Batch Generate Articles API (PRIMARY ENDPOINT)

This is the core endpoint that powers the Article Generator page.
One topic + multiple cities = multiple unique articles generated sequentially.

```
POST /api/ai/generate-batch
Body: {
  topicId: string,           // OR customTopic: string for one-off topics
  customTopic?: string,      // if no existing topicId, create on the fly
  cityIds: string[],         // 1-8 cities to generate for
  instructions?: string      // optional custom angle/instructions
}
Response: {
  batchId: string,           // unique ID to track this batch
  totalArticles: number,
  articles: [{
    cityId: string,
    cityName: string,
    status: "queued" | "generating" | "complete" | "failed",
    articleId?: string,      // populated once complete
    slug?: string,           // predicted URL slug
    error?: string           // if failed
  }]
}

Flow:
1. Validate: max 8 cities, check deduplication (skip cities that already
   have an article for this topic — return warning, don't error)
2. If customTopic provided, create a new Topic record first
3. Create a `generation_batch` record to track progress
4. For EACH city (sequentially, to manage API cost + show progress):
   a. Fetch city enrichment data (population, legal, economic)
   b. Build article generation prompt with:
      - Business context (from tenant)
      - Topic name
      - City name + ALL city-specific data
      - Custom instructions (if any)
      - Instruction to include city name in title and slug
   c. Call Claude API (max_tokens: 4096)
   d. Parse response: title, content (markdown), meta title, meta description
   e. Generate slug: slugify(title) → e.g., "how-ai-can-help-law-firms-in-philadelphia"
   f. Calculate word count, reading time
   g. Save article with status: REVIEW
   h. Update batch record with progress
5. Return completed batch summary

CRITICAL SLUG PATTERN:
The AI prompt MUST instruct Claude to include the city name in the article title.
This ensures slugs follow the pattern:
  {topic-slug}-in-{city-name}
Example:
  Topic: "How AI Can Help Law Firms"
  Cities: [Philadelphia, New York, Boston, Austin, Phoenix]
  Slugs generated:
    how-ai-can-help-law-firms-in-philadelphia
    how-ai-can-help-law-firms-in-new-york
    how-ai-can-help-law-firms-in-boston
    how-ai-can-help-law-firms-in-austin
    how-ai-can-help-law-firms-in-phoenix

Rate limit: 3 batch requests per hour per tenant (each batch = up to 8 API calls)
```

### 12.2b Batch Progress Polling API

```
GET /api/ai/generate-batch/:batchId
Response: {
  batchId: string,
  status: "in_progress" | "complete" | "partial_failure",
  totalArticles: number,
  completedArticles: number,
  articles: [{
    cityId: string,
    cityName: string,
    status: "queued" | "generating" | "complete" | "failed",
    articleId?: string,
    slug?: string,
    wordCount?: number,
    error?: string
  }]
}

The frontend polls this every 3-5 seconds during generation to update
the progress UI. Each article takes ~30-60 seconds to generate.
```

### 12.2c Single Article Generate API (for regeneration/one-offs)

```
POST /api/ai/generate-article
Body: {
  ideaId?: string,           // generate from an existing idea
  topicId?: string,          // OR generate fresh for a topic + city
  cityId?: string,
  instructions?: string
}
Response: {
  article: Article
}

Flow:
1. Fetch topic + city + tenant context
2. Build full article generation prompt
3. Call Claude API (max_tokens: 4096)
4. Parse response: content, meta title, meta description
5. Generate slug from title (slugify)
6. Calculate word count, reading time
7. Save article with status: REVIEW
8. Return article

Used for: regenerating a single article, or generating from the Ideas page.
```

### 12.3 Publish Article API

```
POST /api/v1/articles/[id]/publish
Response: { article: Article }

Flow:
1. Fetch article, verify tenant ownership
2. Validate: must have content, metaTitle, metaDescription
3. Set status to PUBLISHED, set publishedAt to now()
4. Trigger ISR revalidation: revalidatePath(`/blog/${article.slug}`)
5. Return updated article
```

---

## 13. SEO Checklist (Verify These)

For every blog article page, verify:

- [ ] `<title>` tag is unique, under 60 chars, includes city name
- [ ] `<meta name="description">` is unique, under 160 chars, includes city name + CTA
- [ ] `<link rel="canonical">` points to the correct URL
- [ ] Open Graph tags: `og:title`, `og:description`, `og:type=article`, `og:image`, `og:url`
- [ ] Twitter Card tags: `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`
- [ ] JSON-LD Article structured data with all required fields
- [ ] JSON-LD BreadcrumbList structured data
- [ ] Proper heading hierarchy: one H1 (article title), H2s for sections, H3s for subsections
- [ ] Internal links to related city articles and topic articles
- [ ] Image alt tags on all images
- [ ] URL slug is descriptive and includes city name (e.g., `/blog/personal-injury-lawyer-phoenix-az`)
- [ ] Page loads in under 2 seconds (Lighthouse performance 90+)
- [ ] Sitemap.xml includes all published articles
- [ ] robots.txt allows crawling of `/blog/`

---

## 14. Deployment & Environment Setup

### Local Development
```bash
# 1. Clone and install
git clone <repo-url> && cd caseintel-blog
npm install

# 2. Set up PostgreSQL (Docker recommended)
docker run --name caseintel-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=caseintel_blog -p 5432:5432 -d postgres:16

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Run migrations and seed
npx prisma migrate dev --name init
npm run db:seed

# 5. Start dev server
npm run dev
```

### Production (Vercel)
1. Connect GitHub repo to Vercel
2. Add all environment variables in Vercel dashboard
3. Set build command: `prisma generate && next build`
4. Set up Vercel Postgres or external PostgreSQL (Supabase/Neon recommended)
5. Enable ISR caching
6. Configure custom domain: `caseintel.io`

---

## 15. Content Delivery Architecture — API-First (No Strapi Needed)

### Why Not Strapi / External Headless CMS
Our admin dashboard IS the CMS. Adding Strapi would mean:
- A second server to host and maintain
- Duplicated content management logic
- Extra complexity for no real benefit

Instead, this platform is its own purpose-built headless CMS with a clean API layer that any frontend can consume.

### How Content Gets to caseintel.io (Phase 1)

Since caseintel.io is already a Next.js app, integration is simple — add blog routes that fetch from the blog engine's API:

**Option A: Same Deployment (Recommended for Phase 1)**
The blog engine IS part of caseintel.io. The admin dashboard and blog routes live in the same Next.js app. No API calls needed — just direct database queries in server components.

```
caseintel.io/          → existing caseintel pages
caseintel.io/blog/     → blog index (new route, pulls from DB)
caseintel.io/blog/[slug] → article pages (new route, pulls from DB)
caseintel.io/admin/    → blog admin dashboard (new routes)
```

This is the fastest path. You add the blog engine code directly into your existing caseintel.io Next.js repo.

**Option B: Separate Service + API (Better for White-Label)**
Blog engine runs as its own service. caseintel.io fetches articles via API:

```
blog-engine.vercel.app/admin/  → admin dashboard
blog-engine.vercel.app/api/v1/ → content API

caseintel.io/blog/     → fetches from blog-engine API
caseintel.io/blog/[slug] → fetches article by slug from API
```

### Content Delivery API (for any frontend to consume)

These endpoints are the "headless CMS" interface. Any website can use them:

```
GET /api/v1/content/articles
  Query params:
    ?status=published          (required for public access)
    ?topic=personal-injury     (filter by topic slug)
    ?city=phoenix-az           (filter by city slug)
    ?page=1&limit=12           (pagination)
    ?sort=publishedAt:desc     (sorting)
  Headers:
    X-Tenant-Key: <api-key>    (identifies tenant for white-label)
  Response: {
    articles: [{
      id, title, slug, metaTitle, metaDescription,
      content,           // full markdown
      contentHtml,       // pre-rendered HTML (optional, for non-markdown consumers)
      topic: { name, slug },
      city: { name, state, slug },
      publishedAt, readingTimeMin, wordCount,
      featuredImageUrl
    }],
    pagination: { page, limit, total, totalPages }
  }

GET /api/v1/content/articles/:slug
  Headers: X-Tenant-Key: <api-key>
  Response: { article: Article }  // full article with all fields

GET /api/v1/content/topics
  Headers: X-Tenant-Key: <api-key>
  Response: { topics: [{ name, slug, articleCount }] }

GET /api/v1/content/cities
  Headers: X-Tenant-Key: <api-key>
  Response: { cities: [{ name, state, slug, articleCount }] }

GET /api/v1/content/sitemap
  Headers: X-Tenant-Key: <api-key>
  Response: {
    articles: [{ slug, updatedAt, publishedAt }],
    topics: [{ slug }],
    cities: [{ slug }]
  }
  // Provides data for the consumer's frontend to build its own sitemap.xml
```

### Integration Example: Adding Blog to an Existing Next.js Site

For Ryan (caseintel.io) or any white-label customer with a Next.js frontend:

```typescript
// In the customer's Next.js app:
// app/blog/page.tsx — Blog index

const BLOG_API = process.env.BLOG_ENGINE_URL || 'https://blog-engine.vercel.app';
const TENANT_KEY = process.env.BLOG_TENANT_KEY;

async function getArticles(page = 1) {
  const res = await fetch(
    `${BLOG_API}/api/v1/content/articles?status=published&page=${page}&limit=12`,
    {
      headers: { 'X-Tenant-Key': TENANT_KEY! },
      next: { revalidate: 3600 }, // ISR: revalidate hourly
    }
  );
  return res.json();
}

export default async function BlogPage() {
  const { articles, pagination } = await getArticles();

  return (
    <div>
      <h1>CaseIntel Legal Blog</h1>
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
      {/* pagination controls */}
    </div>
  );
}
```

```typescript
// app/blog/[slug]/page.tsx — Article page

export async function generateMetadata({ params }) {
  const { article } = await getArticle(params.slug);
  return {
    title: article.metaTitle,
    description: article.metaDescription,
    openGraph: { /* ... */ },
  };
}

export default async function ArticlePage({ params }) {
  const { article } = await getArticle(params.slug);
  // Render markdown → HTML on the frontend
  return <ArticleRenderer article={article} />;
}
```

### API Authentication for White-Label

```
Tenant API Keys (Phase 2):
- Each tenant gets one or more API keys from the admin Settings page
- Keys are hashed + stored in a `tenant_api_keys` table
- Middleware validates X-Tenant-Key header → resolves tenant
- Rate limiting: 1000 requests/hour for free tier, 10000 for pro, unlimited for enterprise
- Keys can be rotated/revoked from the admin dashboard
```

### Caching Strategy

```
Content API responses are cached at multiple layers:

1. Upstash Redis: Cache full article responses for 1 hour
   Key pattern: `content:${tenantId}:article:${slug}`
   Invalidate on publish/unpublish/edit

2. Vercel Edge Cache: Cache GET responses with Cache-Control headers
   Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400

3. Consumer's ISR: The customer's Next.js app uses `next: { revalidate: 3600 }`
   so their pages regenerate hourly

Result: After first request, articles load in <50ms globally.
```

### Phase 1 vs Phase 2 Decision

For Phase 1 (caseintel.io only), use **Option A** — build the blog engine directly into the caseintel.io Next.js app. This is the simplest path and avoids the complexity of API keys, CORS, and a separate deployment.

For Phase 2 (white-label), extract the blog engine into its own service with the content API above. The database schema and code structure already support this — it's mostly a deployment change, not a code rewrite.

---

## 16. Phase 2 Roadmap (White-Label SaaS)


These items are NOT built in Phase 1 but the database schema and architecture supports them from day one:

1. **Multi-tenant middleware**: Resolve tenant from request hostname
2. **Tenant onboarding flow**: Sign up → choose plan → configure business → select topics/cities → generate first batch
3. **Stripe billing integration**: Metered billing based on article count or API usage
4. **Custom domain routing**: Each tenant maps their domain → Vercel custom domains API
5. **API key management**: Tenant dashboard to create/revoke API keys for programmatic access
6. **Analytics dashboard**: Per-tenant traffic, search rankings, click-through rates (integrate Google Search Console API)
7. **Content scheduling**: Schedule articles to publish at specific dates/times
8. **A/B title testing**: Generate multiple title variants, test which performs better
9. **Bulk generation mode**: Select 10 topics × 20 cities = queue 200 articles for batch processing
10. **Template system**: Reusable article structures that maintain the same sections across cities

---

## 17. Important Implementation Notes

### Article Deduplication — Preventing Duplicate Content

The system must NEVER generate duplicate articles for the same topic + city combination. Multiple layers of protection:

**Layer 1: Database Constraint (already in schema)**
```prisma
@@unique([tenantId, topicId, cityId]) // on Article model
```
This is the hard stop — PostgreSQL will reject any insert that duplicates a tenant + topic + city combo.

**Layer 2: Idea Generation Pre-Check**
Before generating ideas, check which topic × city combos already have articles:
```typescript
// In generate-ideas flow, BEFORE calling Claude:
async function filterExistingCombos(
  tenantId: string,
  topicIds: string[],
  cityIds: string[]
): Promise<{ topicId: string; cityId: string }[]> {
  // Find all existing articles for these combos
  const existing = await db.article.findMany({
    where: {
      tenantId,
      topicId: { in: topicIds },
      cityId: { in: cityIds },
    },
    select: { topicId: true, cityId: true },
  });

  const existingSet = new Set(
    existing.map((a) => `${a.topicId}:${a.cityId}`)
  );

  // Also check existing ideas that haven't been rejected
  const existingIdeas = await db.articleIdea.findMany({
    where: {
      tenantId,
      topicId: { in: topicIds },
      cityId: { in: cityIds },
      status: { in: ['SUGGESTED', 'ACCEPTED', 'GENERATED'] },
    },
    select: { topicId: true, cityId: true },
  });

  const ideaSet = new Set(
    existingIdeas.map((i) => `${i.topicId}:${i.cityId}`)
  );

  // Return only combos that don't already exist
  const combos: { topicId: string; cityId: string }[] = [];
  for (const topicId of topicIds) {
    for (const cityId of cityIds) {
      const key = `${topicId}:${cityId}`;
      if (!existingSet.has(key) && !ideaSet.has(key)) {
        combos.push({ topicId, cityId });
      }
    }
  }
  return combos;
}
```

**Layer 3: UI Feedback**
- In the Ideas page, when selecting topics + cities for idea generation:
  - Gray out / disable combos that already have published articles
  - Show a badge: "3 of 15 combos already have articles — generating for 12"
- In the Article list, show a matrix view: topics (rows) × cities (columns), cells colored by status (empty / idea / draft / published)

**Layer 4: Slug Uniqueness**
```typescript
// When generating slug from title, check for collisions:
async function generateUniqueSlug(tenantId: string, title: string): string {
  const baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (await db.article.findUnique({ where: { tenantId_slug: { tenantId, slug } } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}
```

---

### Content Quality Guard Rails
- Every generated article goes to REVIEW status, never directly to PUBLISHED
- The article editor should show a "quality checklist" sidebar:
  - [ ] City-specific data referenced at least 3 times
  - [ ] Meta title under 60 characters
  - [ ] Meta description under 160 characters
  - [ ] At least 1,200 words
  - [ ] Internal link opportunities identified
- Consider adding a "regenerate section" feature — highlight a paragraph, click regenerate, AI rewrites just that section

### Avoiding Google Penalties
- Each article MUST have genuinely unique content — not just city name swapped
- The city data enrichment is what makes this work legally with Google
- Include a `noindex` meta tag on DRAFT and REVIEW articles
- Don't generate more than 5-10 articles at once to allow for human review
- Vary article structures — not every city article should follow the exact same template

### Performance
- Use Next.js Image component for all blog images
- Implement proper caching headers
- Use ISR with 1-hour revalidation for published articles
- Lazy load below-fold content (related articles, TOC on mobile)
- Pre-fetch links on hover for instant navigation
