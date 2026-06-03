import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLists } from '../services/backend';
import { displayName } from '../utils/display';
import { ListFilter, TestTube2, Plus, ArrowRight } from 'lucide-react';

function Dashboard() {
  const [listCount, setListCount] = useState(0);
  const [lists, setLists] = useState<string[]>([]);

  useEffect(() => {
    loadLists();
  }, []);

  async function loadLists() {
    try {
      const lists = await getLists();
      setLists(lists); // keep raw filenames
      setListCount(lists.length);
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Manage and test your proxy lists
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ListFilter className="w-4 h-4" />
              <span className="card-title text-sm font-medium">Saved Lists</span>
            </div>
            <div className="text-3xl font-bold mt-2">{listCount}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TestTube2 className="w-4 h-4" />
              <span className="card-title text-sm font-medium">Quick Actions</span>
            </div>
            <div className="mt-2 space-x-2">
              <Link to="/lists" className="btn btn-outline text-xs h-8 px-3">
                Import Proxies
              </Link>
              <Link to="/test" className="btn btn-primary text-xs h-8 px-3">
                Run Test
              </Link>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Plus className="w-4 h-4" />
              <span className="card-title text-sm font-medium">Get Started</span>
            </div>
            <ol className="mt-2 text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Import proxies in <code className="bg-secondary px-1 rounded">ip:port:user:pass</code> format</li>
              <li>Configure test domains in Settings</li>
              <li>Run tests with multi-threading</li>
              <li>Export alive proxies</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Recent Lists */}
      <div className="card">
        <div className="card-header flex flex-row items-center justify-between">
          <div>
            <h3 className="card-title text-lg">Recent Lists</h3>
            <p className="card-description mt-1">Your saved proxy lists</p>
          </div>
          <Link to="/lists" className="btn btn-outline text-xs h-8 px-3 gap-1">
            Manage <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="card-content">
          {lists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListFilter className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No proxy lists saved yet</p>
              <Link to="/lists" className="btn btn-primary mt-4 text-sm">
                Import Your First List
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {lists.map((filename) => (
                <div
                  key={filename}
                  className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ListFilter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{displayName(filename)}</span>
                  </div>
                  <Link
                    to="/test"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Test <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
