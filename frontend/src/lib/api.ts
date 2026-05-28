import {
  Service,
  ServiceCreate,
  ServiceUpdate,
  Deployment,
  DeploymentCreate,
  TriggerDeploymentRequest,
  TriggerDeploymentResponse,
  HealthCheck,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("sf_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sf_token");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null as T;
  return res.json();
}

export const getServices = () => fetchAPI<Service[]>("/api/services/");
export const getService = (id: string) => fetchAPI<Service>(`/api/services/${id}`);
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
export const triggerDeployment = (
  serviceId: string,
  data: TriggerDeploymentRequest,
) =>
  fetchAPI<TriggerDeploymentResponse>(
    `/api/services/${serviceId}/trigger-deployment`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );

export const checkHealth = (serviceId: string) =>
  fetchAPI<HealthCheck>(`/api/health-checks/service/${serviceId}`, {
    method: "POST",
  });
export const getLatestHealthCheck = (serviceId: string) =>
  fetchAPI<HealthCheck>(`/api/health-checks/service/${serviceId}/latest`);
