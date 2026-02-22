'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  status: string;
  wordCount: number | null;
  topic: { name: string };
  city: { name: string; stateCode: string } | null;
}

export default function ArticleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    fetchArticle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (article && !saving) {
        handleSave(true);
      }
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article, content, metaTitle, metaDescription, status, saving]);

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/v1/articles/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setArticle(data.article);
        setContent(data.article.content);
        setMetaTitle(data.article.metaTitle || '');
        setMetaDescription(data.article.metaDescription || '');
        setStatus(data.article.status);
      }
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (isAutoSave = false) => {
    if (!article) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/articles/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          metaTitle,
          metaDescription,
          status,
        }),
      });

      if (res.ok) {
        setLastSaved(new Date());
        if (!isAutoSave) {
          alert('Article saved successfully!');
        }
      }
    } catch (error) {
      console.error('Error saving article:', error);
      if (!isAutoSave) {
        alert('Failed to save article');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this article?')) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/articles/${params.id}/publish`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('Article published successfully!');
        setStatus('PUBLISHED');
        fetchArticle();
      }
    } catch (error) {
      console.error('Error publishing article:', error);
      alert('Failed to publish article');
    } finally {
      setSaving(false);
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

  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin/articles"
              className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
            >
              ← Back to Articles
            </Link>
            <h1 className="text-2xl font-bold">{article.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {article.topic.name} • {article.city?.name}, {article.city?.stateCode}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-sm text-muted-foreground">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg"
            >
              <option value="DRAFT">Draft</option>
              <option value="REVIEW">Review</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {status !== 'PUBLISHED' && (
              <button
                onClick={handlePublish}
                disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                Publish
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="w-1/2 border-r border-border flex flex-col">
          <div className="p-6 flex-1 overflow-auto">
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Meta Title ({metaTitle.length}/60)
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                  maxLength={60}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Meta Description ({metaDescription.length}/160)
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                  rows={3}
                  maxLength={160}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Content ({wordCount} words)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[600px] px-3 py-2 border border-border rounded-lg font-mono text-sm"
                placeholder="Write your article content in markdown..."
              />
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="w-1/2 bg-gray-50 overflow-auto">
          <div className="max-w-3xl mx-auto px-8 py-12">
            <article className="prose prose-lg max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
