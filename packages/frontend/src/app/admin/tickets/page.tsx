'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  Ticket,
  RefreshCw,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface TicketItem {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  organization?: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  _count?: {
    messages: number;
  };
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  urgent: number;
}

const statusConfig: Record<TicketStatus, { label: string; className: string; icon: typeof Clock }> = {
  OPEN: { label: 'Ouvert', className: 'bg-blue-100 text-blue-700', icon: MessageSquare },
  IN_PROGRESS: { label: 'En cours', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
  RESOLVED: { label: 'Résolu', className: 'bg-green-100 text-green-700', icon: CheckCircle },
  CLOSED: { label: 'Fermé', className: 'bg-gray-100 text-gray-500', icon: XCircle },
};

const priorityConfig: Record<TicketPriority, { label: string; className: string }> = {
  LOW: { label: 'Basse', className: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Moyenne', className: 'bg-blue-100 text-blue-600' },
  HIGH: { label: 'Haute', className: 'bg-orange-100 text-orange-600' },
  URGENT: { label: 'Urgente', className: 'bg-red-100 text-red-600' },
};

export default function AdminTicketsPage() {
  const locale = useLocale();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'ALL'>('ALL');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);

      const [ticketsRes, statsRes] = await Promise.all([
        apiClient.get(`/tickets/admin?${params.toString()}`),
        apiClient.get('/tickets/admin/stats'),
      ]);
      setTickets(ticketsRes.data.tickets);
      setStats(statsRes.data);
    } catch {
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "À l'instant";
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return formatDate(dateString);
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
          <h1 className="text-2xl font-bold lg:text-3xl">Tickets Support</h1>
          <p className="mt-1 text-gray-500">
            Gérez les demandes de support des créateurs
          </p>
        </div>
        <Button variant="outline" onClick={loadData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Ticket className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.open}</p>
                <p className="text-sm text-gray-500">Ouverts</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-gray-500">En cours</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.resolved}</p>
                <p className="text-sm text-gray-500">Résolus</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.urgent}</p>
                <p className="text-sm text-gray-500">Urgents</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          <span className="flex items-center text-sm text-gray-500">Statut:</span>
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === s
                  ? s === 'ALL'
                    ? 'bg-purple-100 text-purple-700'
                    : statusConfig[s as TicketStatus].className
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s === 'ALL' ? 'Tous' : statusConfig[s].label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <span className="flex items-center text-sm text-gray-500">Priorité:</span>
          {(['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                priorityFilter === p
                  ? p === 'ALL'
                    ? 'bg-purple-100 text-purple-700'
                    : priorityConfig[p as TicketPriority].className
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p === 'ALL' ? 'Toutes' : priorityConfig[p].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600">
            <Ticket className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Aucun ticket</h3>
          <p className="mx-auto max-w-sm text-gray-500">
            Aucun ticket ne correspond aux filtres sélectionnés.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const status = statusConfig[ticket.status];
            const priority = priorityConfig[ticket.priority];
            const StatusIcon = status.icon;
            const organizationName = ticket.organization?.name || 'Organisation inconnue';
            const assigneeName = ticket.assignedTo?.name || ticket.assignedTo?.email || 'Non assigné';
            const messageCount = ticket._count?.messages ?? 0;

            return (
              <Link
                key={ticket.id}
                href={`/admin/tickets/${ticket.id}`}
                className="block rounded-xl border bg-white p-4 transition-colors hover:border-purple-200 hover:bg-purple-50/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priority.className}`}>
                        {priority.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        #{ticket.id.slice(0, 8)}
                      </span>
                    </div>
                    <h3 className="truncate font-medium text-gray-900">
                      {ticket.subject}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {organizationName}
                      </span>
                      {ticket.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {assigneeName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {messageCount} message{messageCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <p className="text-gray-500">{formatRelativeTime(ticket.updatedAt)}</p>
                      <p className="text-xs text-gray-400">Créé {formatDate(ticket.createdAt)}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
