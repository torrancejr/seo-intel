'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Topic {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
  stateCode: string;
}

export default function BatchGeneratePage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const toggleCity = (cityId: string) => {
    setSelectedCities(prev =>
      prev.includes(cityId)
        ? prev.filter(id => id !== cityId)
        : [...prev, cityId]
    );
  };

  const selectAll = () => {
    const filtered = filteredCities();
    setSelectedCities(filtered.map(c => c.id));
  };

  const deselectAll = () => {
    setSelectedCities([]);
  };

  const filteredCities = () => {
    if (!searchQuery) return cities;
    return cities.filter(city =>
      city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.stateCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleGenerate = async () => {
    if (!selectedTopic || selectedCities.length === 0) {
      alert('Please select a topic and at least one city');
      return;
    }

    if (selectedCities.length > 50) {
      alert('Maximum 50 cities per batch');
      return;
    }

    setGenerating(true);

    try {
      const res = await fetch('/api/ai/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopic,
          cityIds: selectedCities,
          customInstructions,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/admin/batch-generate/${data.batchId}`);
      } else {
        alert(data.error || 'Failed to start batch generation');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to start batch generation');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Batch Generate Articles</h1>
        <p className="text-muted-foreground mt-2">
          Generate articles for multiple cities at once (max 50 per batch)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            
            <div className="space-y-4">
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

              {/* Custom Instructions */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Add any specific requirements..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  disabled={generating}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selected Cities:</span>
                <span className="font-semibold">{selectedCities.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Time:</span>
                <span className="font-semibold">
                  {selectedCities.length > 0 ? `~${Math.ceil(selectedCities.length * 0.5)} min` : '-'}
                </span>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !selectedTopic || selectedCities.length === 0}
              className="w-full mt-6 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? 'Starting Batch...' : `Generate ${selectedCities.length} Articles`}
            </button>
          </div>
        </div>

        {/* Right Column - City Selection */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Select Cities</h2>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-sm text-primary hover:underline"
                disabled={generating}
              >
                Select All
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                onClick={deselectAll}
                className="text-sm text-primary hover:underline"
                disabled={generating}
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cities..."
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            disabled={generating}
          />

          {/* City List */}
          <div className="max-h-[600px] overflow-y-auto space-y-2">
            {filteredCities().map((city) => (
              <label
                key={city.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedCities.includes(city.id)}
                  onChange={() => toggleCity(city.id)}
                  disabled={generating}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium">
                  {city.name}, {city.stateCode}
                </span>
              </label>
            ))}
          </div>

          {filteredCities().length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No cities found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
