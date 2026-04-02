import { useChains } from "@/hooks/useChains";
import { cn } from "@/lib/utils";

function ChainBadge({ chain, chainId }: { chain: string; chainId?: string }) {
  const { chains } = useChains();

  let label: string;
  if (chain === "evm" && chainId) {
    const found = chains.find((c) => c.chain_id === chainId);
    // Capitalise first letter; fall back to raw chain ID if not loaded yet.
    label = found
      ? found.name.charAt(0).toUpperCase() + found.name.slice(1)
      : chainId;
  } else {
    label = chain.toUpperCase();
  }

  return (
    <span className={cn("inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono",
      chain === "evm"
        ? "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400"
        : "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400"
    )}>
      {label}
    </span>
  );
}

export default ChainBadge;