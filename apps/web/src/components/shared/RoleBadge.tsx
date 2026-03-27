import { cn, roleBadgeClass } from "@/lib/utils";

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium font-mono capitalize",
      roleBadgeClass(role),
    )}>
      {role}
    </span>
  );
}
