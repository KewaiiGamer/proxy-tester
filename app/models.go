package app

import "time"

// Proxy represents a single proxy entry
type Proxy struct {
	ID       int       `json:"id"`
	User     string    `json:"user"`
	Password string    `json:"password"`
	Host     string    `json:"host"`
	Port     int       `json:"port"`
	Alive    *bool     `json:"alive,omitempty"`
	Latency  int       `json:"latency,omitempty"` // milliseconds
	LastError string   `json:"last_error,omitempty"`
	LastTest *time.Time `json:"last_test,omitempty"`
}

// ProxyList represents a saved list of proxies
type ProxyList struct {
	Name    string  `json:"name"`
	Proxies []Proxy `json:"proxies"`
	Created time.Time `json:"created"`
	Updated time.Time `json:"updated"`
}

// TestDomain represents a configurable test domain
type TestDomain struct {
	URL  string `json:"url"`
	Name string `json:"name"`
}

// AppSettings holds the application settings
type AppSettings struct {
	Domains       []TestDomain `json:"domains"`
	DefaultTimeout int         `json:"default_timeout"` // seconds
	DefaultThreads int         `json:"default_threads"`
}

// TestProgress is sent to the frontend during testing
type TestProgress struct {
	Total      int `json:"total"`
	Completed  int `json:"completed"`
	Alive      int `json:"alive"`
	Dead       int `json:"dead"`
	CurrentIdx int `json:"current_index"`
}

// TestResult holds the final result of a test run
type TestResult struct {
	Total int     `json:"total"`
	Alive int     `json:"alive"`
	Dead  int     `json:"dead"`
	Proxies []Proxy `json:"proxies"`
	Duration string `json:"duration"`
}
