import { useEffect, type DependencyList } from 'react';

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

/**
 * Runs an async effect that aborts on cleanup (StrictMode-safe).
 * Check `signal.aborted` before setState after awaits; skip error handling
 * when `signal.aborted || isAbortError(err)`.
 */
export function useAsyncEffect(
  effect: (signal: AbortSignal) => Promise<void>,
  deps: DependencyList
): void {
  useEffect(() => {
    const controller = new AbortController();
    void effect(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
