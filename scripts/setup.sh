#!/bin/bash

echo "🚀 SEOIntel Setup Script"
echo "========================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Docker and Node.js are installed"
echo ""

# Start PostgreSQL container
echo "📦 Starting PostgreSQL container..."
docker run --name seointel-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=seointel_blog \
  -p 5432:5432 \
  -d postgres:16

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL container started"
else
    echo "⚠️  Container might already exist. Trying to start existing container..."
    docker start seointel-pg
fi

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Copy .env.example if .env doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your ANTHROPIC_API_KEY"
    echo "   Get your API key from: https://console.anthropic.com/"
    echo ""
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

# Seed database
echo ""
echo "🌱 Seeding database..."
npm run db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎉 You're ready to go!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your ANTHROPIC_API_KEY"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  npm run dev        - Start development server"
echo "  npm run db:studio  - Open Prisma Studio (database GUI)"
echo ""
