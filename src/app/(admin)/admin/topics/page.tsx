'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Topic {
  id: string;
  name: string;
  slug: string;
  isCustom: boolean;
  _count: {
    articles: number;
  };
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/v1/topics');
      const data = await res.json();
      setTopics(data.topics);
    } catch (err) {
      setError('Failed to load topics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setError('');
    try {
      const res = await fetch('/api/v1/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inputValue.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add topic');
        return;
      }

      setTopics([data.topic, ...topics]);
      setInputValue('');
    } catch (err) {
      setError('Failed to add topic');
    }
  };

  const handleDeleteTopic = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/topics/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to delete topic');
        return;
      }

      setTopics(topics.filter((t) => t.id !== id));
    } catch (err) {
      setError('Failed to delete topic');
    }
  };

  const handleSuggestTopics = async () => {
    setIsSuggesting(true);
    setError('');
    try {
      const res = await fetch('/api/ai/suggest-topics', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to suggest topics');
        return;
      }

      setSuggestedTopics(data.topics);
    } catch (err) {
      setError('Failed to suggest topics. Make sure you have analyzed your website in Settings first.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAddSuggestedTopic = async (topicName: string) => {
    setError('');
    try {
      const res = await fetch('/api/v1/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: topicName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add topic');
        return;
      }

      setTopics([data.topic, ...topics]);
      setSuggestedTopics(suggestedTopics.filter(t => t !== topicName));
    } catch (err) {
      setError('Failed to add topic');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setInputValue('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading topics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Topics</h1>
            <p className="text-muted-foreground mt-2">
              Manage your content topics. Add topics to organize your articles.
            </p>
          </div>
          <button
            onClick={handleSuggestTopics}
            disabled={isSuggesting}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isSuggesting ? 'Suggesting...' : 'Suggest Topics'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <form onSubmit={handleAddTopic} className="mb-6">
          <label htmlFor="topic-input" className="block text-sm font-medium mb-2">
            Add a topic
          </label>
          <div className="flex gap-2">
            <input
              id="topic-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Real Estate, Healthcare, Technology..."
              className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to add, Escape to clear
          </p>
        </form>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
            </span>
          </div>

          {topics.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No topics yet. Add your first topic above.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {topics.map((topic) => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="group flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm hover:bg-primary/20 transition-colors"
                  >
                    <span className="font-medium">{topic.name}</span>
                    {topic._count.articles > 0 && (
                      <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                        {topic._count.articles}
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete topic"
                    >
                      <X className="h-3.5 w-3.5 hover:text-destructive" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {suggestedTopics.length > 0 && (
        <div className="rounded-2xl border border-primary/50 bg-primary/5 p-6">
          <h2 className="text-lg font-semibold mb-4">AI-Suggested Topics</h2>
          <div className="flex flex-wrap gap-2">
            {suggestedTopics.map((topic, index) => (
              <button
                key={index}
                onClick={() => handleAddSuggestedTopic(topic)}
                className="flex items-center gap-2 rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{topic}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Click any topic to add it to your list
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-2">Tips</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Topics help organize your content by subject area</li>
          <li>• You can&apos;t delete topics that have articles</li>
          <li>• Topics are used when generating location-specific content</li>
          <li>• Keep topic names short and descriptive</li>
        </ul>
      </div>
    </div>
  );
}
