'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface BatchItem {
  id: string;
  cityId: string;
  status: string;
  articleId: string | null;
  error: string | null;
  city: {
    name: string;
    stateCode: string;
  };
}

interface Batch {
  id: string;
  status: string;
  totalArticles: number;
  completedCount: number;
  failedCount: number;
  topic: {
    name: string;
  };
  batchItems: BatchItem[];
  createdAt: string;
}

export default function BatchStatusPage() {
  const params = useParams();
  const router = useRouter();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatch();
    const interval = setInterval(fetchBatch, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchBatch = async () => {
    try {
      const res = await fetch(`/api/ai/batch-generate/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setBatch(data.batch);
      }
    } catch (error) {
      console.error('Error fetching batch:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading batch status...</div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Batch not found</div>
      </div>
    );
  }

  const progress = (batch.completedCount + batch.failedCount) / batch.totalArticles * 100;
  const isComplete = batch.status === 'COMPLETE' || batch.status === 'PARTIAL_FAILURE';

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/batch-generate"
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Back to Batch Generate
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Batch Generation Status</h1>
        <p className="text-muted-foreground mt-2">
          Topic: {batch.topic.name}
        </p>
      </div>

      {/* Progress Card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Progress</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            batch.status === 'COMPLETE' ? 'bg-green-100 text-green-700' :
            batch.status === 'PARTIAL_FAILURE' ? 'bg-yellow-100 text-yellow-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {batch.status === 'IN_PROGRESS' ? 'Generating...' : batch.status.replace('_', ' ')}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {batch.completedCount + batch.failedCount} of {batch.totalArticles} processed
            </span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{batch.completedCount}</div>
            <div className="text-sm text-green-600">Completed</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-700">{batch.failedCount}</div>
            <div className="text-sm text-red-600">Failed</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">
              {batch.totalArticles - batch.completedCount - batch.failedCount}
            </div>
            <div className="text-sm text-blue-600">Remaining</div>
          </div>
        </div>

        {isComplete && (
          <div className="mt-6 flex gap-3">
            <Link
              href="/admin/articles"
              className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 text-center"
            >
              View All Articles
            </Link>
            <Link
              href="/admin/batch-generate"
              className="flex-1 border border-border px-6 py-3 rounded-lg font-medium hover:bg-muted text-center"
            >
              Start New Batch
            </Link>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Articles</h2>
        </div>
        <div className="divide-y divide-border">
          {batch.batchItems.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  item.status === 'COMPLETE' ? 'bg-green-500' :
                  item.status === 'FAILED' ? 'bg-red-500' :
                  item.status === 'GENERATING' ? 'bg-blue-500 animate-pulse' :
                  'bg-gray-300'
                }`} />
                <div>
                  <div className="font-medium">
                    {item.city.name}, {item.city.stateCode}
                  </div>
                  {item.error && (
                    <div className="text-sm text-red-600 mt-1">{item.error}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm px-2 py-1 rounded ${
                  item.status === 'COMPLETE' ? 'bg-green-100 text-green-700' :
                  item.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                  item.status === 'GENERATING' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {item.status}
                </span>
                {item.articleId && item.status === 'COMPLETE' && isComplete && (
                  <Link
                    href={`/admin/articles/${item.articleId}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View Article
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
