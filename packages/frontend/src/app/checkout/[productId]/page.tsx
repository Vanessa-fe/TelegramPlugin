'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { storefrontApi, type PublicProduct, type PublicPlan } from '@/lib/api/storefront';
import { billingApi } from '@/lib/api/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, ShieldCheck, Star } from 'lucide-react';

type PlanInterval = PublicPlan['interval'];

const intervalLabels: Record<PlanInterval, string> = {
  ONE_TIME: 'Paiement unique',
  DAY: 'par jour',
  WEEK: 'par semaine',
  MONTH: 'par mois',
  QUARTER: 'par trimestre',
  YEAR: 'par an',
};

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.productId as string;

  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer info form
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'telegram_stars'>('stripe');

  useEffect(() => {
    loadProduct();
  }, [productId]);

  useEffect(() => {
    // Pre-fill from URL params if available
    const emailParam = searchParams.get('email');
    const nameParam = searchParams.get('name');
    const telegramParam = searchParams.get('telegram');
    const planParam = searchParams.get('plan');

    if (emailParam) setEmail(emailParam);
    if (nameParam) setDisplayName(nameParam);
    if (telegramParam) setTelegramUsername(telegramParam);

    // Pre-select plan from URL if specified
    if (planParam && product) {
      const plan = product.plans.find((p) => p.id === planParam);
      if (plan) setSelectedPlan(plan);
    }
  }, [searchParams, product]);

  async function loadProduct() {
    try {
      setLoading(true);
      setError(null);
      const data = await storefrontApi.getProduct(productId);
      setProduct(data);

      // Auto-select if only one plan
      if (data.plans.length === 1) {
        setSelectedPlan(data.plans[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Ce produit n\'existe pas ou n\'est plus disponible');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    if (!selectedPlan) {
      toast.error('Veuillez sélectionner un plan');
      return;
    }

    if (paymentMethod === 'stripe') {
      if (!email) {
        toast.error('L\'email est requis pour le paiement Stripe');
        return;
      }

      try {
        setSubmitting(true);
        const response = await billingApi.createCheckout({
          planId: selectedPlan.id,
          customer: {
            email: email || undefined,
            displayName: displayName || undefined,
            telegramUsername: telegramUsername || undefined,
          },
        });

        // Redirect to Stripe checkout
        window.location.href = response.url;
      } catch (error) {
        console.error(error);
        toast.error('Erreur lors de la création du checkout');
        setSubmitting(false);
      }
    } else if (paymentMethod === 'telegram_stars') {
      if (!telegramUsername) {
        toast.error('Le username Telegram est requis pour payer avec Telegram Stars');
        return;
      }

      // For Telegram Stars, show instructions to use the bot
      toast.info(
        'Pour payer avec Telegram Stars, veuillez utiliser le bot Telegram:\n\n' +
        `Envoyez la commande: /buy ${selectedPlan.id}`,
        { duration: 10000 }
      );
      setSubmitting(false);
    }
  }

  function formatPrice(priceCents: number, currency: string): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(priceCents / 100);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900">Produit indisponible</h1>
          <p className="mt-2 text-gray-600">
            {error || 'Ce produit n\'existe pas ou n\'est plus disponible'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-sm text-gray-500 mb-2">Offert par {product.organization.name}</p>
          <h1 className="text-4xl font-bold text-gray-900">{product.name}</h1>
          {product.description && (
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">{product.description}</p>
          )}
          {product.channels.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>Acces a :</span>
              {product.channels.map((channel) => (
                <span key={channel.id} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {channel.provider === 'TELEGRAM' ? '📱' : '💬'}
                  {channel.title || 'Channel'}
                </span>
              ))}
            </div>
          )}
        </div>

        {product.plans.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">Aucun plan disponible pour ce produit</p>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Plans selection - 3 columns */}
            <div className="lg:col-span-3 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Choisir votre plan</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {product.plans.map((plan, index) => (
                  <Card
                    key={plan.id}
                    className={`p-6 cursor-pointer transition-all relative ${
                      selectedPlan?.id === plan.id
                        ? 'ring-2 ring-blue-500 bg-blue-50 shadow-lg'
                        : 'hover:shadow-md hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    {index === 0 && product.plans.length > 1 && (
                      <div className="absolute -top-3 left-4 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                        Populaire
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                          {selectedPlan?.id === plan.id && (
                            <Check className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        {plan.description && (
                          <p className="mt-1 text-sm text-gray-600">{plan.description}</p>
                        )}
                        <div className="mt-4">
                          <span className="text-3xl font-bold text-gray-900">
                            {formatPrice(plan.priceCents, plan.currency)}
                          </span>
                          <span className="text-gray-500 ml-2">
                            {intervalLabels[plan.interval]}
                          </span>
                        </div>
                        {plan.trialPeriodDays && (
                          <p className="mt-2 text-sm text-green-600 font-medium">
                            Essai gratuit de {plan.trialPeriodDays} jours
                          </p>
                        )}
                        {plan.accessDurationDays && (
                          <p className="mt-1 text-sm text-gray-500">
                            Acces valide {plan.accessDurationDays} jours
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Customer info form - 2 columns */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Finaliser</h2>
              <Card className="p-6 space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="displayName">Nom (optionnel)</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jean Dupont"
                  />
                </div>

                <div>
                  <Label htmlFor="telegram">
                    Username Telegram {paymentMethod === 'telegram_stars' ? '*' : ''}
                  </Label>
                  <Input
                    id="telegram"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder="@votre_username"
                    required={paymentMethod === 'telegram_stars'}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Pour recevoir l&apos;acces automatiquement
                  </p>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-sm font-medium mb-3 block">Paiement</Label>
                  <div className="space-y-2">
                    <div
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        paymentMethod === 'stripe'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPaymentMethod('stripe')}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="stripe"
                          checked={paymentMethod === 'stripe'}
                          onChange={() => setPaymentMethod('stripe')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">Carte bancaire</div>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        paymentMethod === 'telegram_stars'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPaymentMethod('telegram_stars')}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="telegram_stars"
                          checked={paymentMethod === 'telegram_stars'}
                          onChange={() => setPaymentMethod('telegram_stars')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            Telegram Stars
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={
                    !selectedPlan ||
                    submitting ||
                    (paymentMethod === 'stripe' && !email) ||
                    (paymentMethod === 'telegram_stars' && !telegramUsername)
                  }
                  className="w-full"
                  size="lg"
                >
                  {submitting ? (
                    'Traitement...'
                  ) : selectedPlan ? (
                    paymentMethod === 'stripe' ? (
                      <>Payer {formatPrice(selectedPlan.priceCents, selectedPlan.currency)}</>
                    ) : (
                      'Continuer avec Telegram'
                    )
                  ) : (
                    'Selectionnez un plan'
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Paiement securise</span>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
