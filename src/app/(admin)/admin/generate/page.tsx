'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

interface Topic {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
  stateCode: string;
}

interface GeneratedArticle {
  metaTitle: string;
  metaDescription: string;
  content: string;
  wordCount: number;
  title: string;
  topicId: string;
  cityId: string;
}

export default function GeneratePage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<GeneratedArticle | null>(null);

  useEffect(() => {
    fetchTopics();
    fetchCities();
  }, []);

  const fetchTopics = async () => {
    const res = await fetch('/api/v1/topics');
    const data = await res.json();
    setTopics(data.topics || []);
  };

  const fetchCities = async () => {
    const res = await fetch('/api/v1/tenant-cities');
    const data = await res.json();
    setCities(data.cities || []);
  };

  const handleGenerate = async () => {
    if (!selectedTopic || !selectedCity) {
      alert('Please select both a topic and a city');
      return;
    }

    setGenerating(true);
    setPreview(null);

    try {
      const res = await fetch('/api/ai/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopic,
          cityId: selectedCity,
          customInstructions,
          preview: true, // Don't save yet
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const topic = topics.find(t => t.id === selectedTopic);
        const city = cities.find(c => c.id === selectedCity);
        
        setPreview({
          ...data.article,
          title: `${topic?.name} in ${city?.name}, ${city?.stateCode}`,
          topicId: selectedTopic,
          cityId: selectedCity,
        });
      } else {
        alert(data.error || 'Failed to generate article');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate article');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;

    setSaving(true);

    try {
      const res = await fetch('/api/ai/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: preview.topicId,
          cityId: preview.cityId,
          customInstructions,
          preview: false, // Save to database
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/admin/articles/${data.article.id}`);
      } else {
        alert(data.error || 'Failed to save article');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = () => {
    setPreview(null);
    handleGenerate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Article</h1>
        <p className="text-muted-foreground mt-2">
          Create a new AI-generated article for a specific topic and city
        </p>
      </div>

      {!preview ? (
        <div className="rounded-2xl border border-border bg-card p-8 max-w-2xl">
          <div className="space-y-6">
            {/* Topic Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Topic <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={generating}
              >
                <option value="">Select a topic...</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={generating}
              >
                <option value="">Select a city...</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}, {city.stateCode}
                  </option>
                ))}
              </select>
            </div>

            {/* Article Outline */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Article Outline <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder={`Title: [Article title or leave blank to auto-generate]\nAudience: [Who is this for? e.g. small business owners, homeowners, patients]\nTone: [e.g. professional, conversational, authoritative]\nKey Sections:\n  1. [Section 1 topic]\n  2. [Section 2 topic]\n  3. [Section 3 topic]\nKey Points to Cover:\n  - [Main point or argument]\n  - [Statistic or fact to include]\n  - [Call to action or takeaway]\nKeywords: [SEO keywords to weave in naturally]`}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm min-h-[220px]"
                disabled={generating}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Describe the structure and main topics the article should cover
              </p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedTopic || !selectedCity || !customInstructions.trim()}
              className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? 'Generating...' : 'Generate Article'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Preview Header */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Article Preview</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRegenerate}
                  disabled={generating}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  {generating ? 'Regenerating...' : 'Regenerate'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Article'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{preview.title}</h3>
                <div className="text-sm text-muted-foreground">
                  {preview.wordCount.toLocaleString()} words · {Math.ceil(preview.wordCount / 200)} min read
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Meta Title</label>
                  <p className="text-sm">{preview.metaTitle}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Meta Description</label>
                  <p className="text-sm">{preview.metaDescription}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="bg-white">
            <article className="max-w-4xl mx-auto px-6 py-16
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
              <ReactMarkdown>{preview.content}</ReactMarkdown>
            </article>
          </div>
        </div>
      )}
    </div>
  );
}
