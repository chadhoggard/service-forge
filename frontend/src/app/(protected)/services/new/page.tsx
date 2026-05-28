"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createService } from "@/lib/api";
import { Environment } from "@/types";

type FormState = {
  name: string;
  repo_url: string;
  environment: Environment;
  health_check_url: string;
  description: string;
};

const FIELD_CLASS =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-forge-500 focus:border-forge-500 outline-none transition-colors placeholder:text-gray-400";

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    repo_url: "",
    environment: "development",
    health_check_url: "",
    description: "",
  });

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        repo_url: form.repo_url.trim(),
        environment: form.environment,
        health_check_url: form.health_check_url.trim() || undefined,
        description: form.description.trim() || undefined,
      };
      const service = await createService(payload);
      router.push(`/services/${service.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create service");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <a href="/" className="hover:text-forge-600 transition-colors">
          Dashboard
        </a>
        <span>›</span>
        <span className="text-gray-900 font-medium">Register Service</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-1">
        Register New Service
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Add a containerized service to ServiceForge to start tracking
        deployments and health.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-6 flex items-start gap-3">
          <span className="text-red-500 shrink-0">✕</span>
          <div>
            <p className="text-sm font-medium">Registration failed</p>
            <p className="text-xs mt-0.5 text-red-600">{error}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100"
      >
        {/* Section: Basic info */}
        <div className="p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Basic Info
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Service Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={FIELD_CLASS}
              placeholder="api-gateway"
            />
            <p className="text-xs text-gray-400 mt-1">
              Use lowercase letters, numbers, and hyphens.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              GitHub Repository URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required
              value={form.repo_url}
              onChange={(e) => update("repo_url", e.target.value)}
              className={FIELD_CLASS}
              placeholder="https://github.com/org/repo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Environment
            </label>
            <select
              value={form.environment}
              onChange={(e) =>
                update("environment", e.target.value as Environment)
              }
              className={FIELD_CLASS}
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className={FIELD_CLASS}
              placeholder="What does this service do?"
            />
          </div>
        </div>

        {/* Section: Health check */}
        <div className="p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Health Check
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Health Check URL
            </label>
            <input
              type="url"
              value={form.health_check_url}
              onChange={(e) => update("health_check_url", e.target.value)}
              className={FIELD_CLASS}
              placeholder="https://my-service.example.com/health"
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave empty if this service doesn&apos;t expose a health endpoint
              yet.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex items-center gap-3 bg-gray-50 rounded-b-xl">
          <button
            type="submit"
            disabled={loading}
            className="bg-forge-600 text-white px-5 py-2 rounded-lg hover:bg-forge-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registering…" : "Register Service"}
          </button>
          <a
            href="/"
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
