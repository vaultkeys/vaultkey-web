import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCredits(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

export function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: currency.toUpperCase(), minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function roleColor(role: string): string {
  switch (role) {
    case "owner": return "text-[hsl(var(--yellow))]";
    case "admin": return "text-[hsl(var(--blue))]";
    case "developer": return "text-[hsl(var(--green))]";
    default: return "text-muted-foreground";
  }
}

export function roleBadgeClass(role: string): string {
  switch (role) {
    case "owner": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
    case "admin": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "developer": return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "completed": case "succeeded": case "active": return "text-[hsl(var(--green))]";
    case "pending": case "processing": return "text-[hsl(var(--yellow))]";
    case "failed": case "dead": case "canceled": return "text-[hsl(var(--red))]";
    default: return "text-muted-foreground";
  }
}

export function operationLabel(op: string): string {
  const map: Record<string, string> = {
    create_wallet: "Create Wallet",
    sign_tx_evm: "Sign EVM Tx",
    sign_msg_evm: "Sign EVM Msg",
    sign_tx_solana: "Sign Solana Tx",
    sign_msg_solana: "Sign Solana Msg",
    sweep_evm: "Sweep EVM",
    sweep_solana: "Sweep Solana",
    stablecoin_transfer_evm: "USDC/USDT Transfer (EVM)",
    stablecoin_transfer_solana: "USDC/USDT Transfer (Solana)",
  };
  return map[op] ?? op;
}
