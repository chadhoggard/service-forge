"use client";

import { useState } from "react";
import { HealthCheck } from "@/types";
import StatusBadge from "./StatusBadge";

interface Props {
  healthCheck: HealthCheck | null;
  hasUrl: boolean;
  onRunCheck: () => Promise<void>;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HealthCheckCard({
  healthCheck,
  hasUrl,
  onRunCheck,
}: Props) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      await onRunCheck();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Health check failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Health Check</h2>
        <button
          onClick={handleRun}
          disabled={running || !hasUrl}
          title={!hasUrl ? "No health check URL configured" : undefined}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              Checking…
            </>
          ) : (
            "Run Check"
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}

      {healthCheck ? (
        <div className="space-y-3">
          <StatusBadge status={healthCheck.status} size="md" />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg px-3 py-2.5">
              <p className="text-xs text-gray-400 mb-0.5">Response time</p>
              <p className="font-semibold text-gray-700">
                {healthCheck.response_time_ms
                  ? `${healthCheck.response_time_ms}ms`
                  : "—"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2.5">
              <p className="text-xs text-gray-400 mb-0.5">Last checked</p>
              <p className="font-semibold text-gray-700">
                {relativeTime(healthCheck.checked_at)}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            {new Date(healthCheck.checked_at).toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-sm text-gray-500">
            {hasUrl ? "No check run yet." : "No health check URL configured."}
          </p>
          {hasUrl && (
            <p className="text-xs text-gray-400 mt-1">
              Click &ldquo;Run Check&rdquo; to test the endpoint.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
