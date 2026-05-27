import { Service, Deployment, HealthCheck, Environment } from "@/types";
import StatusBadge from "./StatusBadge";

interface Props {
  service: Service;
  latestDeployment?: Deployment;
  healthCheck?: HealthCheck;
}

const ENV_COLORS: Record<Environment, string> = {
  production: "bg-red-100 text-red-700",
  staging: "bg-yellow-100 text-yellow-700",
  development: "bg-sky-100 text-sky-700",
};

function repoName(url: string) {
  try {
    return new URL(url).pathname.replace(/^\//, "").replace(/\.git$/, "");
  } catch {
    return url;
  }
}

export default function ServiceCard({ service, latestDeployment, healthCheck }: Props) {
  const envColor =
    ENV_COLORS[service.environment as Environment] ?? "bg-gray-100 text-gray-600";

  return (
    <a
      href={`/services/${service.id}`}
      className="group block bg-white rounded-xl border border-gray-200 p-5 hover:border-forge-400 hover:shadow-lg transition-all duration-150"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-base font-semibold text-gray-900 truncate group-hover:text-forge-700 transition-colors">
            {service.name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{repoName(service.repo_url)}</p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${envColor}`}
        >
          {service.environment}
        </span>
      </div>

      {/* Stats */}
      <div className="border-t border-gray-100 pt-3 mt-3 space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Latest deploy</span>
          {latestDeployment ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-700 text-xs">{latestDeployment.version}</span>
              <StatusBadge status={latestDeployment.status} />
            </div>
          ) : (
            <span className="text-gray-400 text-xs italic">none</span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Health</span>
          {healthCheck ? (
            <StatusBadge status={healthCheck.status} />
          ) : (
            <span className="text-gray-300 text-xs italic">not checked</span>
          )}
        </div>
      </div>
    </a>
  );
}
