import { DeploymentStatus } from "@/types";

type AnyStatus = DeploymentStatus | "healthy" | "unhealthy";

interface Props {
  status: AnyStatus;
  /** Render as a larger pill with visible label. Default: compact badge. */
  size?: "sm" | "md";
}

const CONFIG: Record<AnyStatus, { label: string; dot: string; badge: string }> =
  {
    healthy: {
      label: "Healthy",
      dot: "bg-green-500",
      badge: "bg-green-50  text-green-700  ring-green-200",
    },
    unhealthy: {
      label: "Unhealthy",
      dot: "bg-red-500",
      badge: "bg-red-50    text-red-700    ring-red-200",
    },
    succeeded: {
      label: "Succeeded",
      dot: "bg-green-500",
      badge: "bg-green-50  text-green-700  ring-green-200",
    },
    failed: {
      label: "Failed",
      dot: "bg-red-500",
      badge: "bg-red-50    text-red-700    ring-red-200",
    },
    pending: {
      label: "Pending",
      dot: "bg-yellow-400",
      badge: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    },
    building: {
      label: "Building",
      dot: "bg-blue-500",
      badge: "bg-blue-50   text-blue-700   ring-blue-200",
    },
    deploying: {
      label: "Deploying",
      dot: "bg-purple-500",
      badge: "bg-purple-50 text-purple-700 ring-purple-200",
    },
    rolled_back: {
      label: "Rolled Back",
      dot: "bg-orange-500",
      badge: "bg-orange-50 text-orange-700 ring-orange-200",
    },
  };

export default function StatusBadge({ status, size = "sm" }: Props) {
  const cfg = CONFIG[status] ?? {
    label: status,
    dot: "bg-gray-400",
    badge: "bg-gray-50 text-gray-700 ring-gray-200",
  };

  const isPulsing = status === "building" || status === "deploying";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${
        size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"
      } ${cfg.badge}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {isPulsing && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${cfg.dot}`}
          />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot}`}
        />
      </span>
      {cfg.label}
    </span>
  );
}
