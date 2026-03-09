"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { vipInvitationsApi } from "@/lib/api/vip-invitations";
import type { VipInvitation } from "@/types/vip-invitation";
import { VipInvitationStatus } from "@/types/vip-invitation";
import {
  Star,
  MoreHorizontal,
  Plus,
  Copy,
  Check,
  Clock,
  UserCheck,
  TrendingUp,
  XCircle,
  Mail,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import type { StripeStatus } from "@/types/vip-invitation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const statusConfig: Record<
  VipInvitationStatus,
  { className: string; label: string; icon: typeof Clock }
> = {
  PENDING: {
    className: "bg-amber-100 text-amber-700",
    label: "En attente",
    icon: Clock,
  },
  ACTIVATED: {
    className: "bg-blue-100 text-blue-700",
    label: "Activée",
    icon: UserCheck,
  },
  CONVERTED: {
    className: "bg-green-100 text-green-700",
    label: "Convertie",
    icon: TrendingUp,
  },
  EXPIRED: {
    className: "bg-orange-100 text-orange-700",
    label: "Expirée",
    icon: Clock,
  },
  CANCELLED: {
    className: "bg-gray-100 text-gray-500",
    label: "Annulée",
    icon: XCircle,
  },
};

const stripeStatusConfig: Record<
  StripeStatus,
  { className: string; label: string }
> = {
  TRIALING: {
    className: "bg-purple-100 text-purple-700",
    label: "Essai",
  },
  ACTIVE: {
    className: "bg-green-100 text-green-700",
    label: "Actif",
  },
  PAST_DUE: {
    className: "bg-red-100 text-red-700",
    label: "Impayé",
  },
  CANCELED: {
    className: "bg-gray-100 text-gray-500",
    label: "Annulé",
  },
  INCOMPLETE: {
    className: "bg-amber-100 text-amber-700",
    label: "Incomplet",
  },
  EXPIRED: {
    className: "bg-orange-100 text-orange-700",
    label: "Expiré",
  },
  NONE: {
    className: "bg-gray-50 text-gray-400",
    label: "—",
  },
};

export default function VipInvitationsPage() {
  const [invitations, setInvitations] = useState<VipInvitation[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<VipInvitationStatus | "ALL">("ALL");
  const locale = useLocale();

  const loadInvitations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await vipInvitationsApi.findAll({
        status: filterStatus === "ALL" ? undefined : filterStatus,
        limit: 50,
      });
      setInvitations(response.invitations);
      setTotal(response.total);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  async function handleCancel(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette invitation ?")) return;

    try {
      await vipInvitationsApi.cancel(id);
      toast.success("Invitation annulée");
      loadInvitations();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Erreur lors de l'annulation");
    }
  }

  async function handleCopyEmail(email: string, id: string) {
    await navigator.clipboard.writeText(email);
    setCopiedId(id);
    toast.success("Email copié !");
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Invitations VIP
          </h1>
          <p className="mt-1 text-gray-500">
            Gérez les invitations influenceurs et suivez les conversions
          </p>
        </div>
        <Link href="/admin/vip/new">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle invitation
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus("ALL")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === "ALL"
              ? "bg-purple-100 text-purple-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Toutes ({total})
        </button>
        {(Object.keys(statusConfig) as VipInvitationStatus[]).map((status) => {
          const config = statusConfig[status];
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? config.className
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Invitations list */}
      {invitations.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <Star className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filterStatus === "ALL"
              ? "Aucune invitation VIP"
              : `Aucune invitation ${statusConfig[filterStatus].label.toLowerCase()}`}
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            {filterStatus === "ALL"
              ? "Invitez des influenceurs à tester gratuitement la plateforme."
              : "Aucune invitation avec ce statut pour le moment."}
          </p>
          {filterStatus === "ALL" && (
            <Link href="/admin/vip/new">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Créer une invitation
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                  Email
                </th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                  Plan
                </th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                  Statut
                </th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    Stripe
                  </span>
                </th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    Telegram
                  </span>
                </th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                  Performance
                </th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                  Créée le
                </th>
                <th className="text-right text-sm font-medium text-gray-500 px-6 py-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => {
                const StatusIcon = statusConfig[invitation.status].icon;
                return (
                  <tr
                    key={invitation.id}
                    className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {invitation.email}
                        </span>
                        <button
                          onClick={() => handleCopyEmail(invitation.email, invitation.id)}
                          className="text-gray-400 hover:text-purple-600 transition-colors"
                        >
                          {copiedId === invitation.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {invitation.notes && (
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
                          {invitation.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 w-fit">
                          <Star className="h-3 w-3" />
                          {invitation.platformPlanName.charAt(0).toUpperCase() +
                            invitation.platformPlanName.slice(1)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {invitation.trialDays}j
                          {invitation.expiresAt && (
                            <> &middot; Exp. {new Date(invitation.expiresAt).toLocaleDateString(locale, {
                              month: "short",
                              day: "numeric",
                            })}</>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusConfig[invitation.status].className
                        }`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[invitation.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {invitation.organizationId ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            stripeStatusConfig[invitation.stripeStatus || "NONE"].className
                          }`}
                        >
                          <CreditCard className="h-3 w-3" />
                          {stripeStatusConfig[invitation.stripeStatus || "NONE"].label}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {invitation.organizationId ? (
                        <div className="flex items-center gap-1.5">
                          <MessageCircle className={`h-4 w-4 ${
                            (invitation.channelsCount || 0) > 0
                              ? "text-blue-500"
                              : "text-gray-300"
                          }`} />
                          <span className={`text-sm font-medium ${
                            (invitation.channelsCount || 0) > 0
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}>
                            {invitation.channelsCount || 0}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {invitation.status === "ACTIVATED" ||
                      invitation.status === "CONVERTED" ? (
                        <div className="space-y-1">
                          <div className="text-gray-600">
                            <span className="font-medium">{invitation.offersCreated}</span>{" "}
                            offres
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">{invitation.salesGenerated}</span>{" "}
                            ventes
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(invitation.createdAt).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-purple-50"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/vip/${invitation.id}`}>
                              Voir les détails
                            </Link>
                          </DropdownMenuItem>
                          {invitation.status === "ACTIVATED" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/vip/${invitation.id}/extend`}>
                                Prolonger l&apos;essai
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {(invitation.status === "PENDING" ||
                            invitation.status === "ACTIVATED") && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleCancel(invitation.id)}
                            >
                              Annuler
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
