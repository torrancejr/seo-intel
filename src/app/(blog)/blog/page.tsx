import { db } from '@/lib/db';
import Link from 'next/link';
import { Calendar, MapPin, Tag } from 'lucide-react';

export const revalidate = 3600; // Revalidate every hour

async function getPublishedArticles() {
  return db.article.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      topic: true,
      city: true,
    },
    orderBy: { publishedAt: 'desc' },
    take: 12,
  });
}

export default async function BlogIndexPage() {
  const articles = await getPublishedArticles();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Location-Specific Insights
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Expert analysis and data-driven content tailored to your city
        </p>
      </div>

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No articles published yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.slug}`}
              className="group"
            >
              <article className="h-full rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    <Tag className="h-3 w-3" />
                    {article.topic.name}
                  </span>
                  {article.city && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <MapPin className="h-3 w-3" />
                      {article.city.name}, {article.city.stateCode}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h2>

                {/* Meta Description */}
                {article.metaDescription && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {article.metaDescription}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto pt-4 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString()
                      : 'Draft'}
                  </span>
                  {article.readingTimeMin && (
                    <span>{article.readingTimeMin} min read</span>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
