"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { teamApi } from "@/lib/api/team";
import { UserRole } from "@/types/auth";
import type {
  TeamInvite,
  TeamManageableRole,
  TeamMember,
} from "@/types/team";
import { Copy, MailPlus, Shield, Trash2, UserX } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const ROLE_OPTIONS: Array<{ value: TeamManageableRole; label: string }> = [
  { value: UserRole.ORG_ADMIN, label: "Admin" },
  { value: UserRole.SUPPORT, label: "Support" },
  { value: UserRole.VIEWER, label: "Lecture" },
];

function roleLabel(role: UserRole): string {
  if (role === UserRole.SUPERADMIN) return "Super Admin";
  if (role === UserRole.ORG_ADMIN) return "Admin";
  if (role === UserRole.SUPPORT) return "Support";
  return "Lecture";
}

function isManageableRole(role: UserRole): role is TeamManageableRole {
  return role === UserRole.ORG_ADMIN || role === UserRole.SUPPORT || role === UserRole.VIEWER;
}

export default function TeamPage() {
  const { user } = useAuth();
  const locale = useLocale();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamManageableRole>(UserRole.SUPPORT);
  const [isInviting, setIsInviting] = useState(false);
  const [latestInviteUrl, setLatestInviteUrl] = useState<string | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, TeamManageableRole>>({});

  const canManageTeam = useMemo(() => {
    return user?.role === UserRole.SUPERADMIN || user?.role === UserRole.ORG_ADMIN;
  }, [user?.role]);

  const loadData = useCallback(async () => {
    if (!canManageTeam) {
      setIsLoading(false);
      return;
    }

    try {
      const [membersData, invitesData] = await Promise.all([
        teamApi.listMembers(),
        teamApi.listInvites(),
      ]);

      setMembers(membersData);
      setInvites(invitesData);

      const nextDrafts: Record<string, TeamManageableRole> = {};
      membersData.forEach((member) => {
        if (isManageableRole(member.role)) {
          nextDrafts[member.id] = member.role;
        }
      });
      setRoleDrafts(nextDrafts);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Erreur lors du chargement de l'équipe");
    } finally {
      setIsLoading(false);
    }
  }, [canManageTeam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    setIsInviting(true);

    try {
      const created = await teamApi.createInvite({
        email: email.trim().toLowerCase(),
        role,
      });
      setEmail("");
      setLatestInviteUrl(created.inviteUrl);
      toast.success("Invitation envoyée");
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Impossible d'envoyer l'invitation");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleCopyInviteUrl() {
    if (!latestInviteUrl) return;

    try {
      await navigator.clipboard.writeText(latestInviteUrl);
      toast.success("Lien d'invitation copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  }

  async function handleUpdateRole(member: TeamMember) {
    const nextRole = roleDrafts[member.id];
    if (!nextRole || !isManageableRole(member.role) || nextRole === member.role) {
      return;
    }

    try {
      await teamApi.updateMemberRole(member.id, { role: nextRole });
      toast.success("Rôle mis à jour");
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Impossible de modifier le rôle");
    }
  }

  async function handleDeactivate(member: TeamMember) {
    try {
      await teamApi.deactivateMember(member.id);
      toast.success("Compte désactivé");
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Impossible de désactiver le membre");
    }
  }

  async function handleReactivate(member: TeamMember) {
    try {
      await teamApi.reactivateMember(member.id);
      toast.success("Compte réactivé");
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Impossible de réactiver le membre");
    }
  }

  async function handleRemove(member: TeamMember) {
    try {
      await teamApi.removeMember(member.id);
      toast.success("Membre supprimé de l'organisation");
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Impossible de supprimer le membre");
    }
  }

  async function handleRevokeInvite(invite: TeamInvite) {
    try {
      await teamApi.revokeInvite(invite.id);
      toast.success("Invitation révoquée");
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Impossible de révoquer l'invitation");
    }
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-text-secondary">Chargement de l&apos;équipe...</p>
        </div>
      </div>
    );
  }

  if (!canManageTeam) {
    return (
      <div className="rounded-xl border border-border-custom bg-white p-8 text-center">
        <Shield className="mx-auto h-8 w-8 text-text-secondary" />
        <h1 className="mt-3 text-xl font-semibold text-text-primary">Accès restreint</h1>
        <p className="mt-2 text-text-secondary">
          Seuls les administrateurs peuvent gérer l&apos;équipe.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Équipe</h1>
        <p className="mt-1 text-text-secondary">
          Invite des collaborateurs, ajuste leurs rôles et contrôle les accès.
        </p>
      </div>

      <div className="rounded-xl border border-border-custom bg-white p-6">
        <h2 className="text-lg font-semibold text-text-primary">Inviter un membre</h2>
        <form onSubmit={handleCreateInvite} className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px_auto]">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="personne@exemple.com"
              required
              disabled={isInviting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Rôle</Label>
            <select
              id="invite-role"
              value={role}
              onChange={(event) => setRole(event.target.value as TeamManageableRole)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isInviting}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isInviting}>
              <MailPlus className="mr-2 h-4 w-4" />
              {isInviting ? "Envoi..." : "Inviter"}
            </Button>
          </div>
        </form>

        {latestInviteUrl && (
          <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
            <p className="text-sm text-text-primary break-all">{latestInviteUrl}</p>
            <Button onClick={handleCopyInviteUrl} variant="outline" className="mt-3 border-purple-200">
              <Copy className="mr-2 h-4 w-4" />
              Copier le lien
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border-custom bg-white overflow-hidden">
        <div className="border-b border-border-custom px-6 py-4">
          <h2 className="text-lg font-semibold text-text-primary">Membres ({members.length})</h2>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-surface border-b border-border-custom">
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">Membre</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">Rôle</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">Dernière connexion</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const displayName = [member.firstName, member.lastName].filter(Boolean).join(" ");
              const canEditRole = isManageableRole(member.role);
              const nextRole = roleDrafts[member.id];
              const roleChanged = canEditRole && nextRole && nextRole !== member.role;
              const isSelf = member.id === user?.id;

              return (
                <tr key={member.id} className="border-b border-border-custom last:border-0 hover:bg-surface/40">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-text-primary">{displayName || member.email}</p>
                      <p className="text-sm text-text-secondary">{member.email}</p>
                      {!member.isActive && (
                        <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          Désactivé
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {canEditRole ? (
                      <select
                        value={nextRole || member.role}
                        onChange={(event) =>
                          setRoleDrafts((prev) => ({
                            ...prev,
                            [member.id]: event.target.value as TeamManageableRole,
                          }))
                        }
                        disabled={!member.isActive}
                        className="flex h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                        {roleLabel(member.role)}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {member.lastLoginAt ? formatDate(member.lastLoginAt) : "Jamais"}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {roleChanged && (
                        <Button
                          variant="outline"
                          className="border-border-custom"
                          onClick={() => handleUpdateRole(member)}
                        >
                          Sauver le rôle
                        </Button>
                      )}

                      {member.isActive && !isSelf && (
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDeactivate(member)}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Désactiver
                        </Button>
                      )}

                      {!member.isActive && !isSelf && (
                        <Button
                          variant="outline"
                          className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                          onClick={() => handleReactivate(member)}
                        >
                          Réactiver
                        </Button>
                      )}

                      {!isSelf && (
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleRemove(member)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-border-custom bg-white overflow-hidden">
        <div className="border-b border-border-custom px-6 py-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Invitations en attente ({invites.length})
          </h2>
        </div>

        {invites.length === 0 ? (
          <p className="px-6 py-6 text-sm text-text-secondary">Aucune invitation en attente.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-surface border-b border-border-custom">
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">Rôle</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">Expire le</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id} className="border-b border-border-custom last:border-0 hover:bg-surface/40">
                  <td className="px-6 py-4 text-sm text-text-primary">{invite.email}</td>
                  <td className="px-6 py-4 text-sm text-text-primary">{roleLabel(invite.role)}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{formatDate(invite.expiresAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleRevokeInvite(invite)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Révoquer
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
