'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TenantSettings {
  id: string;
  name: string;
  domain: string | null;
  customDomains: string[];
  websiteUrl: string | null;
  businessDescription: string | null;
  logoUrl: string | null;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  keyPreview: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [customDomains, setCustomDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [businessContext, setBusinessContext] = useState<any>(null);
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('never');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchApiKeys();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/v1/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.tenant);
        setName(data.tenant.name || '');
        setDomain(data.tenant.domain || '');
        setCustomDomains(data.tenant.customDomains || []);
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
          domain,
          customDomains,
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

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    if (customDomains.includes(newDomain.trim())) {
      alert('Domain already added');
      return;
    }
    setCustomDomains([...customDomains, newDomain.trim()]);
    setNewDomain('');
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    setCustomDomains(customDomains.filter(d => d !== domainToRemove));
  };

  const fetchApiKeys = async () => {
    try {
      const res = await fetch('/api/v1/api-keys');
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.apiKeys);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      alert('Please enter a name for the API key');
      return;
    }

    setCreatingKey(true);
    try {
      const expiresInDays = newKeyExpiry === 'never' ? null : parseInt(newKeyExpiry);
      
      const res = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          expiresInDays,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedKey(data.apiKey.key);
        setNewKeyName('');
        setNewKeyExpiry('never');
        fetchApiKeys();
      } else {
        alert('Failed to create API key');
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/api-keys/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchApiKeys();
      } else {
        alert('Failed to delete API key');
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert('Failed to delete API key');
    }
  };

  const handleToggleApiKey = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/v1/api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        fetchApiKeys();
      } else {
        alert('Failed to update API key');
      }
    } catch (error) {
      console.error('Error updating API key:', error);
      alert('Failed to update API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
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

        {/* Custom Domains */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-6">Custom Domains</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Primary Domain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg"
                placeholder="blog.yourdomain.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your main custom domain for the blog
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Domains
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDomain())}
                  className="flex-1 px-3 py-2 border border-border rounded-lg"
                  placeholder="another-domain.com"
                />
                <button
                  type="button"
                  onClick={handleAddDomain}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Add
                </button>
              </div>
              {customDomains.length > 0 && (
                <div className="space-y-2">
                  {customDomains.map((d) => (
                    <div
                      key={d}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <span className="text-sm font-mono">{d}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(d)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Add multiple domains that should point to your blog. Make sure to configure DNS records for each domain.
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">DNS Configuration</h3>
              <p className="text-xs text-blue-800 mb-2">
                For each custom domain, add a CNAME record pointing to:
              </p>
              <code className="block text-xs bg-white px-3 py-2 rounded border border-blue-200 font-mono">
                cname.vercel-dns.com
              </code>
              <p className="text-xs text-blue-800 mt-2">
                Or if using an apex domain (no subdomain), use A records pointing to Vercel's IP addresses.
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

      {/* API Keys Section (Outside form) */}
      <div className="rounded-2xl border border-border bg-card p-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">API Keys</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage API keys for programmatic access to your content
            </p>
          </div>
          <button
            onClick={() => setShowNewKeyModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Create API Key
          </button>
        </div>

        {apiKeys.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No API keys yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{key.name}</h3>
                    {!key.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        Inactive
                      </span>
                    )}
                    {key.expiresAt && new Date(key.expiresAt) < new Date() && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded">
                        Expired
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="font-mono">{key.key}</span>
                    {key.lastUsedAt && (
                      <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                    )}
                    {key.expiresAt && (
                      <span>Expires: {new Date(key.expiresAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleApiKey(key.id, key.isActive)}
                    className="px-3 py-1 text-sm border border-border rounded hover:bg-muted"
                  >
                    {key.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteApiKey(key.id)}
                    className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Using API Keys</h3>
          <p className="text-xs text-blue-800 mb-2">
            Include your API key in the Authorization header:
          </p>
          <code className="block text-xs bg-white px-3 py-2 rounded border border-blue-200 font-mono">
            Authorization: Bearer YOUR_API_KEY
          </code>
          <p className="text-xs text-blue-800 mt-2">
            API endpoint: <span className="font-mono">/api/v1/content/*</span>
          </p>
        </div>
      </div>

      {/* Create API Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Create API Key</h3>
            
            {createdKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 mb-2 font-medium">
                    API Key Created Successfully!
                  </p>
                  <p className="text-xs text-green-700 mb-3">
                    Make sure to copy your API key now. You won't be able to see it again!
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white px-3 py-2 rounded border border-green-200 font-mono break-all">
                      {createdKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(createdKey)}
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCreatedKey(null);
                    setShowNewKeyModal(false);
                  }}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg"
                    placeholder="e.g., Production API Key"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Expiration
                  </label>
                  <select
                    value={newKeyExpiry}
                    onChange={(e) => setNewKeyExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg"
                  >
                    <option value="never">Never</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowNewKeyModal(false);
                      setNewKeyName('');
                      setNewKeyExpiry('never');
                    }}
                    disabled={creatingKey}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateApiKey}
                    disabled={creatingKey || !newKeyName.trim()}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {creatingKey ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
