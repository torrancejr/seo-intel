'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, MapPin, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              <span className="text-xl font-semibold tracking-tight">SEOIntel</span>
            </div>
            <div className="hidden items-center gap-8 md:flex">
              <a href="#how-it-works" className="text-sm text-quiet hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#features" className="text-sm text-quiet hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm text-quiet hover:text-foreground transition-colors">
                Pricing
              </a>
              <Link
                href="/admin"
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-quiet">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Content Generation</span>
            </div>
            <h1 className="text-display-1 font-bold tracking-tight">
              Location-Specific Content
              <br />
              <span className="text-quiet">at Scale</span>
            </h1>
            <p className="mt-6 text-lg text-quiet leading-relaxed max-w-2xl mx-auto">
              Generate hundreds of unique, SEO-optimized articles for every city you target. 
              Real data enrichment, not just city name swaps.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/admin"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
              >
                Start Generating
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                See How It Works
              </a>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            <div className="text-center">
              <div className="text-4xl font-bold">50+</div>
              <div className="mt-1 text-sm text-quiet">US Cities</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">1.5k+</div>
              <div className="mt-1 text-sm text-quiet">Words per Article</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">3-5min</div>
              <div className="mt-1 text-sm text-quiet">Generation Time</div>
            </div>
          </motion.div>
        </div>

        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl opacity-20">
            <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary to-accent" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-28 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <div className="text-sm font-medium uppercase tracking-wider text-quiet mb-4">
              The Process
            </div>
            <h2 className="text-display-2 font-bold tracking-tight">
              From Topic to Published
              <br />
              <span className="text-quiet">in Minutes</span>
            </h2>
          </motion.div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {[
              {
                icon: MapPin,
                step: '01',
                title: 'Select Cities',
                description: 'Choose from 50+ US cities with pre-loaded demographic, economic, and industry-specific data.',
              },
              {
                icon: Sparkles,
                step: '02',
                title: 'Generate Content',
                description: 'AI creates unique articles for each city, weaving in real local data—not just name swaps.',
              },
              {
                icon: TrendingUp,
                step: '03',
                title: 'Publish & Rank',
                description: 'Review, edit, and publish. Each article is optimized for local search with proper SEO metadata.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative rounded-3xl border border-border bg-card p-8 hover:shadow-lg transition-all"
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="mb-2 text-sm font-medium text-quiet">{item.step}</div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-quiet leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28 border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <div className="text-sm font-medium uppercase tracking-wider text-quiet mb-4">
              Features
            </div>
            <h2 className="text-display-2 font-bold tracking-tight">
              Everything You Need
              <br />
              <span className="text-quiet">to Scale Content</span>
            </h2>
          </motion.div>

          <div className="mt-16 grid gap-6 lg:grid-cols-2">
            {[
              {
                icon: Zap,
                title: 'Batch Generation',
                description: 'Generate up to 8 articles at once. One topic × multiple cities = instant content library.',
              },
              {
                icon: MapPin,
                title: 'Real City Data',
                description: 'Census demographics, BLS economic data, and industry-specific stats automatically enriched.',
              },
              {
                icon: TrendingUp,
                title: 'SEO Optimized',
                description: 'Meta titles, descriptions, structured data, and internal linking suggestions built-in.',
              },
              {
                icon: Sparkles,
                title: 'AI-Powered Editor',
                description: 'Regenerate sections, suggest improvements, and maintain consistent quality across all articles.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="flex gap-4 rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <feature.icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-quiet leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 lg:px-16 lg:py-20"
          >
            <div className="relative z-10 mx-auto max-w-2xl text-center">
              <h2 className="text-display-2 font-bold tracking-tight text-primary-foreground">
                Ready to Scale Your Content?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80">
                Start generating location-specific content that actually ranks.
              </p>
              <div className="mt-8">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-medium text-foreground hover:bg-background/90 transition-colors"
                >
                  Get Started Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="absolute inset-0 -z-0 bg-gradient-to-br from-primary/50 to-accent/50 opacity-20" />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">SEOIntel</span>
            </div>
            <p className="text-sm text-quiet">
              © 2026 SEOIntel. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
