import { db } from '@/lib/db';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

export const revalidate = 3600;

async function getCitiesWithArticleCount() {
  const cities = await db.city.findMany({
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

  return cities.filter((city) => city._count.articles > 0);
}

export default async function CitiesIndexPage() {
  const cities = await getCitiesWithArticleCount();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <Link
          href="/blog"
          className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Back to Blog
        </Link>
        <h1 className="text-5xl font-bold tracking-tight mb-4">Cities</h1>
        <p className="text-xl text-gray-600">
          Browse articles by city
        </p>
      </div>

      {cities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No cities with published articles yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cities.map((city) => (
            <Link
              key={city.id}
              href={`/blog/cities/${city.slug}`}
              className="group"
            >
              <div className="rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-start justify-between mb-3">
                  <MapPin className="h-6 w-6 text-green-600" />
                  <span className="text-sm text-gray-500">
                    {city._count.articles}{' '}
                    {city._count.articles === 1 ? 'article' : 'articles'}
                  </span>
                </div>
                <h2 className="text-lg font-bold mb-1 group-hover:text-blue-600 transition-colors">
                  {city.name}
                </h2>
                <p className="text-sm text-gray-600">{city.stateCode}</p>
                {city.population && (
                  <p className="text-xs text-gray-500 mt-2">
                    Pop: {city.population.toLocaleString()}
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
