import { useState, useEffect, useRef, useCallback } from 'react';
import { getLists, loadList, saveList, getSettings } from '../services/backend';
import { Proxy, TestDomain, TestProgress as TestProgressType, TestResult as TestResultType } from '../wailsgo';
import { displayName } from '../utils/display';
import { TestTube2, Play, Square, Clock, CheckCircle2, XCircle, Save } from 'lucide-react';
import { App } from '../wailsgo';

const backend = new App();

function Test() {
  const [lists, setLists] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState('');
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [domains, setDomains] = useState<TestDomain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [timeout, setTimeout_] = useState(10);
  const [threads, setThreads] = useState(50);

  const [isTesting, setIsTesting] = useState(false);
  const [progress, setProgress] = useState<TestProgressType | null>(null);
  const [results, setResults] = useState<Proxy[]>([]);
  const [duration, setDuration] = useState('');
  const [testListName, setTestListName] = useState('');
  const [testError, setTestError] = useState('');

  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    loadInitial();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  async function loadInitial() {
    const [l, s] = await Promise.all([getLists(), getSettings()]);
    setLists(l || []);
    setDomains(s.domains || []);
    setTimeout_(s.default_timeout || 10);
    setThreads(s.default_threads || 50);
    if (s.domains && s.domains.length > 0) {
      setSelectedDomain(s.domains[0].url);
    }
  }

  async function handleLoadList(filename: string) {
    try {
      const list = await loadList(filename);
      setSelectedList(filename);
      setProxies(list.proxies);
      setResults([]);
      setProgress(null);
      setDuration('');
      setTestError('');
      setTestListName(filename.replace(/\.json$/i, '') + '_tested');
    } catch (e: any) {
      setTestError('Failed to load list: ' + e.message);
    }
  }

  // Poll for test progress
  const pollProgress = useCallback(async () => {
    try {
      const p = backend.GetProgress();
      setProgress(await p);

      const testing = backend.IsTesting();
      const done = backend.IsDone();

      if (!testing && done) {
        // Test is done
        const result = backend.GetResult();
        console.log('Test complete:', result);
        setResults(result.proxies || []);
        setDuration(result.duration || '');
        setIsTesting(false);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch (e) {
      console.error('Poll error:', e);
    }
  }, []);

  async function handleTest() {
    if (proxies.length === 0 || !selectedDomain) {
      setTestError('No proxies loaded or no domain selected');
      return;
    }

    setIsTesting(true);
    setTestError('');
    setResults([]);
    setProgress({ total: proxies.length, completed: 0, alive: 0, dead: 0, current_index: 0 });
    setDuration('');

    try {
      console.log('Starting test:', { count: proxies.length, url: selectedDomain, timeout, threads });
      await backend.StartTest(proxies, selectedDomain, timeout, threads);
      console.log('Test started, polling2...');
      console.log('2...');
      // Start polling for progress
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = window.setInterval(pollProgress, 200);
    } catch (e: any) {
      console.error('Test failed:', e);
      const errMsg = e?.message || e?.error || JSON.stringify(e);
      setTestError('Failed to start test: ' + errMsg);
      setIsTesting(false);
      setProgress(null);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }

  function handleStop() {
    backend.CancelTest();
    setIsTesting(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  async function handleSaveResults() {
    if (results.length === 0 || !testListName) return;
    try {
      await saveList(testListName, results);
      loadInitial();
      setTestError('');
    } catch (e: any) {
      setTestError('Failed to save: ' + e.message);
    }
  }

  const aliveCount = results.filter((p) => p.alive === true).length;
  const deadCount = results.filter((p) => p.alive === false).length;
  const totalCount = results.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Test Proxies</h2>
        <p className="text-muted-foreground mt-1">
          Test your proxy lists against configured domains
        </p>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="label">Proxy List</label>
          <select
            className="input mt-2"
            value={selectedList}
            onChange={(e) => e.target.value && handleLoadList(e.target.value)}
            disabled={isTesting}
          >
            <option value="">Select list...</option>
            {lists.map((filename) => (
              <option key={filename} value={filename}>{displayName(filename)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Test Domain</label>
          <select
            className="input mt-2"
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            disabled={isTesting}
          >
            <option value="">Select domain...</option>
            {domains.map((d) => (
              <option key={d.url} value={d.url}>{d.name} ({d.url})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Timeout (seconds)</label>
          <input
            className="input mt-2"
            type="number"
            min={1}
            max={60}
            value={timeout}
            onChange={(e) => setTimeout_(parseInt(e.target.value) || 10)}
            disabled={isTesting}
          />
        </div>

        <div>
          <label className="label">Threads</label>
          <input
            className="input mt-2"
            type="number"
            min={1}
            max={500}
            value={threads}
            onChange={(e) => setThreads(parseInt(e.target.value) || 50)}
            disabled={isTesting}
          />
        </div>
      </div>

      {/* Proxy count & action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {proxies.length} proxies loaded
          </span>
          {results.length > 0 && (
            <div className="flex gap-2">
              <span className="badge badge-success">{aliveCount} alive</span>
              <span className="badge badge-danger">{deadCount} dead</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {duration}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {isTesting ? (
            <button className="btn btn-destructive gap-2" onClick={handleStop}>
              <Square className="w-4 h-4" /> Stop
            </button>
          ) : (
            <button
              className="btn btn-primary gap-2"
              onClick={handleTest}
              disabled={proxies.length === 0 || !selectedDomain}
            >
              <Play className="w-4 h-4" /> Start Test
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {testError && (
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {testError}
        </div>
      )}

      {/* Progress bar */}
      {progress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span>{progress.completed} / {progress.total}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 rounded-full"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="w-4 h-4" /> {progress.alive}
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <XCircle className="w-4 h-4" /> {progress.dead}
            </span>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="card">
          <div className="card-header flex flex-row items-center justify-between">
            <div>
              <h3 className="card-title text-lg">Results</h3>
              <p className="card-description mt-1">
                {aliveCount} alive, {deadCount} dead out of {totalCount} proxies
              </p>
            </div>
            <div className="flex gap-2">
              <input
                className="input h-8 text-xs"
                placeholder="Save as..."
                value={testListName}
                onChange={(e) => setTestListName(e.target.value)}
              />
              <button className="btn btn-primary text-xs h-8 gap-1" onClick={handleSaveResults}>
                <Save className="w-3 h-3" /> Save Results
              </button>
            </div>
          </div>
          <div className="card-content">
            <div className="border border-border rounded-md overflow-hidden">
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium">#</th>
                      <th className="text-left p-3 font-medium">User</th>
                      <th className="text-left p-3 font-medium">Host</th>
                      <th className="text-left p-3 font-medium">Port</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Latency</th>
                      <th className="text-left p-3 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.slice(0, 200).map((p, i) => (
                      <tr
                        key={i}
                        className={`border-t border-border ${
                          p.alive === true ? 'bg-green-500/5' : p.alive === false ? 'bg-red-500/5' : ''
                        }`}
                      >
                        <td className="p-3 text-muted-foreground">{p.id || i + 1}</td>
                        <td className="p-3 font-mono text-xs">{p.user || '-'}</td>
                        <td className="p-3 font-mono text-xs">{p.host}</td>
                        <td className="p-3 font-mono text-xs">{p.port}</td>
                        <td className="p-3">
                          {p.alive === true ? (
                            <span className="badge badge-success">Alive</span>
                          ) : p.alive === false ? (
                            <span className="badge badge-danger">Dead</span>
                          ) : (
                            <span className="badge badge-muted">Unknown</span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {p.latency ? `${p.latency}ms` : '-'}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate" title={p.last_error}>
                          {p.last_error || '-'}
                        </td>
                      </tr>
                    ))}
                    {results.length > 200 && (
                      <tr>
                        <td colSpan={7} className="p-3 text-center text-muted-foreground text-xs">
                          ... and {results.length - 200} more (showing first 200)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {proxies.length === 0 && !isTesting && results.length === 0 && (
        <div className="card">
          <div className="card-content flex items-center justify-center py-16 text-muted-foreground">
            <div className="text-center">
              <TestTube2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Select a proxy list and domain to start testing</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Test;
