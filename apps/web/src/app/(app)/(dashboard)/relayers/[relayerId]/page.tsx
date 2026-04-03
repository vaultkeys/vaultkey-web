"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Fuel } from "lucide-react";
import { toast } from "sonner";
import { type Relayer } from "@/lib/api";
import { useOrg } from "@/hooks/useOrg";
import { useApi } from "@/hooks/useApi";
import { useChains } from "@/hooks/useChains";
import { RelayerDetail } from "@/components/shared/RelayerDetail";
import { shortAddress } from "@/lib/utils";
import ChainBadge from "@/components/shared/ChainBadge";

export default function RelayerDetailPage() {
  const { relayerId } = useParams<{ relayerId: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { orgId } = useOrg();
  const { cloud } = useApi();
  const { ensureChains } = useChains();

  const [relayer, setRelayer] = useState<Relayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => { ensureChains(); }, [ensureChains]);

  const load = useCallback(async () => {
    if (!orgId || !relayerId) return;
    setLoading(true);
    setNotFound(false);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await cloud.getRelayer(token, orgId, relayerId);
      setRelayer(data);
    } catch (e: any) {
      if (e.status === 404) {
        setNotFound(true);
      } else {
        toast.error(e.message ?? "Failed to load fee payer");
      }
    } finally {
      setLoading(false);
    }
  }, [orgId, relayerId, getToken, cloud]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeactivated = () => {
    // Update local state so the inactive banner appears without a full reload.
    setRelayer((prev) => prev ? { ...prev, active: false } : prev);
  };

  const handleUpdated = (updated: Relayer) => {
    setRelayer(updated);
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl">
        <div className="h-5 w-24 rounded bg-muted/40 animate-pulse mb-6" />
        <div className="h-7 w-48 rounded bg-muted/40 animate-pulse mb-2" />
        <div className="h-4 w-32 rounded bg-muted/30 animate-pulse mb-8" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border h-36 bg-muted/10 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────────

  if (notFound || !relayer) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl">
        <button
          onClick={() => router.push("/relayers")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Fee Payers
        </button>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Fuel className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">Fee payer not found</p>
          <p className="text-xs text-muted-foreground mt-1">
            It may have been deactivated or belong to a different organization.
          </p>
          <button
            onClick={() => router.push("/relayers")}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Back to fee payers
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      {/* Back nav */}
      <button
        onClick={() => router.push("/relayers")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Fee Payers
      </button>

      {/* Page header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
          <Fuel className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight font-mono">
            {shortAddress(relayer.address)}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <ChainBadge chain={relayer.chain_type} chainId={relayer.chain_id} />
            {!relayer.active && (
              <span className="text-xs text-muted-foreground">· Inactive</span>
            )}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <RelayerDetail
        relayer={relayer}
        orgId={orgId!}
        onDeactivated={handleDeactivated}
        onUpdated={handleUpdated}
      />
    </div>
  );
}