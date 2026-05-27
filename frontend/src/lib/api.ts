import {
  Service,
  ServiceCreate,
  ServiceUpdate,
  Deployment,
  DeploymentCreate,
  HealthCheck,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null as T;
  return res.json();
}

// ── Services
export const getServices = () => fetchAPI<Service[]>("/api/services/");

export const getService = (id: string) =>
  fetchAPI<Service>(`/api/services/${id}`);

export const createService = (data: ServiceCreate) =>
  fetchAPI<Service>("/api/services/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateService = (id: string, data: ServiceUpdate) =>
  fetchAPI<Service>(`/api/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteService = (id: string) =>
  fetchAPI<null>(`/api/services/${id}`, { method: "DELETE" });

// ── Deployments
export const getDeployments = (serviceId: string) =>
  fetchAPI<Deployment[]>(`/api/deployments/service/${serviceId}`);

export const createDeployment = (data: DeploymentCreate) =>
  fetchAPI<Deployment>("/api/deployments/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const rollbackDeployment = (deploymentId: string) =>
  fetchAPI<Deployment>(`/api/deployments/${deploymentId}/rollback`, {
    method: "POST",
  });

// ── Health Checks
export const checkHealth = (serviceId: string) =>
  fetchAPI<HealthCheck>(`/api/health-checks/service/${serviceId}`, {
    method: "POST",
  });

export const getLatestHealthCheck = (serviceId: string) =>
  fetchAPI<HealthCheck>(`/api/health-checks/service/${serviceId}/latest`);
