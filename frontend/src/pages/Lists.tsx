import { useState, useEffect } from 'react';
import { getLists, loadList, saveList, deleteList, exportProxies, parseProxies } from '../services/backend';
import { Proxy, ProxyList } from '../wailsgo';
import { displayName } from '../utils/display';
import { ListFilter, Trash2, Save, Download, Plus, X } from 'lucide-react';

function Lists() {
  const [lists, setLists] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<ProxyList | null>(null);
  const [rawInput, setRawInput] = useState('');
  const [listName, setListName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [parsedCount, setParsedCount] = useState(0);
  const [proxyCount, setProxyCount] = useState(0);

  useEffect(() => {
    loadLists();
  }, []);

  async function loadLists() {
    try {
      const l = await getLists();
      setLists(l); // keep raw filenames for load/delete
    } catch (e) {
      // ignore
    }
  }

  async function handleParse() {
    const proxies = await parseProxies(rawInput);
    setParsedCount(proxies.length);
  }

  async function handleSave() {
    if (!listName.trim() || parsedCount === 0) return;
    const proxies = await parseProxies(rawInput);
    await saveList(listName.trim(), proxies);
    setRawInput('');
    setListName('');
    setParsedCount(0);
    setIsImporting(false);
    loadLists();
  }

  async function handleLoad(name: string) {
    try {
      const list = await loadList(name);
      setSelectedList(list);
      setProxyCount(list.proxies.length);
    } catch (e) {
      // ignore
    }
  }

  async function handleDelete(name: string) {
    await deleteList(name);
    if (selectedList?.name === name) {
      setSelectedList(null);
    }
    loadLists();
  }

  function handleExport(filter: string) {
    if (!selectedList) return;
    const text = exportProxies(selectedList.proxies, filter);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedList.name}_${filter}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const aliveCount = selectedList?.proxies.filter((p) => p.alive).length ?? 0;
  const deadCount = selectedList?.proxies.filter((p) => p.alive === false).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Proxy Lists</h2>
          <p className="text-muted-foreground mt-1">Import, manage, and export your proxy lists</p>
        </div>
        <button
          className="btn btn-primary gap-2"
          onClick={() => setIsImporting(true)}
        >
          <Plus className="w-4 h-4" /> Import
        </button>
      </div>

      {/* Import Modal */}
      {isImporting && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="card w-full max-w-2xl m-4">
            <div className="card-header flex flex-row items-center justify-between">
              <div>
                <h3 className="card-title text-lg">Import Proxies</h3>
                <p className="card-description mt-1">
                  Paste proxies in <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">ip:port:user:pass</code> or <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">ip:port</code> format
                </p>
              </div>
              <button onClick={() => setIsImporting(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="card-content space-y-4">
              <div>
                <label className="label">List Name</label>
                <input
                  className="input mt-2"
                  placeholder="My Proxy List"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Proxies (one per line)</label>
                <textarea
                  className="input mt-2 min-h-[300px] font-mono text-xs resize-y"
                  placeholder={'1.2.3.4:8080:user1:pass1\n5.6.7.8:3128:user2:pass2\n10.0.0.1:8080'}
                  value={rawInput}
                  onChange={(e) => {
                    setRawInput(e.target.value);
                    setParsedCount(0);
                  }}
                />
              </div>
              {parsedCount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="badge badge-success">{parsedCount} proxies parsed</span>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  className="btn btn-outline"
                  onClick={handleParse}
                  disabled={!rawInput.trim()}
                >
                  Parse Preview
                </button>
                <button
                  className="btn btn-primary gap-2"
                  onClick={handleSave}
                  disabled={!listName.trim() || parsedCount === 0}
                >
                  <Save className="w-4 h-4" /> Save List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List sidebar */}
        <div className="card lg:col-span-1">
          <div className="card-header">
            <h3 className="card-title text-lg">Saved Lists</h3>
          </div>
          <div className="card-content">
            {lists.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No lists saved yet
              </p>
            ) : (
              <div className="space-y-1">
                {lists.map((filename) => (
                  <div
                    key={filename}
                    className={`flex items-center justify-between p-2.5 rounded-md transition-colors group ${
                      selectedList?.name === filename ? 'bg-primary/15 text-primary' : 'hover:bg-accent/50'
                    }`}
                  >
                    <button
                      className="flex items-center gap-2 flex-1 text-left text-sm"
                      onClick={() => handleLoad(filename)}
                    >
                      <ListFilter className="w-4 h-4" />
                      {displayName(filename)}
                    </button>
                    <button
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(filename)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* List details */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="card-title text-lg">
              {selectedList ? selectedList.name : 'Select a List'}
            </h3>
            {selectedList && (
              <div className="flex gap-2 mt-2">
                <span className="badge badge-muted">{selectedList.proxies.length} total</span>
                {aliveCount > 0 && <span className="badge badge-success">{aliveCount} alive</span>}
                {deadCount > 0 && <span className="badge badge-danger">{deadCount} dead</span>}
              </div>
            )}
          </div>
          {selectedList ? (
            <div className="card-content space-y-4">
              <div className="flex gap-2">
                <button className="btn btn-outline text-xs gap-1" onClick={() => handleExport('all')}>
                  <Download className="w-3 h-3" /> Export All
                </button>
                <button className="btn btn-outline text-xs gap-1" onClick={() => handleExport('alive')}>
                  <Download className="w-3 h-3" /> Export Alive
                </button>
                <button className="btn btn-outline text-xs gap-1" onClick={() => handleExport('dead')}>
                  <Download className="w-3 h-3" /> Export Dead
                </button>
              </div>

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
                      </tr>
                    </thead>
                    <tbody>
                      {selectedList.proxies.slice(0, 100).map((p, i) => (
                        <tr key={i} className="border-t border-border hover:bg-accent/30">
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
                        </tr>
                      ))}
                      {selectedList.proxies.length > 100 && (
                        <tr>
                          <td colSpan={6} className="p-3 text-center text-muted-foreground text-xs">
                            ... and {selectedList.proxies.length - 100} more (showing first 100)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-content flex items-center justify-center py-16 text-muted-foreground">
              <div className="text-center">
                <ListFilter className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Select or import a proxy list to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Lists;
