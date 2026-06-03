package app

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

// App is the main application struct
type App struct {
	ctx      context.Context
	store    *Store
	mu       sync.Mutex
	active   bool               // whether a test is currently running
	done     bool               // whether the last test finished
	cancel   context.CancelFunc // cancel function to stop running test
	progress TestProgress       // current test progress
	result   TestResult         // final test result
}

// New creates a new App instance
func New() *App {
	return &App{}
}

// OnStartup is called when the application starts
func (a *App) OnStartup(ctx context.Context) {
	a.ctx = ctx

	// Set up data directory
	dataDir := ""
	if home, err := os.UserHomeDir(); err == nil {
		dataDir = filepath.Join(home, ".proxy-tester")
	} else {
		dataDir = ".proxy-tester"
	}

	a.store = NewStore(dataDir)
}

// Context returns the application context
func (a *App) Context() context.Context {
	return a.ctx
}

// --- Proxy List Management ---

// ParseProxies parses a raw proxy list string in user:pass:ip:port format
func (a *App) ParseProxies(raw string) []Proxy {
	var proxies []Proxy
	lines := strings.Split(raw, "\n")
	for i, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		p := parseProxyLine(line)
		if p != nil {
			p.ID = i + 1
			proxies = append(proxies, *p)
		}
	}
	return proxies
}

func parseProxyLine(line string) *Proxy {
	parts := strings.Split(line, ":")
	switch len(parts) {
	case 2:
		// ip:port format (no auth)
		host := strings.TrimSpace(parts[0])
		port := parsePort(parts[1])
		if port == 0 {
			return nil
		}
		return &Proxy{Host: host, Port: port}
	case 4:
		// ip:port:user:pass
		host := strings.TrimSpace(parts[0])
		port := parsePort(parts[1])
		user := strings.TrimSpace(parts[2])
		pass := strings.TrimSpace(parts[3])
		if port == 0 {
			return nil
		}
		return &Proxy{Host: host, Port: port, User: user, Password: pass}
	default:
		return nil
	}
}

func parsePort(s string) int {
	s = strings.TrimSpace(s)
	var port int
	_, err := fmt.Sscanf(s, "%d", &port)
	if err != nil || port <= 0 || port > 65535 {
		return 0
	}
	return port
}

// SaveList saves a proxy list with the given name
func (a *App) SaveList(name string, proxies []Proxy) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	list := &ProxyList{
		Name:    name,
		Proxies: proxies,
	}
	return a.store.SaveProxyList(list)
}

// LoadList loads a proxy list by filename (raw filename from GetLists)
func (a *App) LoadList(filename string) (*ProxyList, error) {
	return a.store.LoadProxyListByFilename(filename)
}

// GetLists returns all saved list names
func (a *App) GetLists() ([]string, error) {
	return a.store.ListProxyLists()
}

// DeleteList deletes a proxy list by filename
func (a *App) DeleteList(filename string) error {
	return a.store.DeleteProxyListByFilename(filename)
}

// ExportProxies exports proxies, optionally filtering by alive status
// filter: "all", "alive", "dead"
func (a *App) ExportProxies(proxies []Proxy, filter string) string {
	var sb strings.Builder
	for _, p := range proxies {
		if filter == "alive" && p.Alive == nil || filter == "alive" && !*p.Alive {
			continue
		}
		if filter == "dead" && p.Alive == nil || filter == "dead" && *p.Alive {
			continue
		}
		if p.User != "" {
			sb.WriteString(fmt.Sprintf("%s:%d:%s:%s\n", p.Host, p.Port, p.User, p.Password))
		} else {
			sb.WriteString(fmt.Sprintf("%s:%d\n", p.Host, p.Port))
		}
	}
	return sb.String()
}

// --- Settings ---

// GetSettings returns the current settings
func (a *App) GetSettings() (*AppSettings, error) {
	return a.store.LoadSettings()
}

// SaveSettings saves the app settings
func (a *App) SaveSettings(settings *AppSettings) error {
	return a.store.SaveSettings(settings)
}

// --- Testing ---

// StartTest begins testing proxies against a URL on the Go backend
func (a *App) StartTest(
	proxies []Proxy,
	testURL string,
	timeout int,
	threads int,
) error {
	a.mu.Lock()
	// Cancel any previous test if still running
	if a.cancel != nil {
		a.cancel()
	}
	if len(proxies) == 0 {
		a.mu.Unlock()
		return fmt.Errorf("no proxies to test")
	}
	if testURL == "" {
		a.mu.Unlock()
		return fmt.Errorf("test URL is empty")
	}
	a.active = true
	a.done = false
	a.progress = TestProgress{Total: len(proxies)}
	a.result = TestResult{}

	// Create cancellable context for the test
	ctx, cancel := context.WithCancel(context.Background())
	a.cancel = cancel
	a.mu.Unlock()

	// Run test in goroutine so it doesn't block the Wails call
	go func() {
		defer func() {
			if r := recover(); r != nil {
				a.mu.Lock()
				a.active = false
				a.done = true
				a.mu.Unlock()
			}
		}()
		RunTest(
			ctx,
			proxies,
			testURL,
			timeout,
			threads,
			// Progress callback
			func(progress TestProgress) {
				a.mu.Lock()
				a.progress = progress
				a.mu.Unlock()
			},
			// Result callback
			func(result TestResult) {
				a.mu.Lock()
				a.active = false
				a.done = true
				a.result = result
				a.mu.Unlock()
			},
		)
	}()

	return nil
}

// IsTesting returns whether a test is currently running
func (a *App) IsTesting() bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.active
}

// IsDone returns whether the last test has completed
func (a *App) IsDone() bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.done
}

// GetProgress returns the current test progress
func (a *App) GetProgress() TestProgress {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.progress
}

// GetResult returns the final test result
func (a *App) GetResult() TestResult {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.result
}

// CancelTest stops the current test (best-effort)
func (a *App) CancelTest() {
	a.mu.Lock()
	if a.cancel != nil {
		a.cancel()
		a.cancel = nil
	}
	a.active = false
	a.done = true
	a.mu.Unlock()
}
