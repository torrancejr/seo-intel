# SEOIntel — AI-Powered Location-Specific Content at Scale

Generate hundreds of unique, SEO-optimized articles for every city you target. Real data enrichment, not just city name swaps.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma
- **AI**: Anthropic Claude
- **Styling**: Tailwind CSS + Framer Motion
- **Auth**: NextAuth.js v5

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

```bash
# Start PostgreSQL (Docker recommended)
docker run --name seointel-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=seointel_blog \
  -p 5432:5432 \
  -d postgres:16

# Copy environment variables
cp .env.example .env

# Edit .env with your values
# - DATABASE_URL
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
# - ANTHROPIC_API_KEY
```

### 3. Run Migrations

```bash
npx prisma migrate dev --name init
```

### 4. Seed Database

```bash
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the homepage.

## Project Structure

```
seointel/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed 50 US cities
├── src/
│   ├── app/
│   │   ├── (admin)/        # Admin dashboard routes
│   │   ├── (blog)/         # Public blog routes
│   │   ├── api/            # API routes
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Homepage
│   ├── components/
│   │   ├── admin/          # Admin components
│   │   ├── blog/           # Blog components
│   │   └── ui/             # shadcn/ui components
│   ├── lib/
│   │   ├── ai/             # AI generation logic
│   │   ├── city-data/      # City data enrichment
│   │   ├── db.ts           # Prisma client
│   │   └── utils.ts        # Utilities
│   └── types/
│       └── index.ts        # TypeScript types
└── public/
```

## Features

- **Batch Article Generation**: 1 topic × N cities = N unique articles
- **Real City Data**: Census demographics, BLS economic data, industry stats
- **SEO Optimized**: Meta tags, structured data, sitemaps
- **AI-Powered Editor**: Regenerate sections, suggest improvements
- **Clay-Inspired Design**: Premium agency aesthetic with Framer Motion

## Development

```bash
# Run dev server
npm run dev

# Run Prisma Studio (database GUI)
npm run db:studio

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name your_migration_name
```

## Deployment

Deploy to Vercel:

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Set build command: `prisma generate && next build`
4. Deploy!

## License

Proprietary
