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
  const cityName = article.city?.name || '';
  const cityMentions = cityName ? (content.match(new RegExp(cityName, 'gi')) || []).length : 0;
  const headingCount = (content.match(/^#{1,3}\s/gm) || []).length;

  // Quality checks
  const checks = {
    wordCount: {
      label: 'Word Count',
      value: wordCount,
      target: '1,500-2,000',
      status: wordCount >= 1500 && wordCount <= 2000 ? 'good' : wordCount >= 1200 ? 'warning' : 'error',
    },
    metaTitle: {
      label: 'Meta Title',
      value: metaTitle.length,
      target: '55-60 chars',
      status: metaTitle.length >= 55 && metaTitle.length <= 60 ? 'good' : metaTitle.length >= 50 ? 'warning' : 'error',
    },
    metaDescription: {
      label: 'Meta Description',
      value: metaDescription.length,
      target: '150-160 chars',
      status: metaDescription.length >= 150 && metaDescription.length <= 160 ? 'good' : metaDescription.length >= 140 ? 'warning' : 'error',
    },
    cityMentions: {
      label: 'City Mentions',
      value: cityMentions,
      target: '7+ times',
      status: cityMentions >= 7 ? 'good' : cityMentions >= 4 ? 'warning' : 'error',
    },
    headings: {
      label: 'Headings (H1-H3)',
      value: headingCount,
      target: '6-10',
      status: headingCount >= 6 && headingCount <= 10 ? 'good' : headingCount >= 4 ? 'warning' : 'error',
    },
  };

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

      {/* Editor + Preview + Quality Sidebar */}
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
        <div className="w-1/3 bg-gray-50 overflow-auto">
          <div className="max-w-3xl mx-auto px-8 py-12">
            <article className="prose prose-lg max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </article>
          </div>
        </div>

        {/* Quality Checklist Sidebar */}
        <div className="w-1/6 border-l border-border bg-card overflow-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-4">Quality Checklist</h3>
            <div className="space-y-3">
              {Object.entries(checks).map(([key, check]) => (
                <div key={key} className="pb-3 border-b border-border last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{check.label}</span>
                    {check.status === 'good' && (
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {check.status === 'warning' && (
                      <svg className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    {check.status === 'error' && (
                      <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {check.value} / {check.target}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">Overall Quality</div>
              <div className="flex gap-1">
                {Object.values(checks).map((check, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded ${
                      check.status === 'good' ? 'bg-green-500' :
                      check.status === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
