import { Deployment } from "@/types";
import StatusBadge from "./StatusBadge";

interface Props {
  deployments: Deployment[];
  onRollback: (deploymentId: string) => void;
}

function relativeTime(iso: string): string {
  const utc = iso.endsWith("Z") ? iso : iso + "Z";
  const diff = Date.now() - new Date(utc).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function deployDuration(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  const startUtc = start.endsWith("Z") ? start : start + "Z";
  const endUtc = end.endsWith("Z") ? end : end + "Z";
  const ms = new Date(endUtc).getTime() - new Date(startUtc).getTime();
  if (ms < 1000) return "< 1s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

const HEADERS = [
  "Version",
  "Status",
  "Commit",
  "Duration",
  "Deployed",
  "Notes",
  "",
];

export default function DeploymentTable({ deployments, onRollback }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr>
            {HEADERS.map((h) => (
              <th
                key={h}
                className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deployments.map((d) => (
            <tr key={d.id} className="group hover:bg-gray-50 transition-colors">
              <td className="py-3 px-3 border-b border-gray-100">
                <span className="font-mono font-medium text-gray-900">
                  {d.version}
                </span>
              </td>
              <td className="py-3 px-3 border-b border-gray-100">
                <StatusBadge status={d.status} />
              </td>
              <td className="py-3 px-3 border-b border-gray-100">
                {d.commit_sha ? (
                  <span
                    className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded cursor-default"
                    title={d.commit_sha}
                  >
                    {d.commit_sha.slice(0, 7)}
                  </span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="py-3 px-3 border-b border-gray-100 text-gray-500 tabular-nums">
                {deployDuration(d.started_at, d.finished_at)}
              </td>
              <td className="py-3 px-3 border-b border-gray-100 text-gray-400 text-xs whitespace-nowrap">
                {d.started_at ? relativeTime(d.started_at) : "—"}
              </td>
              <td className="py-3 px-3 border-b border-gray-100 text-gray-500 max-w-[200px]">
                <span className="block truncate" title={d.notes ?? undefined}>
                  {d.notes || <span className="text-gray-300">—</span>}
                </span>
              </td>
              <td className="py-3 px-3 border-b border-gray-100 text-right">
                {d.status === "succeeded" && (
                  <button
                    onClick={() => onRollback(d.id)}
                    className="text-xs font-medium text-forge-600 hover:text-forge-800 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Rollback
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
