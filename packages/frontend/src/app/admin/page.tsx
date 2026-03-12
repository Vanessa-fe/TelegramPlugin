'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle,
  CreditCard,
  Gift,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

interface DashboardStats {
  // KPIs
  newClientsThisWeek: number;
  revenueThisWeek: number;
  // Alerts
  ticketsUnanswered: number;
  failedPayments: number;
  churnRisk: number;
  vipExpiringSoon: number;
}

function AlertBadge({
  count,
  priority,
}: {
  count: number;
  priority: 'high' | 'medium' | 'low';
}) {
  const colors = {
    high: 'bg-red-500',
    medium: 'bg-orange-500',
    low: 'bg-yellow-500',
  };

  // Show green OK badge when no alerts
  if (count === 0) {
    return (
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1 text-xs font-bold text-white">
        ✓
      </span>
    );
  }

  return (
    <span
      className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-white ${colors[priority]}`}
    >
      {count}
    </span>
  );
}

function GlobalStatusBanner({ stats }: { stats: DashboardStats | null }) {
  if (!stats) return null;

  const totalAlerts = stats.ticketsUnanswered + stats.failedPayments + stats.churnRisk;

  if (totalAlerts === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-green-800">Tout va bien !</h3>
          <p className="text-sm text-green-600">
            Aucune alerte critique à traiter. Le SaaS fonctionne normalement.
          </p>
        </div>
      </div>
    );
  }

  // Build alert summary
  const alerts: string[] = [];
  if (stats.ticketsUnanswered > 0) {
    alerts.push(`${stats.ticketsUnanswered} ticket${stats.ticketsUnanswered > 1 ? 's' : ''}`);
  }
  if (stats.failedPayments > 0) {
    alerts.push(`${stats.failedPayments} impayé${stats.failedPayments > 1 ? 's' : ''}`);
  }
  if (stats.churnRisk > 0) {
    alerts.push(`${stats.churnRisk} risque${stats.churnRisk > 1 ? 's' : ''} churn`);
  }

  const highestPriority = stats.ticketsUnanswered > 0 ? 'high' : stats.failedPayments > 0 ? 'medium' : 'low';
  const borderColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-orange-200 bg-orange-50',
    low: 'border-yellow-200 bg-yellow-50',
  };
  const textColors = {
    high: 'text-red-800',
    medium: 'text-orange-800',
    low: 'text-yellow-800',
  };
  const subtextColors = {
    high: 'text-red-600',
    medium: 'text-orange-600',
    low: 'text-yellow-600',
  };
  const iconBgColors = {
    high: 'bg-red-100',
    medium: 'bg-orange-100',
    low: 'bg-yellow-100',
  };
  const iconColors = {
    high: 'text-red-600',
    medium: 'text-orange-600',
    low: 'text-yellow-600',
  };

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-4 ${borderColors[highestPriority]}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBgColors[highestPriority]}`}>
        <AlertCircle className={`h-6 w-6 ${iconColors[highestPriority]}`} />
      </div>
      <div>
        <h3 className={`font-semibold ${textColors[highestPriority]}`}>
          {totalAlerts} alerte{totalAlerts > 1 ? 's' : ''} à traiter
        </h3>
        <p className={`text-sm ${subtextColors[highestPriority]}`}>
          {alerts.join(' • ')}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-purple-100 p-2">
          <Icon className="h-5 w-5 text-purple-600" />
        </div>
        {trend === 'up' && (
          <TrendingUp className="h-4 w-4 text-green-500" />
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function AlertCard({
  title,
  description,
  count,
  priority,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
  href: string;
  icon: React.ElementType;
}) {
  // Border and background colors based on priority AND whether there are alerts
  const getBorderColor = () => {
    if (count === 0) return 'border-l-green-500';
    return {
      high: 'border-l-red-500',
      medium: 'border-l-orange-500',
      low: 'border-l-yellow-500',
    }[priority];
  };

  const getBgColor = () => {
    if (count === 0) return 'bg-green-50/50';
    return {
      high: 'bg-red-50',
      medium: 'bg-orange-50',
      low: 'bg-yellow-50',
    }[priority];
  };

  const getStatusText = () => {
    if (count === 0) return 'Aucune alerte';
    return `${count} alerte${count > 1 ? 's' : ''}`;
  };

  return (
    <Link
      href={href}
      className={`group relative block rounded-lg border border-l-4 ${getBorderColor()} ${getBgColor()} p-4 shadow-sm transition hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon className={`h-5 w-5 ${count === 0 ? 'text-green-600' : 'text-gray-600'}`} />
            <AlertBadge count={count} priority={priority} />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
            <p className={`mt-1 text-xs font-medium ${
              count === 0 ? 'text-green-600' :
              priority === 'high' ? 'text-red-600' :
              priority === 'medium' ? 'text-orange-600' : 'text-yellow-600'
            }`}>
              {getStatusText()}
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default function AdminPage() {
  const t = useTranslations('admin.home');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await apiClient.get('/admin/dashboard/stats');
        setStats(response.data);
      } catch {
        // Fallback to zeros if endpoint not ready
        setStats({
          newClientsThisWeek: 0,
          revenueThisWeek: 0,
          ticketsUnanswered: 0,
          failedPayments: 0,
          churnRisk: 0,
          vipExpiringSoon: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const formatCurrency = (amountInCents: number) => {
    // Convert cents to euros for display
    const amountInEuros = amountInCents / 100;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: amountInEuros % 1 === 0 ? 0 : 2,
    }).format(amountInEuros);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-gray-600">{t('subtitle')}</p>
      </div>

      {/* Global Status Banner */}
      {!loading && <GlobalStatusBanner stats={stats} />}

      {/* KPIs Section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-700">
          {t('kpis.title')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t('kpis.newClients')}
            value={loading ? '...' : stats?.newClientsThisWeek ?? 0}
            subtitle={t('kpis.thisWeek')}
            icon={Users}
            trend="up"
          />
          <StatCard
            title={t('kpis.revenue')}
            value={
              loading ? '...' : formatCurrency(stats?.revenueThisWeek ?? 0)
            }
            subtitle={t('kpis.thisWeek')}
            icon={TrendingUp}
            trend="up"
          />
          <StatCard
            title={t('kpis.vipActive')}
            value={loading ? '...' : stats?.vipExpiringSoon ?? 0}
            subtitle={t('kpis.expiringSoon')}
            icon={Star}
          />
          <StatCard
            title={t('kpis.failedPayments')}
            value={loading ? '...' : stats?.failedPayments ?? 0}
            subtitle={t('kpis.requiresAction')}
            icon={AlertCircle}
          />
        </div>
      </section>

      {/* Alerts Section - Priority Order */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-700">
          {t('alerts.title')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Priority 1: Tickets */}
          <AlertCard
            title={t('alerts.tickets.title')}
            description={t('alerts.tickets.description')}
            count={stats?.ticketsUnanswered ?? 0}
            priority="high"
            href="/admin/tickets"
            icon={AlertCircle}
          />
          {/* Priority 2: Failed Payments */}
          <AlertCard
            title={t('alerts.payments.title')}
            description={t('alerts.payments.description')}
            count={stats?.failedPayments ?? 0}
            priority="medium"
            href="/admin/payments"
            icon={CreditCard}
          />
          {/* Priority 3: Churn Risk */}
          <AlertCard
            title={t('alerts.churn.title')}
            description={t('alerts.churn.description')}
            count={stats?.churnRisk ?? 0}
            priority="low"
            href="/admin/creators?filter=at-risk"
            icon={Users}
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-700">
          {t('quickActions.title')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/vip/new"
            className="flex items-center gap-3 rounded-lg border bg-purple-50 p-4 transition hover:bg-purple-100"
          >
            <Star className="h-5 w-5 text-purple-600" />
            <div>
              <h3 className="font-semibold text-purple-900">
                {t('quickActions.inviteVip')}
              </h3>
              <p className="text-sm text-purple-700">
                {t('quickActions.inviteVipDesc')}
              </p>
            </div>
          </Link>
          <Link
            href="/admin/organizations"
            className="flex items-center gap-3 rounded-lg border bg-white p-4 transition hover:shadow-md"
          >
            <Building2 className="h-5 w-5 text-gray-600" />
            <div>
              <h3 className="font-semibold">{t('quickActions.organizations')}</h3>
              <p className="text-sm text-gray-600">
                {t('quickActions.organizationsDesc')}
              </p>
            </div>
          </Link>
          <Link
            href="/admin/gift-codes"
            className="flex items-center gap-3 rounded-lg border bg-white p-4 transition hover:shadow-md"
          >
            <Gift className="h-5 w-5 text-gray-600" />
            <div>
              <h3 className="font-semibold">{t('quickActions.giftCodes')}</h3>
              <p className="text-sm text-gray-600">
                {t('quickActions.giftCodesDesc')}
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
