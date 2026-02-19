# SEOIntel Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd seointel
npm install
```

### 2. Set Up PostgreSQL Database

**Option A: Docker (Recommended)**
```bash
docker run --name seointel-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=seointel_blog \
  -p 5432:5432 \
  -d postgres:16
```

**Option B: Local PostgreSQL**
- Install PostgreSQL 16
- Create database: `createdb seointel_blog`

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/seointel_blog"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32
ANTHROPIC_API_KEY="sk-ant-..."      # Get from https://console.anthropic.com/
```

### 4. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed with cities and topics
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## What You'll See

### Homepage (/)
- Clay-inspired design with smooth Framer Motion animations
- Hero section with stats
- How it works section
- Features overview
- CTA section

### Admin Dashboard (/admin)
- Coming in Phase 1.2 - Authentication & Admin Layout

## Next Steps

Follow the implementation plan in `IMPLEMENTATION_PLAN.md`:

- ✅ **Phase 1.1**: Project Setup & Database (DONE!)
- 🚧 **Phase 1.2**: Authentication & Admin Layout (NEXT)
- ⏳ **Phase 1.3**: Topic & City Management
- ⏳ **Phase 1.4**: AI Integration & Content Generation
- ⏳ **Phase 1.5**: Batch Article Generator
- ⏳ **Phase 1.6**: Article Management & Editor
- ⏳ **Phase 1.7**: Public Blog Frontend
- ⏳ **Phase 1.8**: Dashboard & Settings
- ⏳ **Phase 1.9**: Polish & Launch

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:studio        # Open Prisma Studio (database GUI)
npm run db:migrate       # Create new migration
npm run db:push          # Push schema changes (dev only)
npm run db:seed          # Seed database

# Code Quality
npm run lint             # Run ESLint
```

## Troubleshooting

### Database Connection Issues

If you see `Can't reach database server`:
1. Check PostgreSQL is running: `docker ps` or `pg_isready`
2. Verify DATABASE_URL in `.env`
3. Check port 5432 is not in use: `lsof -i :5432`

### Prisma Client Issues

If you see `@prisma/client did not initialize yet`:
```bash
npx prisma generate
```

### Port Already in Use

If port 3000 is taken:
```bash
npm run dev -- -p 3001
```

## Project Structure

```
seointel/
├── prisma/
│   ├── schema.prisma       # ✅ Database schema
│   └── seed.ts             # ✅ Seed data
├── src/
│   ├── app/
│   │   ├── layout.tsx      # ✅ Root layout
│   │   ├── page.tsx        # ✅ Homepage
│   │   └── globals.css     # ✅ Global styles
│   └── lib/
│       ├── db.ts           # ✅ Prisma client
│       └── utils.ts        # ✅ Utilities
├── .env.example            # ✅ Environment template
├── package.json            # ✅ Dependencies
├── tailwind.config.ts      # ✅ Tailwind config
└── tsconfig.json           # ✅ TypeScript config
```

## Need Help?

Check the full specification in `seointel-blog-spec.md` for detailed implementation details.
