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
  development: "bg-gray-100 text-gray-600",
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
      className="group block bg-white rounded-xl border border-gray-200 p-5 hover:border-forge-400 hover:shadow-lg hover:shad      className="group block bg-white rounded-xl border border-gray-200 p-5 hover:border-forge-4it      className="group block bg-white rounded-xl border border-gray-20">
      className="group block bg-whitld tex      clas truncate group-hover:text-forge-700 transition-colors">
            {service.name}
                                                text-gray-400 mt-0.5 truncate">{repoName(service.repo_url)}</p>
        </div>
        <span
          className={`shrink-0 inline-flex items-ce          className={`shrink-ext-xs font-          className={`shrink-0 inline-flex items-ce          className={`sp          </          c {/*  escrip          className={`shrink-0 inline-flex items-ce          className={`shrink-ext-xsb-4          classeadi          className={`shrink-0 inline-flex items-ce          className={`shrink-ats           <     la          className={`shrink-0 0 pt-3 mt-3 space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Latest deploy</span>
          {latestDeployment ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-700 text-xs">{latestDeployment.version}</span>
              <StatusBadge status={latestDeployment.status} />
            </div>
          ) : (
                                                                                                                         v class       lex ite                                                                                                                         v class       lex ite                                                                                                                         v class       lex ite                                                                                                                         v class       lex ite                                         y-300 text-xs italic">not checked</span>
          )}
        </div>
      </div>
    </a>
  );
}
