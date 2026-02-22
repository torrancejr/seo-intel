import { db } from '@/lib/db';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Get all published articles
  const articles = await db.article.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  // Get all topics with published articles
  const topics = await db.topic.findMany({
    where: {
      articles: {
        some: {
          status: 'PUBLISHED',
        },
      },
    },
    select: {
      slug: true,
    },
  });

  // Get all cities with published articles
  const cities = await db.city.findMany({
    where: {
      articles: {
        some: {
          status: 'PUBLISHED',
        },
      },
    },
    select: {
      slug: true,
    },
  });

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ];

  // Article pages
  const articlePages = articles.map((article) => ({
    url: `${baseUrl}/blog/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Topic pages
  const topicPages = topics.map((topic) => ({
    url: `${baseUrl}/blog/topics/${topic.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // City pages
  const cityPages = cities.map((city) => ({
    url: `${baseUrl}/blog/cities/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...articlePages, ...topicPages, ...cityPages];
}
