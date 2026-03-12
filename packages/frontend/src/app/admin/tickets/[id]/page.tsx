'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  Building2,
  Clock,
  CheckCircle,
  MessageSquare,
  XCircle,
  User,
  Send,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import apiClient from '@/lib/api-client';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface TicketMessage {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

interface TicketDetail {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  organization: {
    id: string;
    name: string;
    billingEmail: string;
  };
  assignedTo: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  messages: TicketMessage[];
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

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const id = params.id as string;

  const loadTicket = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/tickets/admin/${id}`);
      setTicket(response.data);
    } catch {
      setTicket(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket) return;

    setIsSending(true);
    try {
      await apiClient.post(`/tickets/admin/${id}/messages`, {
        content: newMessage.trim(),
        isInternal,
      });
      setNewMessage('');
      setIsInternal(false);
      await loadTicket();
    } catch {
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (status: TicketStatus) => {
    if (!ticket) return;

    setIsUpdating(true);
    try {
      await apiClient.patch(`/tickets/admin/${id}`, { status });
      await loadTicket();
    } catch {
      alert('Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePriority = async (priority: TicketPriority) => {
    if (!ticket) return;

    setIsUpdating(true);
    try {
      await apiClient.patch(`/tickets/admin/${id}`, { priority });
      await loadTicket();
    } catch {
      alert('Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  if (!ticket) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <p className="mb-4 text-gray-500">Ticket non trouvé</p>
        <Button variant="outline" onClick={() => router.push('/admin/tickets')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  const status = statusConfig[ticket.status];
  const priority = priorityConfig[ticket.priority];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/tickets')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Ticket Header */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priority.className}`}>
                    {priority.label}
                  </span>
                  <span className="text-xs text-gray-400">#{ticket.id.slice(0, 8)}</span>
                </div>
                <h1 className="text-xl font-bold">{ticket.subject}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {ticket.organization.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Créé {formatDate(ticket.createdAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages ({ticket.messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.messages.map((message) => {
                const isAdmin = message.author.role === 'SUPERADMIN' || message.author.role === 'SUPPORT';

                return (
                  <div
                    key={message.id}
                    className={`rounded-lg p-4 ${
                      message.isInternal
                        ? 'border-2 border-dashed border-orange-200 bg-orange-50'
                        : isAdmin
                          ? 'bg-purple-50'
                          : 'bg-gray-50'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {message.author.name || message.author.email}
                        </span>
                        {isAdmin && (
                          <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700">
                            Support
                          </span>
                        )}
                        {message.isInternal && (
                          <span className="flex items-center gap-1 rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
                            <Lock className="h-3 w-3" />
                            Note interne
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {message.content}
                    </p>
                  </div>
                );
              })}

              {/* Reply Form */}
              {ticket.status !== 'CLOSED' && (
                <div className="space-y-3 border-t pt-4">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Votre réponse..."
                    rows={4}
                    className="w-full rounded-lg border p-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Lock className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-600">Note interne (non visible par le créateur)</span>
                    </label>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="gap-2"
                    >
                      {isSending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Envoyer
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as TicketStatus[]).map((s) => {
                const config = statusConfig[s];
                const Icon = config.icon;
                return (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(s)}
                    disabled={ticket.status === s || isUpdating}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      ticket.status === s
                        ? config.className
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {config.label}
                    {ticket.status === s && <CheckCircle className="ml-auto h-4 w-4" />}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Priority Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Priorité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as TicketPriority[]).map((p) => {
                const config = priorityConfig[p];
                return (
                  <button
                    key={p}
                    onClick={() => handleUpdatePriority(p)}
                    disabled={ticket.priority === p || isUpdating}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      ticket.priority === p
                        ? config.className
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p === 'URGENT' && <AlertCircle className="h-4 w-4" />}
                    {config.label}
                    {ticket.priority === p && <CheckCircle className="ml-auto h-4 w-4" />}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle>Organisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nom</p>
                <p className="font-medium">{ticket.organization.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{ticket.organization.billingEmail}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push(`/admin/creators/${ticket.organization.id}`)}
              >
                Voir la fiche créateur
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
