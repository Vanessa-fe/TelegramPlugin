'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  Building2,
  Mail,
  Calendar,
  Users,
  MessageCircle,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Package,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  PlayCircle,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import apiClient from '@/lib/api-client';
import { organizationsApi } from '@/lib/api/organizations';

type HealthScoreLevel = 'green' | 'orange' | 'red';
type AmbassadorTier = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD';

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

interface CreatorDetail {
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
  ambassadorTier: AmbassadorTier;
  ambassadorSince: string | null;
  lastLoyaltyRewardAt: string | null;
  totalRevenue: number;
  revenueThisMonth: number;
  revenuePreviousMonth: number;
  recentActivity: {
    id: string;
    action: string;
    resourceType: string;
    createdAt: string;
    metadata: unknown;
  }[];
  recentPayments: {
    id: string;
    type: string;
    occurredAt: string;
    amount: number;
    currency: string;
  }[];
  channels: {
    id: string;
    title: string | null;
    provider: string;
    type: string;
    isActive: boolean;
    accessCount: number;
  }[];
  products: {
    id: string;
    name: string;
    status: string;
    plansCount: number;
    subscriptionsCount: number;
  }[];
}

const ambassadorConfig: Record<AmbassadorTier, { label: string; icon: string; className: string }> = {
  NONE: { label: '', icon: '', className: '' },
  BRONZE: { label: 'Bronze', icon: '🥉', className: 'bg-orange-100 text-orange-700' },
  SILVER: { label: 'Silver', icon: '🥈', className: 'bg-gray-100 text-gray-700' },
  GOLD: { label: 'Gold', icon: '🥇', className: 'bg-yellow-100 text-yellow-700' },
};

