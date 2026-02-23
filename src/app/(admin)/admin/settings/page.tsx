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
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg"
                placeholder="https://example.com"
              />
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
