"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setTick((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(path, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as T & { error?: string };
        if (!response.ok) throw new Error(body.error || "Request failed.");
        setData(body);
        setError(null);
      })
      .catch((reason: Error) => {
        if (reason.name === "AbortError") return;
        setError(reason.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, tick]);

  return { data, error, loading, reload, setData };
}

export function PanelState({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="grid gap-3" aria-busy="true">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-950" role="alert">
        <p>{error}</p>
        {onRetry ? (
          <Button className="mt-3" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    );
  }
  return children;
}
