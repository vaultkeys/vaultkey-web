"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Plus, UserMinus, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { cloud, type Member, type Invite } from "@/lib/api";
import { useOrg } from "@/hooks/useOrg";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { formatDate } from "@/lib/utils";

const ROLES = ["admin", "developer", "viewer"] as const;

export default function TeamPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { orgId } = useOrg();
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
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [orgId]);

  const removeMember = async (clerkUserId: string, name: string) => {
    if (!confirm(`Remove ${name} from the organization?`)) return;
    try {
      const token = await getToken();
      if (!token) return;
      await cloud.removeMember(token, orgId!, clerkUserId);
      setMembers((p) => p.filter((m) => m.clerk_user_id !== clerkUserId));
      toast.success("Member removed");
    } catch (e: any) { toast.error(e.message); }
  };

  const changeRole = async (clerkUserId: string, role: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await cloud.updateMember(token, orgId!, clerkUserId, role);
      setMembers((p) => p.map((m) => m.clerk_user_id === clerkUserId ? { ...m, role: updated.role } : m));
      toast.success("Role updated");
    } catch (e: any) { toast.error(e.message); }
  };

  const revokeInvite = async (inviteToken: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await cloud.revokeInvite(token, orgId!, inviteToken);
      setInvites((p) => p.filter((i) => i.token !== inviteToken));
      toast.success("Invite revoked");
    } catch (e: any) { toast.error(e.message); }
  };

  const myRole = members.find((m) => m.clerk_user_id === user?.id)?.role;
  const canManage = myRole === "owner" || myRole === "admin";

  return (
    <div className="p-8">
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

      {/* Members */}
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Members ({members.length})</p>
        {loading ? (
          <TeamSkeleton />
        ) : members.length === 0 ? (
          <EmptyState icon={<Mail className="h-8 w-8" />} title="No members" />
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Member", "Role", "Joined", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground font-mono text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const isMe = m.clerk_user_id === user?.id;
                  const isOwner = m.role === "owner";
                  return (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{m.first_name} {m.last_name} {isMe && <span className="text-xs text-muted-foreground">(you)</span>}</p>
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
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <RoleBadge role={m.role} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(m.joined_at)}</td>
                      <td className="px-4 py-3 text-right">
                        {canManage && !isOwner && !isMe && (
                          <button
                            onClick={() => removeMember(m.clerk_user_id, `${m.first_name} ${m.last_name}`)}
                            className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
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
        )}
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Pending invites ({invites.length})</p>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Email", "Role", "Expires", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground font-mono text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{inv.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={inv.role} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(inv.expires_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {canManage && (
                        <button
                          onClick={() => revokeInvite(inv.token)}
                          className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvited={(inv) => { setInvites((p) => [inv, ...p]); setShowInvite(false); }}
          orgId={orgId!}
        />
      )}
    </div>
  );
}

function InviteModal({ onClose, onInvited, orgId }: { onClose: () => void; onInvited: (i: Invite) => void; orgId: string }) {
  const { getToken } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "developer" | "viewer">("developer");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.includes("@")) { toast.error("Enter a valid email"); return; }
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const inv = await cloud.createInvite(token, orgId, { email, role });
      toast.success(`Invite sent to ${email}`);
      onInvited(inv);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border-2 border-border bg-popover p-6 shadow-xl">
        <h2 className="font-semibold text-base mb-4">Invite member</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
            <input
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading} className="px-4 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {loading ? "Sending…" : "Send invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="h-10 bg-muted/30" />
      {[...Array(3)].map((_, i) => <div key={i} className="h-14 border-t border-border bg-muted/10" />)}
    </div>
  );
}
