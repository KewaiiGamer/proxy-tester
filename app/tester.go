package app

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"sync"
	"sync/atomic"
	"time"
)

// TestProxy tests a single proxy against the given URL
func TestProxy(ctx context.Context, proxy Proxy, testURL string, timeout int, callback func(Proxy)) {
	// Build proxy URL
	proxyURLStr := fmt.Sprintf("http://%s:%d", proxy.Host, proxy.Port)
	if proxy.User != "" {
		proxyURLStr = fmt.Sprintf("http://%s:%s@%s:%d", proxy.User, proxy.Password, proxy.Host, proxy.Port)
	}

	proxyURL, err := url.Parse(proxyURLStr)
	if err != nil {
		proxy.Alive = boolPtr(false)
		proxy.LastError = "Invalid proxy format"
		proxy.LastTest = timePtr(time.Now())
		callback(proxy)
		return
	}

	httpClient := &http.Client{
		Timeout: time.Duration(timeout) * time.Second,
		Transport: &http.Transport{
			Proxy: http.ProxyURL(proxyURL),
		},
	}

	start := time.Now()
	req, err := http.NewRequestWithContext(ctx, "GET", testURL, nil)
	if err != nil {
		proxy.Alive = boolPtr(false)
		proxy.LastError = "Request creation failed: " + err.Error()
		proxy.LastTest = timePtr(time.Now())
		callback(proxy)
		return
	}

	// Follow redirects but cap at 3
	httpClient.CheckRedirect = func(req *http.Request, via []*http.Request) error {
		if len(via) >= 3 {
			return fmt.Errorf("too many redirects")
		}
		return nil
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		proxy.Alive = boolPtr(false)
		proxy.LastError = err.Error()
		proxy.Latency = int(time.Since(start).Milliseconds())
		proxy.LastTest = timePtr(time.Now())
		callback(proxy)
		return
	}
	defer resp.Body.Close()

	proxy.Latency = int(time.Since(start).Milliseconds())
	proxy.Alive = boolPtr(resp.StatusCode >= 200 && resp.StatusCode < 400)
	if !*proxy.Alive {
		proxy.LastError = fmt.Sprintf("HTTP %d", resp.StatusCode)
	} else {
		proxy.LastError = ""
	}
	proxy.LastTest = timePtr(time.Now())
	callback(proxy)
}

// RunTest runs the proxy test with multi-threading and progress callbacks
func RunTest(
	ctx context.Context,
	proxies []Proxy,
	testURL string,
	timeout int,
	threads int,
	progressCallback func(TestProgress),
	resultCallback func(TestResult),
) {
	start := time.Now()
	total := len(proxies)

	// Limit threads to number of proxies
	if threads > total {
		threads = total
	}

	semaphore := make(chan struct{}, threads)
	var wg sync.WaitGroup
	var completed int32
	var aliveCount int32
	var deadCount int32

	// Copy proxies so we can update them
	results := make([]Proxy, total)
	copy(results, proxies)

	updateProgress := func() {
		c := int(atomic.LoadInt32(&completed))
		a := int(atomic.LoadInt32(&aliveCount))
		d := int(atomic.LoadInt32(&deadCount))
		progressCallback(TestProgress{
			Total:     total,
			Completed: c,
			Alive:     a,
			Dead:      d,
		})
	}

	for i := range results {
		// Check if cancelled before starting each goroutine
		select {
		case <-ctx.Done():
			// Context cancelled, stop launching goroutines
			goto finish
		default:
		}

		wg.Add(1)
		semaphore <- struct{}{}
		go func(idx int) {
			defer wg.Done()
			defer func() { <-semaphore }()

			TestProxy(
				ctx,
				results[idx],
				testURL,
				timeout,
				func(updated Proxy) {
					results[idx] = updated
					atomic.AddInt32(&completed, 1)
					if *updated.Alive {
						atomic.AddInt32(&aliveCount, 1)
					} else {
						atomic.AddInt32(&deadCount, 1)
					}
					updateProgress()
				},
			)
		}(i)
	}

	wg.Wait()

finish:
	duration := time.Since(start)
	resultCallback(TestResult{
		Total:    total,
		Alive:    int(atomic.LoadInt32(&aliveCount)),
		Dead:     int(atomic.LoadInt32(&deadCount)),
		Proxies:  results,
		Duration: duration.String(),
	})
}

func boolPtr(b bool) *bool {
	return &b
}

func timePtr(t time.Time) *time.Time {
	return &t
}
