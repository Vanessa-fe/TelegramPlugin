'use client';

import { useEffect, useState, useMemo } from 'react';
import { productsApi } from '@/lib/api/products';
import { plansApi } from '@/lib/api/plans';
import type { Product } from '@/types/product';
import type { Plan } from '@/types/plan';
import { organizationsApi } from '@/lib/api/organizations';
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
import { useLocale, useTranslations } from 'next-intl';
import { slugify } from '@/lib/slugify';

function formatPrice(cents: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(cents / 100);
}

export default function PromotePage() {
  const t = useTranslations('promote');
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [organizationSlugs, setOrganizationSlugs] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const intervalLabels = useMemo(
    () => ({
      ONE_TIME: t('intervals.oneTime'),
      DAY: t('intervals.day'),
      WEEK: t('intervals.week'),
      MONTH: t('intervals.month'),
      QUARTER: t('intervals.quarter'),
      YEAR: t('intervals.year'),
    }),
    [t]
  );

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
        axiosError.response?.data?.message || t('errors.loadProducts')
      );
    } finally {
      setIsLoading(false);
    }
  }

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  useEffect(() => {
    let cancelled = false;

    async function loadOrganizationSlug(orgId: string) {
      try {
        const organization = await organizationsApi.findOne(orgId);
        if (!cancelled) {
          setOrganizationSlugs(prev => ({ ...prev, [orgId]: organization.slug }));
        }
      } catch {
        // Fallback to UUID link if organization lookup fails (e.g. permissions)
      }
    }

    if (!selectedProduct) return;
    const orgId = selectedProduct.organizationId;
    if (organizationSlugs[orgId]) return;
    void loadOrganizationSlug(orgId);

    return () => {
      cancelled = true;
    };
  }, [selectedProduct, organizationSlugs]);

  const productPlans = useMemo(() => {
    return plans.filter(p => p.productId === selectedProductId && p.isActive);
  }, [plans, selectedProductId]);

  const organizationSlug = useMemo(() => {
    if (!selectedProduct) return '';
    return organizationSlugs[selectedProduct.organizationId] || '';
  }, [organizationSlugs, selectedProduct]);

  // Generate payment link
  const paymentLink = useMemo(() => {
    if (!selectedProduct) return '';
    const productSlug = slugify(selectedProduct.name);
    if (organizationSlug && productSlug) {
      return `${window.location.origin}/checkout/${organizationSlug}/${productSlug}`;
    }
    return `${window.location.origin}/checkout/${selectedProduct.id}`;
  }, [selectedProduct, organizationSlug]);

  // Generate share message
  const shareMessage = useMemo(() => {
    if (!selectedProduct || productPlans.length === 0) {
      return '';
    }

    const plan = productPlans[0];
    const price = formatPrice(plan.priceCents, plan.currency, locale);
    const interval = intervalLabels[plan.interval] || '';
    const priceLine =
      plan.interval === 'ONE_TIME'
        ? t('shareMessage.priceOneTime', { price })
        : t('shareMessage.priceRecurring', { price, interval });

    return [
      t('shareMessage.line1', { productName: selectedProduct.name }),
      '',
      t('shareMessage.line2'),
      t('shareMessage.line3'),
      t('shareMessage.line4'),
      '',
      priceLine,
      t('shareMessage.line5', { paymentLink }),
    ].join('\n');
  }, [selectedProduct, productPlans, paymentLink, locale, intervalLabels, t]);

  const shareMessageNote = useMemo(() => {
    if (!selectedProduct) return t('shareMessage.noProduct');
    if (productPlans.length === 0) return t('shareMessage.noActivePlans');
    return '';
  }, [selectedProduct, productPlans.length, t]);

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
      toast.success(t('toast.copied'));
    } catch {
      toast.error(t('toast.copyError'));
    }
  }

  function shareOnPlatform(platform: string) {
    const encodedMessage = encodeURIComponent(shareMessage);
    const encodedUrl = encodeURIComponent(paymentLink);
    const emailProductName = selectedProduct?.name || t('email.defaultProduct');

    const urls: Record<string, string> = {
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
      email: `mailto:?subject=${encodeURIComponent(t('email.subject', { productName: emailProductName }))}&body=${encodedMessage}`,
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
          <p className="mt-2 text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Empty state - no products
  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white p-12 text-center">
          <Megaphone className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">{t('empty.title')}</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {t('empty.body')}
          </p>
          <Button className="mt-6" asChild>
            <a href="/dashboard/products/new">{t('empty.cta')}</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Product selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">{t('selector.label')}</label>
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
              {t('cards.paymentLink')}
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
                {copiedLink ? t('buttons.copied') : t('buttons.copy')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(paymentLink, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                {t('buttons.open')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info(t('toast.comingSoon'))}
              >
                <QrCode className="h-4 w-4 mr-1" />
                {t('buttons.qr')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Share Message Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              {t('cards.shareMessage')}
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
            {shareMessageNote && (
              <p className="text-sm text-muted-foreground">
                {shareMessageNote}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(shareMessage, 'message')}
                disabled={!shareMessage}
              >
                {copiedMessage ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copiedMessage ? t('buttons.copied') : t('buttons.copy')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Share Buttons */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('cards.shareDirect')}</CardTitle>
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
              onClick={() => toast.info(t('toast.instagram'))}
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
              {t('buttons.email')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan Info */}
      {productPlans.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('cards.offerDetails')}</CardTitle>
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
                      {formatPrice(plan.priceCents, plan.currency, locale)}
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
