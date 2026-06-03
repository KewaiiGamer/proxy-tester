package app

import (
	"encoding/json"
	"os"
	"path/filepath"
	"time"
)

// Store handles persistence of proxy lists and settings
type Store struct {
	dataDir string
}

// NewStore creates a new store with the given data directory
func NewStore(dataDir string) *Store {
	return &Store{dataDir: dataDir}
}

func (s *Store) ensureDir() error {
	return os.MkdirAll(s.dataDir, 0755)
}

// SaveProxyList saves a proxy list to disk
func (s *Store) SaveProxyList(list *ProxyList) error {
	if err := s.ensureDir(); err != nil {
		return err
	}
	list.Updated = time.Now()
	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}
	filename := filepath.Join(s.dataDir, "lists", sanitizeFilename(list.Name)+".json")
	if err := os.MkdirAll(filepath.Dir(filename), 0755); err != nil {
		return err
	}
	return os.WriteFile(filename, data, 0644)
}

// LoadProxyList loads a proxy list by name
func (s *Store) LoadProxyList(name string) (*ProxyList, error) {
	filename := filepath.Join(s.dataDir, "lists", sanitizeFilename(name)+".json")
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}
	var list ProxyList
	if err := json.Unmarshal(data, &list); err != nil {
		return nil, err
	}
	return &list, nil
}

// ListProxyLists returns all saved proxy list filenames (with .json)
// The frontend uses these raw filenames for load/delete operations
func (s *Store) ListProxyLists() ([]string, error) {
	dir := filepath.Join(s.dataDir, "lists")
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return []string{}, nil
		}
		return nil, err
	}
	var names []string
	for _, e := range entries {
		if e.IsDir() || filepath.Ext(e.Name()) != ".json" {
			continue
		}
		names = append(names, filepath.Base(e.Name()))
	}
	return names, nil
}

// DeleteProxyListByFilename deletes a proxy list using the raw filename (e.g. "MyList.json")
func (s *Store) DeleteProxyListByFilename(filename string) error {
	path := filepath.Join(s.dataDir, "lists", filename)
	return os.Remove(path)
}

// LoadProxyListByFilename loads a proxy list using the raw filename (e.g. "MyList.json")
func (s *Store) LoadProxyListByFilename(filename string) (*ProxyList, error) {
	path := filepath.Join(s.dataDir, "lists", filename)
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var list ProxyList
	if err := json.Unmarshal(data, &list); err != nil {
		return nil, err
	}
	return &list, nil
}

// DeleteProxyList deletes a proxy list by name
func (s *Store) DeleteProxyList(name string) error {
	filename := filepath.Join(s.dataDir, "lists", sanitizeFilename(name)+".json")
	return os.Remove(filename)
}

// SaveSettings saves the app settings
func (s *Store) SaveSettings(settings *AppSettings) error {
	if err := s.ensureDir(); err != nil {
		return err
	}
	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(s.dataDir, "settings.json"), data, 0644)
}

// LoadSettings loads the app settings, or returns defaults
func (s *Store) LoadSettings() (*AppSettings, error) {
	filename := filepath.Join(s.dataDir, "settings.json")
	data, err := os.ReadFile(filename)
	if err != nil {
		if os.IsNotExist(err) {
			return DefaultSettings(), nil
		}
		return nil, err
	}
	var settings AppSettings
	if err := json.Unmarshal(data, &settings); err != nil {
		return nil, err
	}
	return &settings, nil
}

// DefaultSettings returns the default app settings
func DefaultSettings() *AppSettings {
	return &AppSettings{
		Domains: []TestDomain{
			{URL: "https://www.walmart.com", Name: "Walmart"},
			{URL: "https://q-api.walmart.com", Name: "Queue Walmart"},
			{URL: "https://www.google.com", Name: "Google"},
		},
		DefaultTimeout: 10,
		DefaultThreads: 50,
	}
}

// sanitizeFilename makes a safe filename from a name
func sanitizeFilename(name string) string {
	runes := []rune(name)
	var result []rune
	for _, r := range runes {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' || r == '-' {
			result = append(result, r)
		}
	}
	if len(result) == 0 {
		return "unnamed"
	}
	return string(result)
}
