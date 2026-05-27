import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function Settings() {
  const [settings, setSettings] = useState({
    github_token: '',
    webhook_secret: '',
    scan_interval: '60',
    github_token_masked: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    api('/settings')
      .then(r => r.json())
      .then(data => setSettings(prev => ({ ...prev, ...data })))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const body = {};
      if (settings.github_token) body.github_token = settings.github_token;
      if (settings.scan_interval) body.scan_interval = settings.scan_interval;

      await api('/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('Failed to save settings');
    }
    setSaving(false);
  };

  const handleReset = async () => {
    await api('/settings/reset-data', { method: 'POST' });
    setResetConfirm(false);
    alert('All data has been reset.');
  };

  const webhookUrl = `${window.location.origin}/api/webhook`;

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-content mx-auto px-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-figma-gray text-sm mb-10">Configure GitHub integration and monitoring preferences.</p>

          {/* GitHub Token */}
          <section className="mb-10">
            <h2 className="font-semibold text-lg mb-4">GitHub Token</h2>
            <div className="card p-5">
              <label className="block text-sm font-medium mb-2">
                Personal Access Token
              </label>
              <input
                type="password"
                value={settings.github_token}
                onChange={(e) => setSettings({ ...settings, github_token: e.target.value })}
                placeholder={settings.github_token_masked || 'ghp_...'}
                className="w-full px-3 py-2.5 border border-figma-border rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent-purple/20 focus:border-accent-purple
                           font-mono"
              />
              <p className="text-xs text-figma-gray mt-2 leading-relaxed">
                Create a token at{' '}
                <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer"
                   className="text-accent-purple hover:underline"
                >GitHub Settings &rarr; Developer settings &rarr; Personal access tokens</a>.
                No specific scopes are required for public repository search.
              </p>
            </div>
          </section>

          {/* Webhook */}
          <section className="mb-10">
            <h2 className="font-semibold text-lg mb-4">Webhook</h2>
            <div className="card p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Webhook URL</label>
                <div className="bg-gray-50 border border-figma-border rounded-lg px-4 py-2.5 text-sm font-mono text-figma-black select-all">
                  {webhookUrl}
                </div>
                <p className="text-xs text-figma-gray mt-2">
                  Add this URL to your GitHub repository's webhook settings for real-time updates.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Webhook Secret</label>
                <input
                  type="text"
                  value={settings.webhook_secret}
                  onChange={(e) =>
                    setSettings({ ...settings, webhook_secret: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-figma-border rounded-lg text-sm font-mono
                             focus:outline-none focus:ring-2 focus:ring-accent-purple/20 focus:border-accent-purple"
                />
              </div>
            </div>
          </section>

          {/* Scan Interval */}
          <section className="mb-10">
            <h2 className="font-semibold text-lg mb-4">Scan Settings</h2>
            <div className="card p-5">
              <label className="block text-sm font-medium mb-2">Auto-scan interval (minutes)</label>
              <select
                value={settings.scan_interval}
                onChange={(e) => setSettings({ ...settings, scan_interval: e.target.value })}
                className="px-3 py-2.5 border border-figma-border rounded-lg text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
              >
                <option value="30">Every 30 minutes</option>
                <option value="60">Every hour</option>
                <option value="180">Every 3 hours</option>
                <option value="360">Every 6 hours</option>
                <option value="1440">Once daily</option>
              </select>
            </div>
          </section>

          {/* Save */}
          <div className="flex items-center gap-3 mb-10">
            <button
              onClick={handleSave}
              disabled={saving}
              className="gradient-btn text-sm"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            {saved && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
          </div>

          {/* Danger zone */}
          <section className="border-t border-figma-border pt-8">
            <h2 className="font-semibold text-lg text-red-500 mb-4">Danger Zone</h2>
            <div className="card p-5 border-red-200">
              <p className="text-sm text-figma-gray mb-3">
                Reset all data including scanned skills, watched list, and update history.
              </p>
              {resetConfirm ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setResetConfirm(false)}
                    className="text-sm text-figma-gray hover:text-figma-black"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="px-4 py-2 border border-red-200 text-red-500 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  Reset All Data
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
