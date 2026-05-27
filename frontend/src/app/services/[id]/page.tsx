"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Service, Deployment, HealthCheck, DeploymentStatus } from "@/types";
import {
  getService,
  getDeployments,
  getLatestHealthCheck,
  checkHealth,
  deleteService,
  rollbackDeployment,
  createDeployment,
  triggerDeployment,
} from "@/lib/api";
import DeploymentTable from "@/components/DeploymentTable";
import HealthCheckCard from "@/components/HealthCheckCard";
import { DetailSkeleton, TableSkeleton } from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;
  const { toasts, toast, dismiss } = useToast();

  const [service, setService] = useState<Service | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [deploysLoading, setDeploysLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeployForm, setShowDeployForm] = useState(false);
  const [showTriggerForm, setShowTriggerForm] = useState(false);
  const [deployForm, setDeployForm] = useState<{
    version: string;
    image_uri: string;
    commit_sha: string;
    notes: string;
    status: DeploymentStatus;
  }>({
    version: "",
    image_uri: "",
    commit_sha: "",
    notes: "",
    status: "succeeded",
  });
  const [triggerForm, setTriggerForm] = useState({
    version: "",
    ref: "main",
    notes: "",
  });
  const [triggering, setTriggering] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();
  }, [serviceId]);

  async function loadData() {
    try {
      setLoading(true);
      setDeploysLoading(true);
      const [svc, deps] = await Promise.all([
        getService(serviceId),
        getDeployments(serviceId),
      ]);
      setService(svc);
      setDeployments(deps);

      try {
        const hc = await getLatestHealthCheck(serviceId);
        setHealthCheck(hc);
      } catch {
        /* no health check yet */
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load service");
    } finally {
      setLoading(false);
      setDeploysLoading(false);
    }
  }

  async function handleRunCheck() {
    const hc = await checkHealth(serviceId);
    setHealthCheck(hc);
  }

  async function handleDelete() {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    try {
      await deleteService(serviceId);
      router.push("/");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }

  async function handleRollback(deploymentId: string) {
    if (!confirm("Create a rollback deployment from this version?")) return;
    try {
      await rollbackDeployment(deploymentId);
      toast("Rollback deployment created", "success");
      await loadData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Rollback failed", "error");
    }
  }

  async function handleTrigger(e: React.FormEvent) {
    e.preventDefault();
    if (!service) return;
    try {
      setTriggering(true);
      const result = await triggerDeployment(serviceId, {
        version: triggerForm.version.trim(),
        environment: service.environment,
        ref: triggerForm.ref.trim() || "main",
        notes: triggerForm.notes.trim() || undefined,
      });
      setShowTriggerForm(false);
      setTriggerForm({ version: "", ref: "main", notes: "" });
      toast(result.message, "success");
      await loadData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Trigger failed", "error");
    } finally {
      setTriggering(false);
    }
  }

  async function handleDeploy(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createDeployment({
        service_id: serviceId,
        version: deployForm.version.trim(),
        image_uri: deployForm.image_uri.trim() || undefined,
        environment: service?.environment ?? "development",
        commit_sha: deployForm.commit_sha.trim() || undefined,
        notes: deployForm.notes.trim() || undefined,
        status: deployForm.status,
      });
      setShowDeployForm(false);
      setDeployForm({ version: "", image_uri: "", commit_sha: "", notes: "", status: "succeeded" as DeploymentStatus });
      toast(`Deployed version ${deployForm.version}`, "success");
      await loadData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Deploy failed", "error");
    }
  }

  const FIELD =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-forge-500 focus:border-forge-500 outline-none";

  if (loading) return <DetailSkeleton />;

  if (error || !service) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-semibold text-base">Could not load service</p>
        <p className="text-sm mt-1">{error ?? "Service not found"}</p>
        <button
          onClick={loadData}
          className="mt-4 text-sm font-medium text-red-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const ENV_COLORS: Record<string, string> = {
    production: "bg-red-100 text-red-700",
    staging: "bg-yellow-100 text-yellow-700",
    development: "bg-sky-100 text-sky-700",
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <a href="/" className="hover:text-forge-600 transition-colors">
          Dashboard
        </a>
        <span>›</span>
        <span className="text-gray-900 font-medium">{service.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ENV_COLORS[service.environment] ?? "bg-gray-100 text-gray-700"}`}
            >
              {service.environment}
            </span>
          </div>
          {service.description && (
            <p className="text-gray-500 text-sm mt-1">{service.description}</p>
          )}
          <a
            href={service.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-forge-600 transition-colors mt-1 inline-block"
          >
            {service.repo_url}
          </a>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <a
            href={`/services/${service.id}/edit`}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Edit
          </a>
          <button
              onClick={() => {
                setShowTriggerForm((v) => !v);
                setShowDeployForm(false);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
            >
              {showTriggerForm ? "Cancel" : "Trigger Deployment"}
            </button>
            <button
              onClick={() => {
                setShowDeployForm((v) => !v);
                setShowTriggerForm(false);
              }}
              className="bg-forge-600 text-white px-4 py-2 rounded-lg hover:bg-forge-700 transition-colors text-sm font-semibold"
            >
              {showDeployForm ? "Cancel" : "Record Deployment"}
            </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Health Check */}
      <div className="mb-6">
        <HealthCheckCard
          healthCheck={healthCheck}
          hasUrl={!!service.health_check_url}
          onRunCheck={handleRunCheck}
        />
      </div>

      {/* Trigger Deployment Form */}
      {showTriggerForm && (
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6 mb-6 animate-in">
          <h2 className="text-base font-semibold text-indigo-900 mb-1">
            Trigger GitHub Actions Deployment
          </h2>
          <p className="text-xs text-indigo-600 mb-4">
            Dispatches the <code className="font-mono">{service.repo_url}</code> workflow and records a <span className="font-medium">building</span> deployment.
          </p>
          <form onSubmit={handleTrigger} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version / Tag <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={triggerForm.version}
                  onChange={(e) => setTriggerForm({ ...triggerForm, version: e.target.value })}
                  className={FIELD}
                  placeholder="v1.2.3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Git Ref
                </label>
                <input
                  type="text"
                  value={triggerForm.ref}
                  onChange={(e) => setTriggerForm({ ...triggerForm, ref: e.target.value })}
                  className={FIELD}
                  placeholder="main"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={triggerForm.notes}
                  onChange={(e) => setTriggerForm({ ...triggerForm, notes: e.target.value })}
                  className={FIELD}
                  placeholder="What does this deployment include?"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={triggering}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {triggering && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {triggering ? "Dispatching…" : "Trigger Deployment"}
              </button>
              <button
                type="button"
                onClick={() => setShowTriggerForm(false)}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deploy Form */}
      {showDeployForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 animate-in">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Create Deployment
          </h2>
          <form onSubmit={handleDeploy} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version / Tag <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={deployForm.version}
                  onChange={(e) =>
                    setDeployForm({ ...deployForm, version: e.target.value })
                  }
                  className={FIELD}
                  placeholder="v1.2.3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URI
                </label>
                <input
                  type="text"
                  value={deployForm.image_uri}
                  onChange={(e) =>
                    setDeployForm({ ...deployForm, image_uri: e.target.value })
                  }
                  className={FIELD}
                  placeholder="registry.io/app:v1.2.3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commit SHA
                </label>
                <input
                  type="text"
                  value={deployForm.commit_sha}
                  onChange={(e) =>
                    setDeployForm({ ...deployForm, commit_sha: e.target.value })
                  }
                  className={FIELD}
                  placeholder="abc1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={deployForm.status}
                  onChange={(e) =>
                    setDeployForm({ ...deployForm, status: e.target.value as DeploymentStatus })
                  }
                  className={FIELD}
                >
                  <option value="succeeded">succeeded</option>
                  <option value="deploying">deploying</option>
                  <option value="failed">failed</option>
                  <option value="pending">pending</option>
                  <option value="building">building</option>
                  <option value="rolled_back">rolled_back</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={deployForm.notes}
                  onChange={(e) =>
                    setDeployForm({ ...deployForm, notes: e.target.value })
                  }
                  className={FIELD}
                  placeholder="What changed?"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="bg-forge-600 text-white px-5 py-2 rounded-lg hover:bg-forge-700 transition-colors text-sm font-semibold"
              >
                Deploy
              </button>
              <button
                type="button"
                onClick={() => setShowDeployForm(false)}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deployment History */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Deployment History
          </h2>
        </div>
        <div className="p-6">
          {deploysLoading ? (
            <TableSkeleton rows={3} />
          ) : deployments.length === 0 ? (
            <EmptyState
              title="No deployments yet"
              description="Create your first deployment to start tracking versions."
              action={
                <button
                  onClick={() => setShowDeployForm(true)}
                  className="bg-forge-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-forge-700 transition-colors"
                >
                  New Deployment
                </button>
              }
            />
          ) : (
            <DeploymentTable
              deployments={deployments}
              onRollback={handleRollback}
            />
          )}
        </div>
      </div>
    </div>
  );
}
