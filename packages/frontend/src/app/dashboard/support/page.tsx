'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Plus,
  RefreshCw,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

interface TicketItem {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
  _count?: {
    messages: number;
  };
}

const statusConfig: Record<TicketStatus, { label: string; className: string; icon: typeof Clock }> = {
  OPEN: { label: 'En attente', className: 'bg-blue-100 text-blue-700', icon: MessageSquare },
  IN_PROGRESS: { label: 'En cours', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
  RESOLVED: { label: 'Résolu', className: 'bg-green-100 text-green-700', icon: CheckCircle },
  CLOSED: { label: 'Fermé', className: 'bg-gray-100 text-gray-500', icon: XCircle },
};

type ViewMode = 'list' | 'create' | 'detail';

export default function SupportPage() {
  const locale = useLocale();
  const t = useTranslations('common');
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);

  // Create form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply state
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/tickets');
      setTickets(response.data.tickets || []);
    } catch {
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTicketDetail = useCallback(async (id: string) => {
    try {
      const response = await apiClient.get(`/tickets/${id}`);
      setSelectedTicket(response.data);
    } catch {
      setSelectedTicket(null);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleCreateTicket = async () => {
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient.post('/tickets', {
        subject: subject.trim(),
        message: message.trim(),
        priority,
      });
      setSubject('');
      setMessage('');
      setPriority('MEDIUM');
      setViewMode('list');
      await loadTickets();
    } catch {
      alert('Erreur lors de la création du ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    setIsSendingReply(true);
    try {
      await apiClient.post(`/tickets/${selectedTicket.id}/messages`, {
        content: replyMessage.trim(),
      });
      setReplyMessage('');
      await loadTicketDetail(selectedTicket.id);
    } catch {
      alert("Erreur lors de l'envoi du message");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleViewTicket = async (ticket: TicketItem) => {
    await loadTicketDetail(ticket.id);
    setViewMode('detail');
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

  if (isLoading && viewMode === 'list') {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Create Ticket View
  if (viewMode === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nouveau ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Sujet</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Décrivez brièvement votre problème..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Priorité</label>
              <div className="flex gap-2">
                {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TicketPriority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      priority === p
                        ? p === 'URGENT'
                          ? 'bg-red-100 text-red-700'
                          : p === 'HIGH'
                            ? 'bg-orange-100 text-orange-700'
                            : p === 'MEDIUM'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p === 'LOW' && 'Basse'}
                    {p === 'MEDIUM' && 'Moyenne'}
                    {p === 'HIGH' && 'Haute'}
                    {p === 'URGENT' && 'Urgente'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre problème en détail..."
                rows={6}
                className="w-full rounded-lg border p-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setViewMode('list')}>
                Annuler
              </Button>
              <Button
                onClick={handleCreateTicket}
                disabled={!subject.trim() || !message.trim() || isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Envoyer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ticket Detail View
  if (viewMode === 'detail' && selectedTicket) {
    const status = statusConfig[selectedTicket.status];
    const StatusIcon = status.icon;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewMode('list');
              setSelectedTicket(null);
            }}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </span>
                <span className="text-xs text-gray-400">#{selectedTicket.id.slice(0, 8)}</span>
              </div>
              <h1 className="text-xl font-bold">{selectedTicket.subject}</h1>
              <p className="text-sm text-gray-500">
                Créé le {formatDate(selectedTicket.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTicket.messages?.map((msg) => {
              const isSupport = msg.author.role === 'SUPERADMIN' || msg.author.role === 'SUPPORT';

              return (
                <div
                  key={msg.id}
                  className={`rounded-lg p-4 ${
                    isSupport ? 'bg-purple-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {isSupport ? 'Support Sublynk' : 'Vous'}
                      </span>
                      {isSupport && (
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700">
                          Support
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-gray-700">
                    {msg.content}
                  </p>
                </div>
              );
            })}

            {selectedTicket.status !== 'CLOSED' && (
              <div className="space-y-3 border-t pt-4">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Votre réponse..."
                  rows={4}
                  className="w-full rounded-lg border p-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() || isSendingReply}
                    className="gap-2"
                  >
                    {isSendingReply ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Envoyer
                  </Button>
                </div>
              </div>
            )}

            {selectedTicket.status === 'CLOSED' && (
              <div className="rounded-lg bg-gray-100 p-4 text-center text-sm text-gray-500">
                Ce ticket est fermé. Créez un nouveau ticket si vous avez besoin d&apos;aide.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">Support</h1>
          <p className="mt-1 text-gray-500">
            Besoin d&apos;aide ? Créez un ticket et notre équipe vous répondra.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTickets} className="gap-2">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setViewMode('create')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau ticket
          </Button>
        </div>
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Aucun ticket
            </h3>
            <p className="mx-auto mb-4 max-w-sm text-gray-500">
              Vous n&apos;avez pas encore créé de ticket. Créez-en un si vous avez besoin d&apos;aide.
            </p>
            <Button onClick={() => setViewMode('create')} className="gap-2">
              <Plus className="h-4 w-4" />
              Créer un ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const status = statusConfig[ticket.status];
            const StatusIcon = status.icon;

            return (
              <button
                key={ticket.id}
                onClick={() => handleViewTicket(ticket)}
                className="block w-full rounded-xl border bg-white p-4 text-left transition-colors hover:border-purple-200 hover:bg-purple-50/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        #{ticket.id.slice(0, 8)}
                      </span>
                    </div>
                    <h3 className="truncate font-medium text-gray-900">
                      {ticket.subject}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {ticket._count?.messages ?? 0} message{(ticket._count?.messages ?? 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {formatRelativeTime(ticket.updatedAt)}
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
