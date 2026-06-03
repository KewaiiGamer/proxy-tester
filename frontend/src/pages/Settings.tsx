import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../services/backend';
import { TestDomain } from '../wailsgo';
import { Settings as SettingsIcon, Plus, Trash2, Save, Globe, Clock, Cpu } from 'lucide-react';

function Settings() {
  const [domains, setDomains] = useState<TestDomain[]>([]);
  const [defaultTimeout, setDefaultTimeout] = useState(10);
  const [defaultThreads, setDefaultThreads] = useState(50);
  const [newDomainUrl, setNewDomainUrl] = useState('');
  const [newDomainName, setNewDomainName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const s = await getSettings();
    setDomains(s.domains);
    setDefaultTimeout(s.default_timeout);
    setDefaultThreads(s.default_threads);
  }

  async function handleSave() {
    await saveSettings({
      domains,
      default_timeout: defaultTimeout,
      default_threads: defaultThreads,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addDomain() {
    if (!newDomainUrl.trim() || !newDomainName.trim()) return;
    setDomains([...domains, { url: newDomainUrl.trim(), name: newDomainName.trim() }]);
    setNewDomainUrl('');
    setNewDomainName('');
  }

  function removeDomain(idx: number) {
    setDomains(domains.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground mt-1">
          Configure test domains, timeout, and threading
        </p>
      </div>

      {/* Test Domains */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="card-title text-lg">Test Domains</h3>
          </div>
          <p className="card-description mt-1">
            Domains used to test proxy connectivity
          </p>
        </div>
        <div className="card-content space-y-4">
          {/* Add new domain */}
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Domain URL (e.g. https://www.google.com)"
              value={newDomainUrl}
              onChange={(e) => setNewDomainUrl(e.target.value)}
            />
            <input
              className="input w-48"
              placeholder="Display name (e.g. Google)"
              value={newDomainName}
              onChange={(e) => setNewDomainName(e.target.value)}
            />
            <button className="btn btn-primary gap-1" onClick={addDomain}>
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {/* Domain list */}
          <div className="space-y-2">
            {domains.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{d.url}</div>
                  </div>
                </div>
                <button
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => removeDomain(i)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {domains.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No domains configured
              </p>
            )}
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary" />
            <h3 className="card-title text-lg">General</h3>
          </div>
          <p className="card-description mt-1">
            Default values for proxy testing
          </p>
        </div>
        <div className="card-content space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label flex items-center gap-2">
                <Clock className="w-4 h-4" /> Default Timeout (seconds)
              </label>
              <input
                className="input mt-2"
                type="number"
                min={1}
                max={60}
                value={defaultTimeout}
                onChange={(e) => setDefaultTimeout(parseInt(e.target.value) || 10)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                How long to wait for a proxy response
              </p>
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <Cpu className="w-4 h-4" /> Default Threads
              </label>
              <input
                className="input mt-2"
                type="number"
                min={1}
                max={500}
                value={defaultThreads}
                onChange={(e) => setDefaultThreads(parseInt(e.target.value) || 50)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Number of concurrent proxy tests
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="btn btn-primary gap-2" onClick={handleSave}>
              <Save className="w-4 h-4" /> Save Settings
            </button>
            {saved && (
              <span className="text-sm text-green-400">Settings saved!</span>
            )}
          </div>
        </div>
      </div>

      {/* Proxy Format Help */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title text-lg">Proxy Format Reference</h3>
        </div>
        <div className="card-content">
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">With authentication:</span>
              <code className="block mt-1 bg-secondary p-3 rounded-md font-mono text-xs">
                192.168.1.1:8080:username:password
              </code>
            </div>
            <div>
              <span className="text-muted-foreground">Without authentication:</span>
              <code className="block mt-1 bg-secondary p-3 rounded-md font-mono text-xs">
                192.168.1.1:8080
              </code>
            </div>
            <p className="text-muted-foreground text-xs">
              One proxy per line. Lines starting with <code className="bg-secondary px-1 rounded">#</code> are treated as comments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
