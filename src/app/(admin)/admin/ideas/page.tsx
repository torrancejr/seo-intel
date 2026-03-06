'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, Check, X, Sparkles, TrendingUp } from 'lucide-react';

interface ArticleIdea {
  id: string;
  suggestedTitle: string;
  suggestedOutline: {
    sections: string[];
    keyPoints: string[];
  };
  seoKeywords: string[];
  estimatedVolume: number;
  status: string;
  topic: {
    name: string;
  };
  city: {
    name: string;
    stateCode: string;
  } | null;
  createdAt: string;
}

interface Topic {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
  stateCode: string;
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<ArticleIdea[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Form state
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [ideaCount, setIdeaCount] = useState(3);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ideasRes, topicsRes, citiesRes] = await Promise.all([
        fetch('/api/v1/ideas'),
        fetch('/api/v1/topics'),
        fetch('/api/v1/tenant-cities'),
      ]);

      const [ideasData, topicsData, citiesData] = await Promise.all([
        ideasRes.json(),
        topicsRes.json(),
        citiesRes.json(),
      ]);

      setIdeas(ideasData.ideas || []);
      setTopics(topicsData.topics || []);
      setCities(citiesData.cities || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!selectedTopic || selectedCities.length === 0) {
      alert('Please select a topic and at least one city');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopic,
          cityIds: selectedCities,
          count: ideaCount,
        }),
      });

      if (res.ok) {
        alert('Ideas generated successfully!');
        fetchData();
        setSelectedTopic('');
        setSelectedCities([]);
      } else {
        alert('Failed to generate ideas');
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      alert('Failed to generate ideas');
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptIdea = async (ideaId: string) => {
    try {
      const res = await fetch(`/api/v1/ideas/${ideaId}/accept`, {
        method: 'POST',
      });

      if (res.ok) {
        setIdeas(ideas.map(idea => 
          idea.id === ideaId ? { ...idea, status: 'ACCEPTED' } : idea
        ));
      }
    } catch (error) {
      console.error('Error accepting idea:', error);
    }
  };

  const handleRejectIdea = async (ideaId: string) => {
    try {
      const res = await fetch(`/api/v1/ideas/${ideaId}/reject`, {
        method: 'POST',
      });

      if (res.ok) {
        setIdeas(ideas.map(idea => 
          idea.id === ideaId ? { ...idea, status: 'REJECTED' } : idea
        ));
      }
    } catch (error) {
      console.error('Error rejecting idea:', error);
    }
  };

  const handleGenerateFromIdea = async (ideaId: string) => {
    if (!confirm('Generate a full article from this idea?')) return;

    try {
      const res = await fetch(`/api/v1/ideas/${ideaId}/generate`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        alert('Article generated successfully!');
        window.location.href = `/admin/articles/${data.articleId}`;
      } else {
        alert('Failed to generate article');
      }
    } catch (error) {
      console.error('Error generating article:', error);
      alert('Failed to generate article');
    }
  };

  const suggestedIdeas = ideas.filter(i => i.status === 'SUGGESTED');
  const acceptedIdeas = ideas.filter(i => i.status === 'ACCEPTED');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading ideas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Article Ideas</h1>
        <p className="text-muted-foreground mt-2">
          Generate article ideas before creating full content
        </p>
      </div>

      {/* Generate Ideas Form */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold mb-6">Generate New Ideas</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Topic</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg"
            >
              <option value="">Select a topic...</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Cities ({selectedCities.length} selected)
            </label>
            <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg max-h-40 overflow-y-auto">
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => {
                    if (selectedCities.includes(city.id)) {
                      setSelectedCities(selectedCities.filter(id => id !== city.id));
                    } else {
                      setSelectedCities([...selectedCities, city.id]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedCities.includes(city.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {city.name}, {city.stateCode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Number of Ideas: {ideaCount}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={ideaCount}
              onChange={(e) => setIdeaCount(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={handleGenerateIdeas}
            disabled={generating || !selectedTopic || selectedCities.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Sparkles className="h-5 w-5" />
            {generating ? 'Generating Ideas...' : 'Generate Ideas'}
          </button>
        </div>
      </div>

      {/* Suggested Ideas */}
      {suggestedIdeas.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold">
              Suggested Ideas ({suggestedIdeas.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {suggestedIdeas.map((idea) => (
              <div key={idea.id} className="p-6 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      {idea.suggestedTitle}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      <span className="inline-flex items-center gap-1">
                        <Lightbulb className="h-4 w-4" />
                        {idea.topic.name}
                      </span>
                      {idea.city && (
                        <span>
                          {idea.city.name}, {idea.city.stateCode}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        ~{idea.estimatedVolume} searches/mo
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptIdea(idea.id)}
                      className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                      title="Accept"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleRejectIdea(idea.id)}
                      className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      title="Reject"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Outline</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {idea.suggestedOutline.sections.map((section, i) => (
                        <li key={i}>• {section}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">SEO Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {idea.seoKeywords.map((keyword, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-muted rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted Ideas */}
      {acceptedIdeas.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold">
              Accepted Ideas ({acceptedIdeas.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {acceptedIdeas.map((idea) => (
              <div key={idea.id} className="p-6 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      {idea.suggestedTitle}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{idea.topic.name}</span>
                      {idea.city && (
                        <span>
                          {idea.city.name}, {idea.city.stateCode}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerateFromIdea(idea.id)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                  >
                    Generate Article
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ideas.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-semibold mb-2">No ideas yet</h3>
          <p className="text-muted-foreground mb-6">
            Generate article ideas to brainstorm content before writing
          </p>
        </div>
      )}
    </div>
  );
}
