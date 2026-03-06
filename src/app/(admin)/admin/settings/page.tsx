'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TenantSettings {
  id: string;
  name: string;
  websiteUrl: string | null;
  businessDescription: string | null;
  logoUrl: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [businessContext, setBusinessContext] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/v1/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.tenant);
        setName(data.tenant.name || '');
        setWebsiteUrl(data.tenant.websiteUrl || '');
        setBusinessDescription(data.tenant.businessDescription || '');
        setLogoUrl(data.tenant.logoUrl || '');
        setBusinessContext(data.tenant.businessContext || null);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/v1/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          websiteUrl,
          businessDescription,
          logoUrl,
        }),
      });

      if (res.ok) {
        alert('Settings saved successfully!');
        fetchSettings();
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl) {
      alert('Please enter a website URL first');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        setBusinessContext(data.analysis);
        setBusinessDescription(
          `${data.analysis.businessType} specializing in ${data.analysis.keyServices.join(', ')}. Target audience: ${data.analysis.targetAudience}.`
        );
        alert('Website analyzed successfully! Business description has been updated.');
      } else {
        alert('Failed to analyze website');
      }
    } catch (error) {
      console.error('Error analyzing website:', error);
      alert('Failed to analyze website');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and business information
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Business Profile */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-6">Business Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg"
                placeholder="Your Business Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Website URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-lg"
                  placeholder="https://example.com"
                />
                <button
                  type="button"
                  onClick={handleAnalyzeWebsite}
                  disabled={analyzing || !websiteUrl}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze Website'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                AI will analyze your website to extract business context and suggest topics
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Business Description
              </label>
              <textarea
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg"
                rows={4}
                placeholder="Describe your business and what you do..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                This helps the AI generate more relevant content for your business
              </p>
            </div>

            {businessContext && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="text-sm font-semibold mb-2">AI-Extracted Business Context</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Business Type:</span>{' '}
                    <span className="font-medium">{businessContext.businessType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Industry:</span>{' '}
                    <span className="font-medium">{businessContext.industry}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target Audience:</span>{' '}
                    <span className="font-medium">{businessContext.targetAudience}</span>
                  </div>
                  {businessContext.keyServices && businessContext.keyServices.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Key Services:</span>{' '}
                      <span className="font-medium">{businessContext.keyServices.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Branding */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-6">Branding</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg"
                placeholder="https://example.com/logo.png"
              />
              {logoUrl && (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Blog Configuration */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-6">Blog Configuration</h2>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Your blog is available at:{' '}
                <a
                  href="/blog"
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  /blog
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/dashboard')}
            className="px-6 py-2 border border-border rounded-lg hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
