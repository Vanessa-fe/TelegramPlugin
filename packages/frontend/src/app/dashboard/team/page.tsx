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
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const MANAGEABLE_ROLE_OPTIONS: TeamManageableRole[] = [
  UserRole.ORG_ADMIN,
  UserRole.SUPPORT,
  UserRole.VIEWER,
];

function roleLabel(role: UserRole, t: ReturnType<typeof useTranslations>): string {
  if (role === UserRole.SUPERADMIN) return t("roles.superAdmin");
  if (role === UserRole.ORG_ADMIN) return t("roles.admin");
  if (role === UserRole.SUPPORT) return t("roles.support");
  return t("roles.viewer");
}

function isManageableRole(role: UserRole): role is TeamManageableRole {
  return (
    role === UserRole.ORG_ADMIN ||
    role === UserRole.SUPPORT ||
    role === UserRole.VIEWER
  );
}

export default function TeamPage() {
  const { user } = useAuth();
  const locale = useLocale();
  const t = useTranslations("teamPage");

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamManageableRole>(UserRole.SUPPORT);
  const [isInviting, setIsInviting] = useState(false);
  const [latestInviteUrl, setLatestInviteUrl] = useState<string | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, TeamManageableRole>>(
    {},
  );

  const roleOptions = useMemo(
    () =>
      MANAGEABLE_ROLE_OPTIONS.map((value) => ({
        value,
        label: roleLabel(value, t),
      })),
    [t],
  );

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
      toast.error(axiosError.response?.data?.message || t("toasts.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [canManageTeam, t]);

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
      toast.success(t("toasts.inviteSent"));
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("toasts.inviteError"));
    } finally {
      setIsInviting(false);
    }
  }

  async function handleCopyInviteUrl() {
    if (!latestInviteUrl) return;

    try {
      await navigator.clipboard.writeText(latestInviteUrl);
      toast.success(t("toasts.inviteCopied"));
    } catch {
      toast.error(t("toasts.copyError"));
    }
  }

  async function handleUpdateRole(member: TeamMember) {
    const nextRole = roleDrafts[member.id];
    if (!nextRole || !isManageableRole(member.role) || nextRole === member.role) {
      return;
    }

    try {
      await teamApi.updateMemberRole(member.id, { role: nextRole });
      toast.success(t("toasts.roleUpdated"));
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message || t("toasts.roleUpdateError"),
      );
    }
  }

  async function handleDeactivate(member: TeamMember) {
    try {
      await teamApi.deactivateMember(member.id);
      toast.success(t("toasts.memberDeactivated"));
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message || t("toasts.memberDeactivateError"),
      );
    }
  }

  async function handleReactivate(member: TeamMember) {
    try {
      await teamApi.reactivateMember(member.id);
      toast.success(t("toasts.memberReactivated"));
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message || t("toasts.memberReactivateError"),
      );
    }
  }

  async function handleRemove(member: TeamMember) {
    try {
      await teamApi.removeMember(member.id);
      toast.success(t("toasts.memberRemoved"));
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message || t("toasts.memberRemoveError"),
      );
    }
  }

  async function handleRevokeInvite(invite: TeamInvite) {
    try {
      await teamApi.revokeInvite(invite.id);
      toast.success(t("toasts.inviteRevoked"));
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message || t("toasts.inviteRevokeError"),
      );
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
          <p className="mt-3 text-sm text-text-secondary">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!canManageTeam) {
    return (
      <div className="rounded-xl border border-border-custom bg-white p-8 text-center">
        <Shield className="mx-auto h-8 w-8 text-text-secondary" />
        <h1 className="mt-3 text-xl font-semibold text-text-primary">
          {t("accessRestricted.title")}
        </h1>
        <p className="mt-2 text-text-secondary">
          {t("accessRestricted.description")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
          {t("header.title")}
        </h1>
        <p className="mt-1 text-text-secondary">{t("header.subtitle")}</p>
      </div>

      <div className="rounded-xl border border-border-custom bg-white p-6">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("invite.title")}
        </h2>
        <form
          onSubmit={handleCreateInvite}
          className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px_auto]"
        >
          <div className="space-y-2">
            <Label htmlFor="invite-email">{t("invite.emailLabel")}</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("invite.emailPlaceholder")}
              required
              disabled={isInviting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">{t("invite.roleLabel")}</Label>
            <select
              id="invite-role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as TeamManageableRole)
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isInviting}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isInviting}
            >
              <MailPlus className="mr-2 h-4 w-4" />
              {isInviting ? t("invite.submitting") : t("invite.submit")}
            </Button>
          </div>
        </form>

        {latestInviteUrl && (
          <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
            <p className="text-sm text-text-primary break-all">{latestInviteUrl}</p>
            <Button
              onClick={handleCopyInviteUrl}
              variant="outline"
              className="mt-3 border-purple-200"
            >
              <Copy className="mr-2 h-4 w-4" />
              {t("invite.copyLink")}
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border-custom bg-white overflow-hidden">
        <div className="border-b border-border-custom px-6 py-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("members.title", { count: members.length })}
          </h2>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-surface border-b border-border-custom">
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">
                {t("members.columns.member")}
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">
                {t("members.columns.role")}
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">
                {t("members.columns.lastLogin")}
              </th>
              <th className="px-6 py-3 text-right text-sm font-medium text-text-secondary">
                {t("members.columns.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const displayName = [member.firstName, member.lastName]
                .filter(Boolean)
                .join(" ");
              const canEditRole = isManageableRole(member.role);
              const nextRole = roleDrafts[member.id];
              const roleChanged =
                canEditRole && Boolean(nextRole) && nextRole !== member.role;
              const isSelf = member.id === user?.id;

              return (
                <tr
                  key={member.id}
                  className="border-b border-border-custom last:border-0 hover:bg-surface/40"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-text-primary">
                        {displayName || member.email}
                      </p>
                      <p className="text-sm text-text-secondary">{member.email}</p>
                      {!member.isActive && (
                        <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {t("members.deactivatedBadge")}
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
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                        {roleLabel(member.role, t)}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {member.lastLoginAt
                      ? formatDate(member.lastLoginAt)
                      : t("members.never")}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {roleChanged && (
                        <Button
                          variant="outline"
                          className="border-border-custom"
                          onClick={() => handleUpdateRole(member)}
                        >
                          {t("members.actions.saveRole")}
                        </Button>
                      )}

                      {member.isActive && !isSelf && (
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDeactivate(member)}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          {t("members.actions.deactivate")}
                        </Button>
                      )}

                      {!member.isActive && !isSelf && (
                        <Button
                          variant="outline"
                          className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                          onClick={() => handleReactivate(member)}
                        >
                          {t("members.actions.reactivate")}
                        </Button>
                      )}

                      {!isSelf && (
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleRemove(member)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("members.actions.remove")}
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
            {t("invites.title", { count: invites.length })}
          </h2>
        </div>

        {invites.length === 0 ? (
          <p className="px-6 py-6 text-sm text-text-secondary">{t("invites.empty")}</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-surface border-b border-border-custom">
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">
                  {t("invites.columns.email")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">
                  {t("invites.columns.role")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary">
                  {t("invites.columns.expiresAt")}
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-text-secondary">
                  {t("invites.columns.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr
                  key={invite.id}
                  className="border-b border-border-custom last:border-0 hover:bg-surface/40"
                >
                  <td className="px-6 py-4 text-sm text-text-primary">{invite.email}</td>
                  <td className="px-6 py-4 text-sm text-text-primary">
                    {roleLabel(invite.role, t)}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {formatDate(invite.expiresAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleRevokeInvite(invite)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("invites.revoke")}
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
