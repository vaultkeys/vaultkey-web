import { cn } from "@/lib/utils";

function statusClass(status: string) {
  switch (status) {
    case "completed": case "succeeded": case "active": case "ok":
      return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
    case "pending": case "processing":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
    case "failed": case "dead": case "canceled": case "revoked":
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium font-mono capitalize",
      statusClass(status),
    )}>
      {status}
    </span>
  );
}
