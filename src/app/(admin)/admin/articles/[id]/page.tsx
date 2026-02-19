'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  wordCount: number;
  readingTimeMin: number;
  status: string;
  createdAt: string;
  topic: { name: string };
  city: { name: string; stateCode: string };
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [params.id]);

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/v1/articles/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setArticle(data.article);
      }
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading article...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Article not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/articles')}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
        >
          ← Back to Articles
        </button>
        
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            article.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
            article.status === 'REVIEW' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {article.status}
          </span>
          <span className="text-sm text-gray-500">
            {article.wordCount.toLocaleString()} words · {article.readingTimeMin} min read
          </span>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {article.title}
        </h1>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
            {article.topic.name}
          </span>
          <span>
            📍 {article.city.name}, {article.city.stateCode}
          </span>
          <span>
            {new Date(article.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* SEO Meta */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">SEO Metadata</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Meta Title</label>
            <p className="text-gray-900">{article.metaTitle}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Meta Description</label>
            <p className="text-gray-900">{article.metaDescription}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Slug</label>
            <p className="text-gray-900 font-mono text-sm">/{article.slug}</p>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 py-16 bg-white
        [&>h1]:text-5xl [&>h1]:font-bold [&>h1]:mb-8 [&>h1]:leading-[1.1] [&>h1]:tracking-tight [&>h1]:text-gray-900
        [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:mt-20 [&>h2]:mb-6 [&>h2]:leading-[1.2] [&>h2]:tracking-tight [&>h2]:text-gray-900
        [&>h3]:text-2xl [&>h3]:font-semibold [&>h3]:mt-12 [&>h3]:mb-4 [&>h3]:leading-[1.3] [&>h3]:text-gray-900
        [&>p]:text-[19px] [&>p]:text-gray-700 [&>p]:leading-[1.7] [&>p]:mb-7 [&>p]:font-normal
        [&>p>strong]:text-gray-900 [&>p>strong]:font-semibold
        [&>ul]:my-8 [&>ul]:space-y-2 [&>ul]:pl-0
        [&>ul>li]:text-[19px] [&>ul>li]:text-gray-700 [&>ul>li]:leading-[1.7] [&>ul>li]:pl-0 [&>ul>li]:list-none [&>ul>li]:mb-2
        [&>ul>li::before]:content-['•'] [&>ul>li::before]:text-blue-600 [&>ul>li::before]:font-bold [&>ul>li::before]:mr-3
        [&>ol]:my-8 [&>ol]:space-y-2 [&>ol]:pl-6
        [&>ol>li]:text-[19px] [&>ol>li]:text-gray-700 [&>ol>li]:leading-[1.7]
        [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-6 [&>blockquote]:py-3 [&>blockquote]:my-10 [&>blockquote]:italic [&>blockquote]:text-gray-600 [&>blockquote]:text-[19px]
        [&>hr]:my-16 [&>hr]:border-gray-200
        [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-1 hover:[&_a]:text-blue-700
        [&>pre]:bg-gray-50 [&>pre]:p-6 [&>pre]:rounded-lg [&>pre]:my-8 [&>pre]:overflow-x-auto [&>pre]:border [&>pre]:border-gray-200
        [&_code]:text-[17px] [&_code]:font-mono [&_code]:bg-gray-100 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-gray-800
        [&>table]:w-full [&>table]:my-10 [&>table]:border-collapse
        [&_th]:bg-gray-50 [&_th]:px-6 [&_th]:py-4 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-900 [&_th]:border-b [&_th]:border-gray-200
        [&_td]:px-6 [&_td]:py-4 [&_td]:text-gray-700 [&_td]:border-b [&_td]:border-gray-100
      ">
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </article>
    </div>
  );
}
