"use client";

import { useEffect, useState } from "react";
import { Service, Deployment, HealthCheck } from "@/types";
import { getServices, getDeployments, getLatestHealthCheck } from "@/lib/api";
import ServiceCard from "@/components/ServiceCard";
import { CardSkeleton } from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";

interface ServiceWithMeta extends Service {
  latestDeployment?: Deployment;
  healthCheck?: HealthCheck;
}

function StatCard({
  label,
  value,
  sub,
  color = "text-gray-900",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [services, setServices] = useState<ServiceWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      setError(null);
      const servicesData = await getServices();

      const enriched = await Promise.all(
        servicesData.map(async (service) => {
          let latestDeployment: Deployment | undefined;
          let healthCheck: HealthCheck | undefined;
          try {
            const deployments = await getDeployments(service.id);
            latestDeployment = deployments[0];
          } catch {}
          try {
            healthCheck = await getLatestHealthCheck(service.id);
          } catch {}
          return { ...service, latestDeployment, healthCheck };
        }),
      );

      setServices(enriched);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  }

  // Derived stats (computed after load)
  const healthy = services.filter(
    (s) => s.healthCheck?.status === "healthy",
  ).length;
  const unhealthy = services.filter(
    (s) => s.healthCheck?.status === "unhealthy",
  ).length;
  const succeeded = services.filter(
    (s) => s.latestDeployment?.status === "succeeded",
  ).length;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Overview of all registered services
          </p>
        </div>
        <a
          href="/services/new"
          className="bg-forge-600 text-white px-4 py-2 rounded-lg hover:bg-forge-700 transition-colors text-sm font-medium"
        >
          + Register Service
        </a>
      </div>

      {/* Stats bar */}
      {!loading && services.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Services" value={services.length} />
          <StatCard
            label="Healthy"
            value={healthy}
            sub="latest ping OK"
            color="text-green-600"
          />
          <StatCard
            label="Unhealthy"
            value={unhealthy}
            sub="latest ping failed"
            color={unhealthy > 0 ? "text-red-600" : "text-gray-900"}
          />
          <StatCard
            label="Deploy OK"
            value={succeeded}
            sub="last deploy succeeded"
            color="text-forge-600"
          />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Could not load services</p>
            <p className="text-xs mt-1 text-red-500">{error}</p>
          </div>
          <button
            onClick={loadServices}
            className="shrink-0 text-xs font-semibold text-red-700 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && services.length === 0 && (
        <EmptyState
          icon="📦"
          title="No services registered yet"
          description="Register your first containerized service to start tracking deployments and health checks."
          action={
            <a
              href="/services/new"
              className="inline-flex items-center bg-forge-600 text-white px-5 py-2 rounded-lg hover:bg-forge-700 transition-colors text-sm font-medium"
            >
              Register a Service
            </a>
          }
        />
      )}

      {/* Service grid */}
      {!loading && !error && services.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              latestDeployment={service.latestDeployment}
              healthCheck={service.healthCheck}
            />
          ))}
        </div>
      )}
    </div>
  );
}