export default function CreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const [creator, setCreator] = useState<CreatorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const id = params.id as string;

  const loadCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/admin/dashboard/creators/${id}`);
      setCreator(response.data);
    } catch {
      setCreator(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCreator();
  }, [loadCreator]);

  const handleSuspend = async () => {
    if (!creator) return;
    const reason = prompt(
      `Suspendre "${creator.name}" ?\n\nRaison (optionnelle) :`
    );
    if (reason === null) return;

    setActionLoading(true);
    try {
      await organizationsApi.suspend(creator.id, reason || undefined);
      await loadCreator();
    } catch {
      alert('Erreur lors de la suspension');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!creator) return;
    if (!confirm(`Réactiver "${creator.name}" ?`)) return;

    setActionLoading(true);
    try {
      await organizationsApi.unsuspend(creator.id);
      await loadCreator();
    } catch {
      alert('Erreur lors de la réactivation');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
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

  if (!creator) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <p className="mb-4 text-gray-500">Createur non trouve</p>
        <Button variant="outline" onClick={() => router.push('/admin/creators')}>
          Retour a la liste
        </Button>
      </div>
    );
  }

  const revenueChange =
    creator.revenuePreviousMonth > 0
      ? ((creator.revenueThisMonth - creator.revenuePreviousMonth) /
          creator.revenuePreviousMonth) *
        100
      : creator.revenueThisMonth > 0
        ? 100
        : 0;

  const ambassador = ambassadorConfig[creator.ambassadorTier];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/creators')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      </div>

      {/* Creator Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{creator.name}</h1>
                    {creator.suspendedAt && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        <Ban className="h-3 w-3" />
                        Suspendu
                      </span>
                    )}
                    {ambassador.label && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ambassador.className}`}
                      >
                        {ambassador.icon} {ambassador.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">@{creator.slug}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {creator.ownerEmail || creator.billingEmail}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Inscrit le {formatDate(creator.createdAt)}
                </span>
                {creator.platformPlan && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    {creator.platformPlan}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={loadCreator} className="gap-2">
                <RefreshCw className="h-4 w-4" />
              </Button>
              {creator.suspendedAt ? (
                <Button
                  onClick={handleUnsuspend}
                  disabled={actionLoading}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <PlayCircle className="h-4 w-4" />
                  Reactiver
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={handleSuspend}
                  disabled={actionLoading}
                  className="gap-2"
                >
                  <Ban className="h-4 w-4" />
                  Suspendre
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{creator.channelsCount}</p>
                <p className="text-sm text-gray-500">Channels</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{creator.customersCount}</p>
                <p className="text-sm text-gray-500">Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{creator.activeSubscriptionsCount}</p>
                <p className="text-sm text-gray-500">Abos actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-lg p-2 ${
                  creator.healthScore.level === 'green'
                    ? 'bg-green-100'
                    : creator.healthScore.level === 'orange'
                      ? 'bg-orange-100'
                      : 'bg-red-100'
                }`}
              >
                <Activity
                  className={`h-5 w-5 ${
                    creator.healthScore.level === 'green'
                      ? 'text-green-600'
                      : creator.healthScore.level === 'orange'
                        ? 'text-orange-600'
                        : 'text-red-600'
                  }`}
                />
              </div>
              <div>
                <p className="text-2xl font-bold">{creator.healthScore.score}%</p>
                <p className="text-sm text-gray-500">Score sante</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Revenus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Ce mois</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{formatCurrency(creator.revenueThisMonth)}</p>
                {revenueChange !== 0 && (
                  <span
                    className={`flex items-center gap-0.5 text-sm ${
                      revenueChange > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {revenueChange > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(revenueChange).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mois precedent</p>
              <p className="text-2xl font-bold">{formatCurrency(creator.revenuePreviousMonth)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total cumule</p>
              <p className="text-2xl font-bold">{formatCurrency(creator.totalRevenue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Score Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Details du score de sante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-sm text-gray-500">Connexion</p>
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    creator.healthScore.factors.loginRecency === 'green'
                      ? 'bg-green-100 text-green-700'
                      : creator.healthScore.factors.loginRecency === 'orange'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {creator.healthScore.factors.loginRecency === 'green' && 'Recent'}
                  {creator.healthScore.factors.loginRecency === 'orange' && 'Moyen'}
                  {creator.healthScore.factors.loginRecency === 'red' && 'Ancien'}
                </span>
                {creator.healthScore.daysSinceLogin !== null && (
                  <span className="text-xs text-gray-500">
                    {creator.healthScore.daysSinceLogin}j
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-sm text-gray-500">Activite</p>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  creator.healthScore.factors.activityLevel === 'green'
                    ? 'bg-green-100 text-green-700'
                    : creator.healthScore.factors.activityLevel === 'orange'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-red-100 text-red-700'
                }`}
              >
                {creator.healthScore.recentSalesCount} ventes/30j
              </span>
            </div>
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-sm text-gray-500">Paiement</p>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  creator.healthScore.factors.paymentStatus === 'green'
                    ? 'bg-green-100 text-green-700'
                    : creator.healthScore.factors.paymentStatus === 'orange'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-red-100 text-red-700'
                }`}
              >
                {creator.healthScore.factors.paymentStatus === 'green' && 'OK'}
                {creator.healthScore.factors.paymentStatus === 'orange' && 'A surveiller'}
                {creator.healthScore.factors.paymentStatus === 'red' && 'Probleme'}
              </span>
            </div>
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-sm text-gray-500">Tendance revenus</p>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  creator.healthScore.factors.revenueHealth === 'green'
                    ? 'bg-green-100 text-green-700'
                    : creator.healthScore.factors.revenueHealth === 'orange'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-red-100 text-red-700'
                }`}
              >
                {creator.healthScore.recentRevenueChange !== null
                  ? `${creator.healthScore.recentRevenueChange > 0 ? '+' : ''}${creator.healthScore.recentRevenueChange}%`
                  : 'N/A'}
              </span>
            </div>
          </div>

          {creator.paymentRisk?.isAtRisk && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-orange-50 p-4 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">Risque de blocage</p>
                <p className="text-sm">
                  {creator.paymentRisk.failedAttempts} tentatives echouees -{' '}
                  {creator.paymentRisk.daysUntilBlock === 0
                    ? 'Blocage imminent'
                    : `Blocage dans ${creator.paymentRisk.daysUntilBlock}j`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Channels and Products */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Channels ({creator.channels.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {creator.channels.length === 0 ? (
              <p className="text-center text-sm text-gray-500">Aucun channel</p>
            ) : (
              <div className="space-y-2">
                {creator.channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{channel.title || 'Sans titre'}</p>
                      <p className="text-xs text-gray-500">
                        {channel.provider} - {channel.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {channel.accessCount} acces
                      </span>
                      {channel.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produits ({creator.products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {creator.products.length === 0 ? (
              <p className="text-center text-sm text-gray-500">Aucun produit</p>
            ) : (
              <div className="space-y-2">
                {creator.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-gray-500">
                        {product.plansCount} plan(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {product.subscriptionsCount} abos
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          product.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : product.status === 'DRAFT'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {product.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activite recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {creator.recentActivity.length === 0 ? (
            <p className="text-center text-sm text-gray-500">Aucune activite</p>
          ) : (
            <div className="space-y-3">
              {creator.recentActivity.slice(0, 10).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.resourceType}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDateTime(activity.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Historique paiements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {creator.recentPayments.length === 0 ? (
            <p className="text-center text-sm text-gray-500">Aucun paiement</p>
          ) : (
            <div className="space-y-3">
              {creator.recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {payment.type === 'INVOICE_PAID' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : payment.type === 'INVOICE_PAYMENT_FAILED' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{payment.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(payment.occurredAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-medium ${
                      payment.type === 'INVOICE_PAID' ? 'text-green-600' : 'text-gray-900'
                    }`}
                  >
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
