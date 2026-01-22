'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { channelsApi } from '@/lib/api/channels';
import { customersApi } from '@/lib/api/customers';
import { subscriptionsApi } from '@/lib/api/subscriptions';
import type { Channel, ChannelAccess, AccessStatus } from '@/types/channel';
import type { Customer } from '@/types/customer';
import type { Subscription } from '@/types/subscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Plus, UserPlus, UserMinus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const statusLabels: Record<AccessStatus, string> = {
  PENDING: 'En attente',
  GRANTED: 'Accordé',
  REVOKED: 'Révoqué',
};

const statusColors: Record<AccessStatus, string> = {
  PENDING: 'text-yellow-600 bg-yellow-50',
  GRANTED: 'text-green-600 bg-green-50',
  REVOKED: 'text-red-600 bg-red-50',
};

const statusIcons: Record<AccessStatus, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  GRANTED: <CheckCircle className="h-4 w-4" />,
  REVOKED: <XCircle className="h-4 w-4" />,
};

export default function ChannelAccessManagementPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params.id as string;

  const [channel, setChannel] = useState<Channel | null>(null);
  const [accesses, setAccesses] = useState<ChannelAccess[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>('');
  const [isGranting, setIsGranting] = useState(false);

  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeSubscriptionId, setRevokeSubscriptionId] = useState<string>('');
  const [revokeReason, setRevokeReason] = useState<string>('manual');
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    loadData();
  }, [channelId]);

  async function loadData() {
    try {
      const [channelData, accessesData, customersData, subscriptionsData] = await Promise.all([
        channelsApi.findOne(channelId),
        channelsApi.getAccesses(channelId),
        customersApi.findAll(),
        subscriptionsApi.findAll(),
      ]);

      setChannel(channelData);
      setAccesses(accessesData);
      setCustomers(customersData);
      setSubscriptions(subscriptionsData);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message ||
          'Erreur lors du chargement des données'
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGrantAccess() {
    if (!selectedCustomerId || !selectedSubscriptionId) {
      toast.error('Veuillez sélectionner un client et un abonnement');
      return;
    }

    setIsGranting(true);
    try {
      await channelsApi.grantAccess({
        customerId: selectedCustomerId,
        subscriptionId: selectedSubscriptionId,
        channelId,
      });

      toast.success('Accès accordé avec succès');
      setShowGrantDialog(false);
      setSelectedCustomerId('');
      setSelectedSubscriptionId('');
      await loadData();
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message ||
          'Erreur lors de l\'accord de l\'accès'
      );
    } finally {
      setIsGranting(false);
    }
  }

  async function handleRevokeAccess() {
    if (!revokeSubscriptionId) {
      toast.error('Erreur: abonnement non sélectionné');
      return;
    }

    setIsRevoking(true);
    try {
      await channelsApi.revokeAccess({
        subscriptionId: revokeSubscriptionId,
        reason: revokeReason,
      });

      toast.success('Accès révoqué avec succès');
      setShowRevokeDialog(false);
      setRevokeSubscriptionId('');
      await loadData();
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message ||
          'Erreur lors de la révocation de l\'accès'
      );
    } finally {
      setIsRevoking(false);
    }
  }

  function getCustomerName(customerId: string): string {
    const customer = customers.find(c => c.id === customerId);
    return customer?.displayName || customer?.email || 'Client inconnu';
  }

  function openRevokeDialog(subscriptionId: string) {
    setRevokeSubscriptionId(subscriptionId);
    setShowRevokeDialog(true);
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="space-y-6">
        <p className="text-center text-red-600">Channel non trouvé</p>
        <div className="flex justify-center">
          <Link href="/dashboard/channels">
            <Button variant="outline">Retour aux channels</Button>
          </Link>
        </div>
      </div>
    );
  }

  const customerSubscriptions = selectedCustomerId
    ? subscriptions.filter(s => s.customerId === selectedCustomerId && s.status === 'ACTIVE')
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/channels">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{channel.title || 'Channel'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestion des accès au channel
          </p>
        </div>
        <Button onClick={() => setShowGrantDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Accorder un accès
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total accès</p>
          <p className="text-2xl font-bold">{accesses.length}</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-sm text-green-700">Accordés</p>
          <p className="text-2xl font-bold text-green-700">
            {accesses.filter(a => a.status === 'GRANTED').length}
          </p>
        </Card>
        <Card className="p-4 bg-red-50">
          <p className="text-sm text-red-700">Révoqués</p>
          <p className="text-2xl font-bold text-red-700">
            {accesses.filter(a => a.status === 'REVOKED').length}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Accès actifs</h2>
        {accesses.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucun accès configuré pour ce channel
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Accordé le</TableHead>
                <TableHead>Révoqué le</TableHead>
                <TableHead>Raison</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accesses.map((access) => (
                <TableRow key={access.id}>
                  <TableCell className="font-medium">
                    {getCustomerName(access.customerId)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        statusColors[access.status]
                      }`}
                    >
                      {statusIcons[access.status]}
                      {statusLabels[access.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {access.grantedAt
                      ? new Date(access.grantedAt).toLocaleDateString('fr-FR')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {access.revokedAt
                      ? new Date(access.revokedAt).toLocaleDateString('fr-FR')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {access.revokeReason || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {access.status === 'GRANTED' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openRevokeDialog(access.subscriptionId)}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Révoquer
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Grant Access Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accorder un accès</DialogTitle>
            <DialogDescription>
              Sélectionnez un client et son abonnement pour lui donner accès à ce channel
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="customer">Client</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.displayName || customer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCustomerId && (
              <div>
                <Label htmlFor="subscription">Abonnement</Label>
                <Select value={selectedSubscriptionId} onValueChange={setSelectedSubscriptionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un abonnement" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerSubscriptions.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Aucun abonnement actif
                      </SelectItem>
                    ) : (
                      customerSubscriptions.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.id.slice(0, 8)}... - {sub.status}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGrantDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleGrantAccess} disabled={isGranting}>
              {isGranting ? 'Traitement...' : 'Accorder l\'accès'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Access Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Révoquer un accès</DialogTitle>
            <DialogDescription>
              Cette action révoquera l&apos;accès au channel pour ce client
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Raison de la révocation</Label>
              <Select value={revokeReason} onValueChange={setRevokeReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Révocation manuelle</SelectItem>
                  <SelectItem value="payment_failed">Paiement échoué</SelectItem>
                  <SelectItem value="canceled">Abonnement annulé</SelectItem>
                  <SelectItem value="refund">Remboursement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleRevokeAccess} disabled={isRevoking}>
              {isRevoking ? 'Traitement...' : 'Révoquer l\'accès'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
