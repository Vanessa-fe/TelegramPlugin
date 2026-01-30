'use client';

import { useEffect, useState, useMemo } from 'react';
import { productsApi } from '@/lib/api/products';
import { plansApi } from '@/lib/api/plans';
import type { Product } from '@/types/product';
import type { Plan } from '@/types/plan';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Link2,
  Copy,
  ExternalLink,
  QrCode,
  MessageSquare,
  Send,
  Instagram,
  Twitter,
  Mail,
  Check,
  Megaphone,
} from 'lucide-react';
import { toast } from 'sonner';

const intervalLabels: Record<string, string> = {
  ONE_TIME: 'paiement unique',
  DAY: 'par jour',
  WEEK: 'par semaine',
  MONTH: 'par mois',
  QUARTER: 'par trimestre',
  YEAR: 'par an',
};

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(cents / 100);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function PromotePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [productsData, plansData] = await Promise.all([
        productsApi.findAll(),
        plansApi.findAll(),
      ]);
      // Only show active products
      const activeProducts = productsData.filter(p => p.status === 'ACTIVE');
      setProducts(activeProducts);
      setPlans(plansData);
      // Select first product by default
      if (activeProducts.length > 0) {
        setSelectedProductId(activeProducts[0].id);
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message || 'Erreur lors du chargement des offres'
      );
    } finally {
      setIsLoading(false);
    }
  }

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const productPlans = useMemo(() => {
    return plans.filter(p => p.productId === selectedProductId && p.isActive);
  }, [plans, selectedProductId]);

  // Generate payment link (placeholder - would be replaced with actual Stripe link)
  const paymentLink = useMemo(() => {
    if (!selectedProduct) return '';
    const slug = slugify(selectedProduct.name);
    // This should be the actual payment URL from your backend
    return `${window.location.origin}/pay/${slug}`;
  }, [selectedProduct]);

  // Generate share message
  const shareMessage = useMemo(() => {
    if (!selectedProduct || productPlans.length === 0) return '';
    const plan = productPlans[0];
    const price = formatPrice(plan.priceCents, plan.currency);
    const interval = intervalLabels[plan.interval] || '';

    return `🚀 Rejoignez mon canal privé ${selectedProduct.name} !

✅ Accès exclusif à tout mon contenu premium
✅ Mises à jour régulières
✅ Communauté privée

${interval === 'paiement unique' ? `Seulement ${price}` : `Seulement ${price} ${interval}`}
👉 ${paymentLink}`;
  }, [selectedProduct, productPlans, paymentLink]);

  async function copyToClipboard(text: string, type: 'link' | 'message') {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedMessage(true);
        setTimeout(() => setCopiedMessage(false), 2000);
      }
      toast.success('Copié !');
    } catch {
      toast.error('Erreur lors de la copie');
    }
  }

  function shareOnPlatform(platform: string) {
    const encodedMessage = encodeURIComponent(shareMessage);
    const encodedUrl = encodeURIComponent(paymentLink);

    const urls: Record<string, string> = {
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
      email: `mailto:?subject=${encodeURIComponent(`Rejoignez ${selectedProduct?.name || 'mon offre'}`)}&body=${encodedMessage}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank');
    }
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

  // Empty state - no products
  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Promouvoir mes offres</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Partagez vos offres et attirez de nouveaux abonnés
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white p-12 text-center">
          <Megaphone className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Aucune offre active</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Créez votre première offre pour commencer à la promouvoir.
          </p>
          <Button className="mt-6" asChild>
            <a href="/dashboard/products/new">Créer une offre</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Promouvoir mes offres</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Partagez vos offres et attirez de nouveaux abonnés
        </p>
      </div>

      {/* Product selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Sélectionner une offre :</label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Link Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4" />
              Lien de vente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
              <input
                type="text"
                readOnly
                value={paymentLink}
                className="flex-1 bg-transparent text-sm font-mono"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(paymentLink, 'link')}
              >
                {copiedLink ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copiedLink ? 'Copié !' : 'Copier'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(paymentLink, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Ouvrir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Fonctionnalité à venir')}
              >
                <QrCode className="h-4 w-4 mr-1" />
                QR Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Share Message Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Message prêt à partager
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <textarea
                readOnly
                value={shareMessage}
                rows={8}
                className="w-full bg-transparent text-sm resize-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(shareMessage, 'message')}
              >
                {copiedMessage ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copiedMessage ? 'Copié !' : 'Copier'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Share Buttons */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Partager directement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="flex-1 min-w-[120px]"
              onClick={() => shareOnPlatform('telegram')}
            >
              <Send className="h-4 w-4 mr-2" />
              Telegram
            </Button>
            <Button
              variant="outline"
              className="flex-1 min-w-[120px]"
              onClick={() => toast.info('Ouvrez Instagram et collez le message')}
            >
              <Instagram className="h-4 w-4 mr-2" />
              Instagram
            </Button>
            <Button
              variant="outline"
              className="flex-1 min-w-[120px]"
              onClick={() => shareOnPlatform('twitter')}
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              variant="outline"
              className="flex-1 min-w-[120px]"
              onClick={() => shareOnPlatform('email')}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan Info */}
      {productPlans.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Détails de l&apos;offre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {productPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {formatPrice(plan.priceCents, plan.currency)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {intervalLabels[plan.interval] || ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
