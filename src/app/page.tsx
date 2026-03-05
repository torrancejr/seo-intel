'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, MapPin, TrendingUp, Zap, CheckCircle2, BarChart3, Globe, Clock, FileText, Users } from 'lucide-react';
import Link from 'next/link';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }
};

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
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Use Cases
              </a>
              <Link
                href="/login"
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24 lg:pt-48 lg:pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            {...fadeInUp}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Content Generation</span>
            </div>
            <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold tracking-tight leading-[1.05] mb-6">
              Generate Location-Specific Content
              <br />
              <span className="text-muted-foreground">That Actually Ranks</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
              Stop writing the same article 50 times. Our AI generates unique, SEO-optimized content for every city you target—enriched with real demographic, economic, and industry data.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
              >
                Start Generating Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-sm font-medium hover:bg-muted transition-colors"
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
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-sm text-muted-foreground">US Cities</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">2.5k+</div>
              <div className="text-sm text-muted-foreground">Words/Article</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">3-5min</div>
              <div className="text-sm text-muted-foreground">Generation Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Unique Content</div>
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

      {/* Social Proof */}
      <section className="py-16 border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-sm uppercase tracking-wider text-muted-foreground mb-8">
              Trusted by content teams at
            </p>
            <div className="flex items-center justify-center gap-12 flex-wrap opacity-60">
              <div className="text-2xl font-bold">CaseIntel</div>
              <div className="text-2xl font-bold">LegalTech Co</div>
              <div className="text-2xl font-bold">RealEstate Pro</div>
              <div className="text-2xl font-bold">FinanceHub</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
                The Problem
              </div>
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight leading-tight mb-6">
                Writing location-specific content is
                <span className="text-muted-foreground"> painfully slow</span>
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="text-lg leading-relaxed">
                  You know local SEO works. But creating unique articles for 20, 50, or 100 cities means either:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-red-600" />
                    </div>
                    <span>Hiring an army of writers (expensive, inconsistent quality)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-red-600" />
                    </div>
                    <span>Copy-pasting and doing find/replace (Google penalizes duplicate content)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-red-600" />
                    </div>
                    <span>Spending weeks writing manually (doesn&apos;t scale)</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
                The Solution
              </div>
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight leading-tight mb-6">
                Generate truly unique content
                <span className="text-muted-foreground"> in minutes</span>
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="text-lg leading-relaxed">
                  SEOIntel doesn&apos;t just swap city names. It enriches every article with real local data:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Census demographics (population, age, education)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>BLS economic data (unemployment, wages, cost of living)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Industry-specific stats (legal, real estate, finance)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Natural language that reads like a human wrote it</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 lg:py-32 border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center mb-16"
          >
            <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
              The Process
            </div>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight leading-tight mb-6">
              From topic to published
              <span className="text-muted-foreground"> in 3 steps</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              No complex setup. No API integrations. Just pick your topic and cities.
            </p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                icon: MapPin,
                step: '01',
                title: 'Select Your Cities',
                description: 'Choose from 50+ US cities with pre-loaded demographic, economic, and industry data. Or add your own custom cities.',
                features: ['50+ cities ready', 'Custom city support', 'Real-time data']
              },
              {
                icon: Sparkles,
                step: '02',
                title: 'Generate Content',
                description: 'AI creates unique 2,500+ word articles for each city, weaving in real local data—not just name swaps.',
                features: ['2,500+ words', 'Unique per city', '3-5 min generation']
              },
              {
                icon: TrendingUp,
                step: '03',
                title: 'Review & Publish',
                description: 'Edit in our markdown editor, optimize SEO metadata, and publish. Each article ranks independently in search.',
                features: ['Built-in editor', 'SEO optimization', 'One-click publish']
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative rounded-3xl border border-border bg-card p-8 hover:shadow-xl transition-all"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="mb-3 text-sm font-medium text-muted-foreground">{item.step}</div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">{item.description}</p>
                <ul className="space-y-2">
                  {item.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 lg:py-32 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center mb-16"
          >
            <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Features
            </div>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight leading-tight mb-6">
              Everything you need
              <span className="text-muted-foreground"> to scale content</span>
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Batch Generation',
                description: 'Generate up to 50 articles at once. One topic × multiple cities = instant content library.',
              },
              {
                icon: BarChart3,
                title: 'Real City Data',
                description: 'Census demographics, BLS economic data, and industry stats automatically enriched.',
              },
              {
                icon: TrendingUp,
                title: 'SEO Optimized',
                description: 'Meta titles, descriptions, structured data, and internal linking built-in.',
              },
              {
                icon: FileText,
                title: 'Markdown Editor',
                description: 'Edit with live preview, regenerate sections, and maintain quality across articles.',
              },
              {
                icon: Globe,
                title: 'Multi-Tenant',
                description: 'Manage multiple brands or clients from one dashboard with isolated content.',
              },
              {
                icon: Clock,
                title: 'Fast Generation',
                description: '3-5 minutes per article. Generate 20 articles while you grab coffee.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="flex gap-4 rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-all"
              >
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-lg">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-24 lg:py-32 border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center mb-16"
          >
            <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Use Cases
            </div>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight leading-tight mb-6">
              Built for teams that
              <span className="text-muted-foreground"> need to scale</span>
            </h2>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                icon: Users,
                title: 'Law Firms',
                description: 'Generate practice area pages for every city you serve. "Personal Injury Lawyer in [City]" × 50 cities = 50 ranking opportunities.',
                example: 'Personal Injury, Family Law, Criminal Defense'
              },
              {
                icon: Globe,
                title: 'Real Estate',
                description: 'Create neighborhood guides, market reports, and investment analyses for every metro area you cover.',
                example: 'Market Reports, Buyer Guides, Investment Analysis'
              },
              {
                icon: BarChart3,
                title: 'Financial Services',
                description: 'Publish local financial planning guides, tax advice, and wealth management content for each market.',
                example: 'Tax Planning, Wealth Management, Retirement'
              },
            ].map((useCase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="rounded-3xl border border-border bg-card p-8"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <useCase.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{useCase.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">{useCase.description}</p>
                <div className="pt-4 border-t border-border">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Example Topics</div>
                  <div className="text-sm text-muted-foreground">{useCase.example}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-primary px-8 py-20 lg:px-16 lg:py-24"
          >
            <div className="relative z-10 mx-auto max-w-2xl text-center">
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-primary-foreground leading-tight mb-6">
                Ready to scale your content?
              </h2>
              <p className="text-lg text-primary-foreground/90 mb-8 leading-relaxed">
                Join content teams generating hundreds of unique, SEO-optimized articles every month.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-background px-8 py-4 text-sm font-medium text-foreground hover:bg-background/90 transition-colors shadow-lg"
                >
                  Start Generating Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-primary-foreground/20 px-8 py-4 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                >
                  Learn More
                </a>
              </div>
            </div>
            <div className="absolute inset-0 -z-0 bg-gradient-to-br from-primary/50 to-accent/50 opacity-20" />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="#use-cases" className="hover:text-foreground transition-colors">Use Cases</a></li>
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Email</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">SEOIntel</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 SEOIntel. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
