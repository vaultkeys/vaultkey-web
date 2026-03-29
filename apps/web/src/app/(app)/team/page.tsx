"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Plus, UserMinus, Mail, X, FlaskConical, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { type Member, type Invite } from "@/lib/api";
import { useOrg } from "@/hooks/useOrg";
import { useEnv } from "@/hooks/useEnv";
import { useApi } from "@/hooks/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { formatDate } from "@/lib/utils";
import React from "react";

const ROLES = ["admin", "developer", "viewer"] as const;

export default function TeamPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { orgId } = useOrg();
  const { isTestnet } = useEnv();
  const { cloud } = useApi();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const load = async () => {
    if (!orgId) return;
    try {
      const token = await getToken();
      if (!token) return;
      const [mRes, iRes] = await Promise.all([
        cloud.listMembers(token, orgId),
        cloud.listInvites(token, orgId),
      ]);
      setMembers(mRes.members);
      setInvites(iRes.invites.filter((i) => !i.accepted_at));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMembers([]);
    setInvites([]);
    setLoading(true);
    load();
  }, [orgId]);

  const removeMember = async (clerkUserId: string, name: string) => {
    if (!confirm(`Remove ${name} from the organization?`)) return;
    try {
      const token = await getToken();
      if (!token) return;
      await cloud.removeMember(token, orgId!, clerkUserId);
      setMembers((p) => p.filter((m) => m.clerk_user_id !== clerkUserId));
      toast.success("Member removed");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const changeRole = async (clerkUserId: string, role: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await cloud.updateMember(token, orgId!, clerkUserId, role);
      setMembers((p) =>
        p.map((m) =>
          m.clerk_user_id === clerkUserId ? { ...m, role: updated.role } : m
        )
      );
      toast.success("Role updated");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const revokeInvite = async (inviteToken: string) => {
    if (!confirm("Revoke this invitation? The link in the email will stop working.")) return;
    try {
      const token = await getToken();
      if (!token) return;
      await cloud.revokeInvite(token, orgId!, inviteToken);
      setInvites((p) => p.filter((i) => i.token !== inviteToken));
      toast.success("Invite revoked");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const myRole = members.find((m) => m.clerk_user_id === user?.id)?.role;
  const canManage = myRole === "owner" || myRole === "admin";

  return (
    <div className="p-4 sm:p-8">
      <PageHeader
        title="Team"
        description="Manage members and pending invitations"
        action={
          canManage && (
            <button
              onClick={() => setShowInvite(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Invite member
            </button>
          )
        }
      />

      {isTestnet && (
        <div className="mb-6 rounded-lg border border-yellow-500/25 bg-yellow-500/8 px-4 py-3 flex items-start gap-2.5">
          <FlaskConical className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              Testnet team is separate from mainnet
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Members invited here won't automatically appear on mainnet.
            </p>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          Members ({members.length})
        </p>
        {loading ? (
          <TeamSkeleton />
        ) : members.length === 0 ? (
          <EmptyState icon={<Mail className="h-8 w-8" />} title="No members" />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Member", "Role", "Joined", ""].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-medium text-muted-foreground font-mono text-xs uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const isMe = m.clerk_user_id === user?.id;
                    const isOwner = m.role === "owner";
                    return (
                      <tr
                        key={m.id}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">
                              {m.first_name} {m.last_name}{" "}
                              {isMe && (
                                <span className="text-xs text-muted-foreground">(you)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">{m.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {canManage && !isOwner && !isMe ? (
                            <select
                              value={m.role}
                              onChange={(e) => changeRole(m.clerk_user_id, e.target.value)}
                              className="rounded border border-input bg-background px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring/30"
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <RoleBadge role={m.role} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDate(m.joined_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canManage && !isOwner && !isMe && (
                            <button
                              onClick={() =>
                                removeMember(
                                  m.clerk_user_id,
                                  `${m.first_name} ${m.last_name}`
                                )
                              }
                              className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Remove member"
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden space-y-2">
              {members.map((m) => {
                const isMe = m.clerk_user_id === user?.id;
                const isOwner = m.role === "owner";
                return (
                  <div key={m.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {m.first_name} {m.last_name}{" "}
                          {isMe && (
                            <span className="text-xs text-muted-foreground">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(m.joined_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {canManage && !isOwner && !isMe ? (
                          <select
                            value={m.role}
                            onChange={(e) => changeRole(m.clerk_user_id, e.target.value)}
                            className="rounded border border-input bg-background px-2 py-1 text-xs font-mono focus:outline-none"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <RoleBadge role={m.role} />
                        )}
                        {canManage && !isOwner && !isMe && (
                          <button
                            onClick={() =>
                              removeMember(
                                m.clerk_user_id,
                                `${m.first_name} ${m.last_name}`
                              )
                            }
                            className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
            Pending invites ({invites.length})
          </p>

          {/* Desktop */}
          <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Email", "Role", "Expires", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium text-muted-foreground font-mono text-xs uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{inv.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={inv.role} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(inv.expires_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManage && (
                        <div className="flex items-center justify-end gap-1">
                          <CopyInviteLinkButton token={inv.token} />
                          <button
                            onClick={() => revokeInvite(inv.token)}
                            className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Revoke invite"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="sm:hidden space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{inv.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <RoleBadge role={inv.role} />
                    <span className="text-xs text-muted-foreground">
                      Expires {formatDate(inv.expires_at)}
                    </span>
                  </div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 shrink-0">
                    <CopyInviteLinkButton token={inv.token} />
                    <button
                      onClick={() => revokeInvite(inv.token)}
                      className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvited={(inv) => {
            setInvites((p) => [inv, ...p]);
            setShowInvite(false);
          }}
          orgId={orgId!}
        />
      )}
    </div>
  );
}

// ── Copy invite link button ───────────────────────────────────────────────────

function CopyInviteLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const baseURL = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
  const link = `${baseURL}/invite/accept?token=${token}`;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Invite link copied");
  };

  return (
    <button
      onClick={copy}
      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title="Copy invite link"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ── Invite modal ──────────────────────────────────────────────────────────────

function InviteModal({
  onClose,
  onInvited,
  orgId,
}: {
  onClose: () => void;
  onInvited: (i: Invite) => void;
  orgId: string;
}) {
  const { getToken } = useAuth();
  const { cloud } = useApi();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "developer" | "viewer">("developer");
  const [loading, setLoading] = useState(false);
  // Track whether the invite was sent so we can show a confirmation state.
  const [sent, setSent] = useState<Invite | null>(null);

  const submit = async () => {
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const inv = await cloud.createInvite(token, orgId, { email, role });
      setSent(inv);
      onInvited(inv);
      toast.success(`Invite sent to ${email}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Close on Escape.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl border-2 border-border bg-popover p-6 shadow-xl">
        {sent ? (
          // ── Success state ──────────────────────────────────────────────────
          <div className="text-center py-2">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <Mail className="h-6 w-6 text-green-500" />
            </div>
            <h2 className="font-semibold text-base mb-1">Invite sent!</h2>
            <p className="text-sm text-muted-foreground mb-1">
              An email was sent to <strong>{sent.email}</strong>.
            </p>
            <p className="text-xs text-muted-foreground mb-5">
              If they don't have an account, the email will guide them to sign up first.
              The link expires{" "}
              <strong>{formatDate(sent.expires_at)}</strong>.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-md py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          // ── Form state ────────────────────────────────────────────────────
          <>
            <h2 className="font-semibold text-base mb-1">Invite member</h2>
            <p className="text-xs text-muted-foreground mb-4">
              An email will be sent with a link to join. New users will be prompted
              to create an account first.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="colleague@company.com"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
                  autoFocus
                  type="email"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
                <RoleDescription role={role} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={loading || !email}
                className="px-4 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? "Sending…" : "Send invite"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RoleDescription({ role }: { role: string }) {
  const descriptions: Record<string, string> = {
    admin: "Can manage members, API keys, and billing.",
    developer: "Can view API keys and usage. Cannot manage members.",
    viewer: "Read-only access to the dashboard.",
  };
  return (
    <p className="text-xs text-muted-foreground mt-1.5">{descriptions[role]}</p>
  );
}

function TeamSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="h-10 bg-muted/30" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-14 border-t border-border bg-muted/10" />
      ))}
    </div>
  );
}