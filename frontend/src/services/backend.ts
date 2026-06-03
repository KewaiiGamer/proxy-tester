import { App, Proxy, ProxyList, AppSettings } from '../wailsgo';

const backend = new App();

export async function parseProxies(raw: string): Promise<Proxy[]> {
  return backend.ParseProxies(raw);
}

export async function saveList(name: string, proxies: Proxy[]): Promise<void> {
  return backend.SaveList(name, proxies);
}

export async function loadList(name: string): Promise<ProxyList> {
  console.log(name)
  return backend.LoadList(name);
}

export async function getLists(): Promise<string[]> {
  return backend.GetLists();
}

export async function deleteList(name: string): Promise<void> {
  return backend.DeleteList(name);
}

export function exportProxies(proxies: Proxy[], filter: string): string {
  return backend.ExportProxies(proxies, filter);
}

export async function getSettings(): Promise<AppSettings> {
  return backend.GetSettings();
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return backend.SaveSettings(settings);
}

export function isTesting(): boolean {
  return backend.IsTesting();
}
