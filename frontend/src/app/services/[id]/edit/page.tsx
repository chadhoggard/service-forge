"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getService, updateService } from "@/lib/api";
import { Environment, ServiceUpdate } from "@/types";

type FormState = {
  name: string;
  repo_url: string;
  environment: Environment;
  health_check_url: string;
  description: string;
};

const FIELD =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-forge-500 focus:border-forge-500 outline-none transition-colors placeholder:text-gray-400";

export default function EditServicePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: "",
    repo_url: "",
    environment: "development",
    health_check_url: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getService(id)
      .then((svc) => {
        setForm({
          name: svc.name,
          repo_url: svc.repo_url,
          environment: svc.environment as Environment,
          health_check_url: svc.health_check_url ?? "",
          description: svc.description ?? "",
        });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load service");
      })
      .finally(() => setLoading(false));
  }, [id]);

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: ServiceUpdate = {
      name: form.name.trim(),
      repo_url: form.repo_url.trim(),
      environment: form.environment,
      health_check_url: form.health_check_url.trim() || null,
      description: form.description.trim() || null,
    };

    try {
      await updateService(id, payload);
      router.push(`/services/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-10 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <a href="/" className="hover:text-forge-600 transition-colors">
          Dashboard
        </a>
        <span>›</span>
        <a
          href={`/services/${id}`}
          className="hover:text-forge-600 transition-colors"
        >
          {form.name || "Service"}
        </a>
        <span>›</span>
        <span className="text-gray-900 font-medium">Edit</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-1">Edit Service</h1>
      <p className="text-sm text-gray-500 mb-8">
        Update service configuration.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-6 flex items-start gap-3">
          <span className="text-red-500 shrink-0">✕</span>
          <div>
            <p className="text-sm font-medium">Save failed</p>
            <p className="text-xs mt-0.5 text-red-600">{error}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100"
      >
        {/* Basic Info */}
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
              className={FIELD}
              placeholder="api-gateway"
            />
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
              className={FIELD}
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
              className={FIELD}
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
              className={FIELD}
              placeholder="What does this service do?"
            />
          </div>
        </div>

        {/* Health Check */}
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
              className={FIELD}
              placeholder="https://my-service.example.com/health"
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave empty to disable health checks.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex items-center gap-3 bg-gray-50 rounded-b-xl">
          <button
            type="submit"
            disabled={saving}
            className="bg-forge-600 text-white px-5 py-2 rounded-lg hover:bg-forge-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <a
            href={`/services/${id}`}
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
