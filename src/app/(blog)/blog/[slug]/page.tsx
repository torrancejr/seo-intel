import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Tag, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';

export const revalidate = 3600; // Revalidate every hour

interface ArticlePageProps {
  params: { slug: string };
}

async function getArticle(slug: string) {
  return db.article.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
    },
    include: {
      topic: true,
      city: true,
      tenant: true,
    },
  });
}

async function getRelatedArticles(topicId: string, currentArticleId: string) {
  return db.article.findMany({
    where: {
      topicId,
      status: 'PUBLISHED',
      id: { not: currentArticleId },
    },
    include: {
      topic: true,
      city: true,
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  });
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const article = await getArticle(params.slug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || undefined,
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDescription || undefined,
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      authors: [article.tenant.name],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticle(params.slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(
    article.topicId,
    article.id
  );

  // Generate JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription,
    author: {
      '@type': 'Organization',
      name: article.tenant.name,
    },
    publisher: {
      '@type': 'Organization',
      name: article.tenant.name,
    },
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/blog" className="hover:text-gray-900">
            Blog
          </Link>
          <span>/</span>
          <Link
            href={`/blog/topics/${article.topic.slug}`}
            className="hover:text-gray-900"
          >
            {article.topic.name}
          </Link>
          {article.city && (
            <>
              <span>/</span>
              <Link
                href={`/blog/cities/${article.city.slug}`}
                className="hover:text-gray-900"
              >
                {article.city.name}
              </Link>
            </>
          )}
        </nav>

        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Articles
        </Link>

        {/* Article Header */}
        <header className="mb-12">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
              <Tag className="h-4 w-4" />
              {article.topic.name}
            </span>
            {article.city && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
                <MapPin className="h-4 w-4" />
                {article.city.name}, {article.city.stateCode}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Draft'}
            </span>
            {article.readingTimeMin && (
              <span>{article.readingTimeMin} min read</span>
            )}
            {article.wordCount && (
              <span>{article.wordCount.toLocaleString()} words</span>
            )}
          </div>
        </header>

        {/* Article Content */}
        <article className="prose prose-lg max-w-none mb-16">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {article.content}
          </ReactMarkdown>
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="group"
                >
                  <article className="rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md">
                    <h3 className="font-semibold mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                    {related.city && (
                      <p className="text-sm text-gray-600">
                        {related.city.name}, {related.city.stateCode}
                      </p>
                    )}
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
