// Wails Go bindings - types and runtime stubs
export interface Proxy {
  id: number;
  user: string;
  password: string;
  host: string;
  port: number;
  alive?: boolean | null;
  latency?: number;
  last_error?: string;
  last_test?: string;
}

export interface ProxyList {
  name: string;
  proxies: Proxy[];
  created: string;
  updated: string;
}

export interface TestDomain {
  url: string;
  name: string;
}

export interface AppSettings {
  domains: TestDomain[];
  default_timeout: number;
  default_threads: number;
}

export interface TestProgress {
  total: number;
  completed: number;
  alive: number;
  dead: number;
  current_index: number;
}

export interface TestResult {
  total: number;
  alive: number;
  dead: number;
  proxies: Proxy[];
  duration: string;
}

// Wails exposes Go methods on window.go
declare global {
  interface Window {
    go?: {
      app?: {
        App?: {
          ParseProxies(raw: string): Proxy[];
          SaveList(name: string, proxies: Proxy[]): Promise<void>;
          LoadList(name: string): Promise<ProxyList>;
          GetLists(): Promise<string[]>;
          DeleteList(name: string): Promise<void>;
          ExportProxies(proxies: Proxy[], filter: string): string;
          GetSettings(): Promise<AppSettings>;
          SaveSettings(settings: AppSettings): Promise<void>;
          IsTesting(): boolean;
          IsDone(): boolean;
          StartTest(proxies: Proxy[], testURL: string, timeout: number, threads: number): Promise<void>;
          GetProgress(): TestProgress;
          GetResult(): TestResult;
          CancelTest(): void;
        };
      };
    };
  }
}

const wailsApp = window.go?.app?.App;

// App class that wraps Wails bindings with fallbacks for dev mode
export class App {
  ParseProxies(raw: string): Proxy[] {
    if (wailsApp?.ParseProxies) {
      return wailsApp.ParseProxies(raw);
    }
    // Fallback for dev mode - parse locally
    return this.parseProxiesLocal(raw);
  }

  async SaveList(name: string, proxies: Proxy[]): Promise<void> {
    if (wailsApp?.SaveList) {
      return wailsApp.SaveList(name, proxies);
    }
    // Dev fallback: save to localStorage
    const list = { name, proxies, created: new Date().toISOString(), updated: new Date().toISOString() };
    localStorage.setItem(`proxylist_${name}`, JSON.stringify(list));
  }

  async LoadList(name: string): Promise<ProxyList> {
    console.log(name)
    if (wailsApp?.LoadList) {
      return wailsApp.LoadList(name);
    }
    const data = localStorage.getItem(`proxylist_${name}`);
    if (!data) throw new Error(`List "${name}" not found`);
    return JSON.parse(data);
  }

  async GetLists(): Promise<string[]> {
    if (wailsApp?.GetLists) {
      return wailsApp.GetLists();
    }
    // Dev fallback
    const lists: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('proxylist_')) {
        lists.push(key.replace('proxylist_', '').replace('.json', ''));
      }
    }
    return lists;
  }

  async DeleteList(name: string): Promise<void> {
    if (wailsApp?.DeleteList) {
      return wailsApp.DeleteList(name);
    }
    localStorage.removeItem(`proxylist_${name}`);
  }

  ExportProxies(proxies: Proxy[], filter: string): string {
    if (wailsApp?.ExportProxies) {
      return wailsApp.ExportProxies(proxies, filter);
    }
    return this.exportProxiesLocal(proxies, filter);
  }

  async GetSettings(): Promise<AppSettings> {
    if (wailsApp?.GetSettings) {
      return wailsApp.GetSettings();
    }
    // Dev fallback
    const defaults: AppSettings = {
      domains: [
        { url: 'https://www.walmart.com', name: 'Walmart' },
        { url: 'https://q-api.walmart.com', name: 'Queue Walmart' },
        { url: 'https://www.google.com', name: 'Google' },
      ],
      default_timeout: 10,
      default_threads: 50,
    };
    const data = localStorage.getItem('proxytester_settings');
    return data ? JSON.parse(data) : defaults;
  }

  async SaveSettings(settings: AppSettings): Promise<void> {
    if (wailsApp?.SaveSettings) {
      return wailsApp.SaveSettings(settings);
    }
    localStorage.setItem('proxytester_settings', JSON.stringify(settings));
  }

  IsTesting(): boolean {
    if (wailsApp?.IsTesting) {
      return wailsApp.IsTesting();
    }
    return false;
  }

  IsDone(): boolean {
    if (wailsApp?.IsDone) {
      return wailsApp.IsDone();
    }
    return false;
  }

  async StartTest(proxies: Proxy[], testURL: string, timeout: number, threads: number): Promise<void> {
    if (wailsApp?.StartTest) {
      return wailsApp.StartTest(proxies, testURL, timeout, threads);
    }
    // Dev fallback: simulate testing
    throw new Error('Testing not available in dev mode without Wails');
  }

  GetProgress(): TestProgress {
    if (wailsApp?.GetProgress) {
      return wailsApp.GetProgress();
    }
    return { total: 0, completed: 0, alive: 0, dead: 0, current_index: 0 };
  }

  GetResult(): TestResult {
    if (wailsApp?.GetResult) {
      return wailsApp.GetResult();
    }
    return { total: 0, alive: 0, dead: 0, proxies: [], duration: '' };
  }

  CancelTest(): void {
    if (wailsApp?.CancelTest) {
      wailsApp.CancelTest();
    }
  }

  // Local fallbacks for dev mode
  private parseProxiesLocal(raw: string): Proxy[] {
    const proxies: Proxy[] = [];
    const lines = raw.split('\n');
    lines.forEach((line, i) => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const parts = line.split(':');
      let p: Proxy;
      if (parts.length === 2) {
        const port = parseInt(parts[1]);
        if (isNaN(port) || port <= 0) return;
        p = { id: i + 1, user: '', password: '', host: parts[0].trim(), port };
      } else if (parts.length === 4) {
        const port = parseInt(parts[1]);
        if (isNaN(port) || port <= 0) return;
        p = { id: i + 1, user: parts[2].trim(), password: parts[3].trim(), host: parts[0].trim(), port };
      } else {
        return;
      }
      proxies.push(p);
    });
    return proxies;
  }

  private exportProxiesLocal(proxies: Proxy[], filter: string): string {
    return proxies
      .filter((p) => {
        if (filter === 'alive') return p.alive === true;
        if (filter === 'dead') return p.alive === false;
        return true;
      })
      .map((p) => {
        if (p.user) return `${p.host}:${p.port}:${p.user}:${p.password}`;
        return `${p.host}:${p.port}`;
      })
      .join('\n');
  }
}
