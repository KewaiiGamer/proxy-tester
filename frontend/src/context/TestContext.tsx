import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Proxy, TestProgress as TestProgressType, TestResult as TestResultType } from '../wailsgo';
import { App } from '../wailsgo';

const backend = new App();

interface TestContextValue {
  isTesting: boolean;
  progress: TestProgressType | null;
  results: Proxy[];
  duration: string;
  testError: string;
  startTest: (proxies: Proxy[], testURL: string, timeout: number, threads: number) => void;
  cancelTest: () => void;
  clearResults: () => void;
}

const TestContext = createContext<TestContextValue | null>(null);

export function TestProvider({ children }: { children: React.ReactNode }) {
  const [isTesting, setIsTesting] = useState(false);
  const [progress, setProgress] = useState<TestProgressType | null>(null);
  const [results, setResults] = useState<Proxy[]>([]);
  const [duration, setDuration] = useState('');
  const [testError, setTestError] = useState('');

  const pollingRef = useRef<number | null>(null);

  // Poll for progress whenever testing
  useEffect(() => {
    if (isTesting) {
      const poll = async () => {
        try {
          const p = await backend.GetProgress();
          if (p) {
            setProgress(p);
          }

          const testing = await backend.IsTesting();
          const done = await backend.IsDone();

          if (!testing && done) {
            const result = backend.GetResult();
            if (result?.proxies) {
              setResults(result.proxies);
              setDuration(result.duration || '');
            }
            setIsTesting(false);
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          }
        } catch (e) {
          // ignore polling errors
        }
      };

      pollingRef.current = window.setInterval(poll, 200);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }
  }, [isTesting]);

  const startTest = useCallback((proxies: Proxy[], testURL: string, timeout: number, threads: number) => {
    if (proxies.length === 0 || !testURL) {
      setTestError('No proxies loaded or no domain selected');
      return;
    }

    setIsTesting(true);
    setTestError('');
    setResults([]);
    setProgress({ total: proxies.length, completed: 0, alive: 0, dead: 0, current_index: 0 });
    setDuration('');

    try {
      backend.StartTest(proxies, testURL, timeout, threads);
    } catch (e: any) {
      const errMsg = e?.message || e?.error || JSON.stringify(e);
      setTestError('Failed to start test: ' + errMsg);
      setIsTesting(false);
      setProgress(null);
    }
  }, []);

  const cancelTest = useCallback(() => {
    backend.CancelTest();
    setIsTesting(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setProgress(null);
    setDuration('');
    setTestError('');
    setIsTesting(false);
  }, []);

  return (
    <TestContext.Provider value={{
      isTesting,
      progress,
      results,
      duration,
      testError,
      startTest,
      cancelTest,
      clearResults,
    }}>
      {children}
    </TestContext.Provider>
  );
}

export function useTest() {
  const ctx = useContext(TestContext);
  if (!ctx) {
    throw new Error('useTest must be used within TestProvider');
  }
  return ctx;
}
