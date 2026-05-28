// ─── Service ───────────────────────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  repo_url: string;
  environment: Environment;
  health_check_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceCreate {
  name: string;
  repo_url: string;
  environment: Environment;
  health_check_url?: string;
  description?: string;
}

export interface ServiceUpdate {
  name?: string;
  repo_url?: string;
  environment?: Environment;
  health_check_url?: string | null;
  description?: string | null;
}

export type Environment = "development" | "staging" | "production";

// ─── Deployment ─────────────────────────────────────────────────────────────

export interface Deployment {
  id: string;
  service_id: string;
  version: string;
  image_uri: string | null;
  environment: Environment;
  status: DeploymentStatus;
  commit_sha: string | null;
  started_at: string | null;
  finished_at: string | null;
  notes: string | null;
  created_at: string;
}

export type DeploymentStatus =
  | "pending"
  | "building"
  | "deploying"
  | "succeeded"
  | "failed"
  | "rolled_back";

export interface DeploymentCreate {
  service_id: string;
  version: string;
  image_uri?: string;
  environment: Environment;
  status?: DeploymentStatus;
  commit_sha?: string;
  notes?: string;
}

export interface TriggerDeploymentRequest {
  version: string;
  environment: string;
  ref: string;
  image_uri?: string;
  notes?: string;
}

export interface TriggerDeploymentResponse {
  success: boolean;
  message: string;
  deployment: Deployment;
}

// ─── Health Check ───────────────────────────────────────────────────────────

export interface HealthCheck {
  id: string;
  service_id: string;
  status: "healthy" | "unhealthy";
  response_time_ms: string | null;
  checked_at: string;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}
