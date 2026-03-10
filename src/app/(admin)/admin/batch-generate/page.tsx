'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { AlertModal } from '@/components/ui/modal';

interface Topic {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
  stateCode: string;
}

interface BatchItem {
  id: string;
  cityId: string;
  status: 'QUEUED' | 'GENERATING' | 'COMPLETE' | 'FAILED';
  error?: string;
  articleId?: string;
  city: City;
}

interface Batch {
  id: string;
  status: 'IN_PROGRESS' | 'COMPLETE' | 'PARTIAL_FAILURE';
  totalArticles: number;
  completedCount: number;
  failedCount: number;
  batchItems: BatchItem[];
}

export default function BatchGeneratePage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; variant: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
  });

  useEffect(() => {
    fetchTopics();
    fetchCities();
  }, []);

  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  const fetchTopics = async () => {
    const res = await fetch('/api/v1/topics');
    const data = await res.json();
    setTopics(data.topics);
  };

  const fetchCities = async () => {
    const res = await fetch('/api/v1/tenant-cities');
    const data = await res.json();
    setCities(data.cities);
  };

  const handleCityToggle = (cityId: string) => {
    if (selectedCityIds.includes(cityId)) {
      setSelectedCityIds(selectedCityIds.filter(id => id !== cityId));
    } else {
      if (selectedCityIds.length >= 8) {
        setAlertModal({
          isOpen: true,
          title: 'Maximum Reached',
          message: 'Maximum 8 cities allowed per batch',
          variant: 'info',
        });
        return;
      }
      setSelectedCityIds([...selectedCityIds, cityId]);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTopicId) {
      setAlertModal({
        isOpen: true,
        title: 'Topic Required',
        message: 'Please select a topic',
        variant: 'error',
      });
      return;
    }
    if (selectedCityIds.length === 0) {
      setAlertModal({
        isOpen: true,
        title: 'Cities Required',
        message: 'Please select at least one city',
        variant: 'error',
      });
      return;
    }
    if (!customInstructions.trim()) {
      setAlertModal({
        isOpen: true,
        title: 'Article Outline Required',
        message: 'Please provide an outline of what the articles should cover',
        variant: 'error',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopicId,
          cityIds: selectedCityIds,
          customInstructions,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBatch(data.batch);
        startPolling(data.batch.id);
      } else {
        const data = await res.json();
        setAlertModal({
          isOpen: true,
          title: 'Generation Failed',
          message: data.error || 'Failed to start batch generation',
          variant: 'error',
        });
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Error starting batch:', error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to start batch generation',
        variant: 'error',
      });
      setIsGenerating(false);
    }
  };

  const startPolling = (batchId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai/batch-generate/${batchId}`);
        if (res.ok) {
          const data = await res.json();
          setBatch(data.batch);

          if (data.batch.status !== 'IN_PROGRESS') {
            clearInterval(interval);
            setIsGenerating(false);
          }
        }
      } catch (error) {
        console.error('Error polling batch:', error);
      }
    }, 3000);

    setPollInterval(interval);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'GENERATING':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Batch Generate</h1>
        <p className="text-muted-foreground mt-2">
          Generate multiple articles at once (1 topic × multiple cities)
        </p>
      </div>

      {!batch ? (
        <div className="space-y-6">
          {/* Topic Selection */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Step 1: Select Topic</h2>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg"
              disabled={isGenerating}
            >
              <option value="">Choose a topic...</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          {/* City Selection */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">
              Step 2: Select Cities (max 8)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleCityToggle(city.id)}
                  disabled={isGenerating}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedCityIds.includes(city.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium text-sm">{city.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {city.stateCode}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Selected: {selectedCityIds.length} / 8
            </p>
          </div>

          {/* Article Outline */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">
              Step 3: Article Outline <span className="text-red-500">*</span>
            </h2>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Provide an outline of what the articles should cover (e.g., key points, sections, specific information to include)..."
              className="w-full px-3 py-2 border border-border rounded-lg"
              rows={5}
              disabled={isGenerating}
              required
            />
            <p className="text-xs text-muted-foreground mt-2">
              Describe the structure and main topics the articles should cover
            </p>
          </div>

          {/* Generate Button */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Ready to Generate</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedCityIds.length} article{selectedCityIds.length !== 1 ? 's' : ''} will be generated
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedTopicId || selectedCityIds.length === 0 || !customInstructions.trim()}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                {isGenerating ? 'Starting...' : 'Generate Articles'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Generation Progress</h2>
              <span className={`px-3 py-1 rounded-full text-sm ${
                batch.status === 'COMPLETE' ? 'bg-green-100 text-green-800' :
                batch.status === 'PARTIAL_FAILURE' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {batch.status.replace('_', ' ')}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{batch.completedCount + batch.failedCount} / {batch.totalArticles}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${((batch.completedCount + batch.failedCount) / batch.totalArticles) * 100}%`
                  }}
                />
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">✓ {batch.completedCount} completed</span>
                {batch.failedCount > 0 && (
                  <span className="text-red-600">✗ {batch.failedCount} failed</span>
                )}
              </div>
            </div>
          </div>

          {/* Individual Items */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">Articles</h3>
            <div className="space-y-3">
              {batch.batchItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <div className="font-medium">
                        {item.city?.name || 'Unknown'}, {item.city?.stateCode || ''}
                      </div>
                      {item.error && (
                        <div className="text-xs text-red-600 mt-1">{item.error}</div>
                      )}
                    </div>
                  </div>
                  {item.articleId && (
                    <a
                      href={`/admin/articles/${item.articleId}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Article
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {batch.status !== 'IN_PROGRESS' && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setBatch(null);
                  setSelectedTopicId('');
                  setSelectedCityIds([]);
                  setCustomInstructions('');
                }}
                className="px-6 py-2 border border-border rounded-lg hover:bg-muted"
              >
                Generate Another Batch
              </button>
              <button
                onClick={() => router.push('/admin/articles')}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                View All Articles
              </button>
            </div>
          )}
        </div>
      )}

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </div>
  );
}
