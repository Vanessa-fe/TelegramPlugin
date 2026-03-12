'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Users,
  RefreshCw,
  Building2,
  Mail,
  MessageCircle,
  UserCheck,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  ExternalLink,
  Ban,
  PlayCircle,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import apiClient from '@/lib/api-client';
import { organizationsApi } from '@/lib/api/organizations';

type HealthScoreLevel = 'green' | 'orange' | 'red';

interface HealthScore {
  level: HealthScoreLevel;
  score: number;
  factors: {
    loginRecency: HealthScoreLevel;
    activityLevel: HealthScoreLevel;
    paymentStatus: HealthScoreLevel;
    revenueHealth: HealthScoreLevel;
  };
  lastLoginAt: string | null;
  daysSinceLogin: number | null;
  recentSalesCount: number;
  recentRevenueChange: number | null;
}

interface Creator {
  id: string;
  name: string;
  slug: string;
  billingEmail: string;
  saasActive: boolean;
  suspendedAt: string | null;
  createdAt: string;
  ownerEmail: string | null;
  channelsCount: number;
  customersCount: number;
  activeSubscriptionsCount: number;
  platformPlan: string | null;
  platformStatus: string | null;
  paymentRisk: {
    isAtRisk: boolean;
    daysOverdue: number | null;
    failedAttempts: number;
    daysUntilBlock: number | null;
  } | null;
  healthScore: HealthScore;
}

const statusConfig: Record<string, { className: string; label: string; icon: typeof CheckCircle }> = {
  ACTIVE: {
    className: 'bg-green-100 text-green-700',
    label: 'Actif',
    icon: CheckCircle,
  },
  TRIALING: {
    className: 'bg-purple-100 text-purple-700',
    label: 'Essai',
    icon: Clock,
  },
  PAST_DUE: {
    className: 'bg-red-100 text-red-700',
    label: 'Impayé',
    icon: XCircle,
  },
  CANCELED: {
    className: 'bg-gray-100 text-gray-500',
    label: 'Annulé',
    icon: XCircle,
  },
};

