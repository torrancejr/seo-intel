import { db } from '@/lib/db';
import Link from 'next/link';
import { Tag } from 'lucide-react';

export const revalidate = 3600;

async function getTopicsWithArticleCount() {
  const topics = await db.topic.findMany({
    include: {
      _count: {
        select: {
          articles: {
            where: {
              status: 'PUBLISHED',
            },
          },
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return topics.filter((topic) => topic._count.articles > 0);
}

export default async function TopicsIndexPage() {
  const topics = await getTopicsWithArticleCount();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <Link
          href="/blog"
          className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Back to Blog
        </Link>
        <h1 className="text-5xl font-bold tracking-tight mb-4">Topics</h1>
        <p className="text-xl text-gray-600">
          Browse articles by topic
        </p>
      </div>

      {topics.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No topics with published articles yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/blog/topics/${topic.slug}`}
              className="group"
            >
              <div className="rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-start justify-between mb-3">
                  <Tag className="h-6 w-6 text-blue-600" />
                  <span className="text-sm text-gray-500">
                    {topic._count.articles}{' '}
                    {topic._count.articles === 1 ? 'article' : 'articles'}
                  </span>
                </div>
                <h2 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                  {topic.name}
                </h2>
                {topic.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {topic.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
