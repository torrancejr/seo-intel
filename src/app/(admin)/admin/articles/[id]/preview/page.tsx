import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Tag, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PreviewPageProps {
  params: { id: string };
}

async function getArticle(id: string) {
  return db.article.findUnique({
    where: { id },
    include: {
      topic: true,
      city: true,
      tenant: true,
    },
  });
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const article = await getArticle(params.id);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Banner */}
      <div className="bg-amber-500 text-white px-4 py-3 text-center">
        <p className="text-sm font-medium">
          Preview Mode - Status: {article.status}
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          href="/admin/articles"
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
                : 'Not Published'}
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
        <article className="prose prose-lg max-w-none mb-16 bg-white rounded-xl p-8 shadow-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {article.content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