export default function CreatorsPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'suspended' | 'at_risk'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleSuspend = async (creator: Creator) => {
    const reason = prompt(
      `Suspendre "${creator.name}" ?\n\nRaison (optionnelle) :`
    );
    if (reason === null) return; // User cancelled

    setActionLoading(creator.id);
    try {
      await organizationsApi.suspend(creator.id, reason || undefined);
      await loadCreators();
    } catch {
      alert('Erreur lors de la suspension');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnsuspend = async (creator: Creator) => {
    if (!confirm(`Réactiver "${creator.name}" ?`)) return;

    setActionLoading(creator.id);
    try {
      await organizationsApi.unsuspend(creator.id);
      await loadCreators();
    } catch {
      alert('Erreur lors de la réactivation');
    } finally {
      setActionLoading(null);
    }
  };

  async function loadCreators() {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/dashboard/creators');
      setCreators(response.data);
    } catch {
      setCreators([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCreators();
  }, []);

  const filteredCreators = creators.filter((creator) => {
    if (filter === 'active') return creator.saasActive && !creator.suspendedAt;
    if (filter === 'inactive') return !creator.saasActive && !creator.suspendedAt;
    if (filter === 'suspended') return !!creator.suspendedAt;
    if (filter === 'at_risk') {
      // Use health score for churn risk (orange or red) instead of just payment risk
      return !creator.suspendedAt && creator.saasActive &&
        (creator.healthScore.level === 'red' || creator.healthScore.level === 'orange');
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
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
          <h1 className="text-2xl font-bold lg:text-3xl">{t('nav.creators')}</h1>
          <p className="mt-1 text-gray-500">
            Vue d&apos;ensemble des créateurs et de leur activité
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadCreators()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Stats summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{creators.length}</p>
              <p className="text-sm text-gray-500">Total créateurs</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {creators.filter((c) => c.saasActive).length}
              </p>
              <p className="text-sm text-gray-500">Actifs</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <XCircle className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {creators.filter((c) => !c.saasActive).length}
              </p>
              <p className="text-sm text-gray-500">Inactifs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'inactive', 'at_risk', 'suspended'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? f === 'suspended'
                  ? 'bg-red-100 text-red-700'
                  : f === 'at_risk'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f === 'all' && `Tous (${creators.length})`}
            {f === 'active' && `Actifs (${creators.filter((c) => c.saasActive && !c.suspendedAt).length})`}
            {f === 'inactive' && `Inactifs (${creators.filter((c) => !c.saasActive && !c.suspendedAt).length})`}
            {f === 'at_risk' && `⚠️ À risque (${creators.filter((c) => !c.suspendedAt && c.saasActive && (c.healthScore.level === 'red' || c.healthScore.level === 'orange')).length})`}
            {f === 'suspended' && `Suspendus (${creators.filter((c) => c.suspendedAt).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {filteredCreators.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Aucun créateur
          </h3>
          <p className="mx-auto max-w-sm text-gray-500">
            Aucun créateur ne correspond aux filtres sélectionnés.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Créateur
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Plan
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    Channels
                  </span>
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-4 w-4" />
                    Clients
                  </span>
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    Abos actifs
                  </span>
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  <span className="flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    Santé
                  </span>
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Inscrit le
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCreators.map((creator) => {
                const status = creator.platformStatus
                  ? statusConfig[creator.platformStatus] || statusConfig.CANCELED
                  : null;
                const StatusIcon = status?.icon;

                return (
                  <tr
                    key={creator.id}
                    className="border-b transition-colors last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <Link
                          href={`/admin/creators/${creator.id}`}
                          className="flex items-center gap-2 font-medium text-gray-900 hover:text-purple-600"
                        >
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {creator.name}
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {creator.ownerEmail || creator.billingEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {creator.suspendedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          <Ban className="h-3 w-3" />
                          Suspendu
                        </span>
                      ) : creator.platformPlan ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                            {creator.platformPlan}
                          </span>
                          {creator.paymentRisk?.isAtRisk ? (
                            <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 w-fit">
                              <AlertTriangle className="h-3 w-3" />
                              {creator.paymentRisk.daysUntilBlock === 0
                                ? 'Blocage imminent'
                                : `Blocage dans ${creator.paymentRisk.daysUntilBlock}j`}
                            </span>
                          ) : status && StatusIcon ? (
                            <span
                              className={`flex items-center gap-1 text-xs ${status.className} rounded-full px-2 py-0.5 w-fit`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          {creator.saasActive ? 'Legacy' : 'Aucun'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${
                          creator.channelsCount > 0 ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {creator.channelsCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${
                          creator.customersCount > 0 ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {creator.customersCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${
                          creator.activeSubscriptionsCount > 0
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {creator.activeSubscriptionsCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            creator.healthScore.level === 'green'
                              ? 'bg-green-100 text-green-700'
                              : creator.healthScore.level === 'orange'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                          title={`Score: ${creator.healthScore.score}/100\nConnexion: ${creator.healthScore.factors.loginRecency}\nActivité: ${creator.healthScore.factors.activityLevel}\nPaiement: ${creator.healthScore.factors.paymentStatus}\nRevenus: ${creator.healthScore.factors.revenueHealth}`}
                        >
                          {creator.healthScore.level === 'green' && '🟢'}
                          {creator.healthScore.level === 'orange' && '🟠'}
                          {creator.healthScore.level === 'red' && '🔴'}
                          {creator.healthScore.score}%
                        </span>
                        {creator.healthScore.daysSinceLogin !== null && creator.healthScore.daysSinceLogin > 14 && (
                          <span className="text-xs text-gray-400" title="Jours depuis dernière connexion">
                            {creator.healthScore.daysSinceLogin}j
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(creator.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={actionLoading === creator.id}
                          >
                            {actionLoading === creator.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/creators/${creator.id}`}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Voir détails
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {creator.suspendedAt ? (
                            <DropdownMenuItem
                              onClick={() => handleUnsuspend(creator)}
                              className="text-green-600 focus:text-green-600"
                            >
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Réactiver
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleSuspend(creator)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Suspendre
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
