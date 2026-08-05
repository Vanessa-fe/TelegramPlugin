import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/marketing';
import { getLocale } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';
import { generateBreadcrumbSchema, renderJsonLd } from '@/lib/json-ld';
import {
  Check,
  Shield,
  CreditCard,
  Users,
  BarChart3,
  Lock,
  Bell,
} from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return buildMetadata({
    canonical: '/solutions/abonnement-telegram-payant',
    title:
      'Abonnement Telegram Payant : Gérez vos Abonnés Automatiquement | Sublynk',
    description:
      'Créez et gérez des abonnements payants pour votre canal Telegram en quelques clics. Paiements automatisés, gestion des accès, facturation récurrente avec Sublynk.',
    locale,
  });
}

export default function AbonnementTelegramPayantPage() {
  const breadcrumbItems = [
    { name: 'Accueil', url: '/' },
    { name: 'Solutions', url: '/solutions' },
    { name: 'Abonnement Telegram Payant', url: '/solutions/abonnement-telegram-payant' },
  ];

  const features = [
    {
      icon: CreditCard,
      title: 'Paiements automatisés',
      description:
        'Intégration Stripe pour des paiements sécurisés et récurrents sans intervention manuelle',
    },
    {
      icon: Lock,
      title: 'Gestion des accès',
      description:
        "Contrôle automatique des accès : ajout immédiat lors du paiement, révocation à l'expiration",
    },
    {
      icon: Users,
      title: 'Multi-plans',
      description:
        'Créez plusieurs niveaux d\'abonnement (mensuel, trimestriel, annuel) avec tarifs différenciés',
    },
    {
      icon: Bell,
      title: 'Notifications automatiques',
      description:
        'Alertes automatiques pour les nouveaux abonnés, expirations et renouvellements',
    },
    {
      icon: BarChart3,
      title: 'Analytics détaillées',
      description:
        'Suivez vos revenus, taux de conversion, churn rate et autres KPIs en temps réel',
    },
    {
      icon: Shield,
      title: 'Sécurité maximale',
      description:
        'Conformité RGPD, données chiffrées, paiements sécurisés via Stripe',
    },
  ];

  const useCases = [
    {
      title: 'Signaux de Trading',
      description:
        "Vendez l'accès à vos analyses et signaux de trading crypto/forex avec des abonnements mensuels",
      price: '49€/mois',
    },
    {
      title: 'Formation Continue',
      description:
        'Proposez des cours exclusifs et du contenu éducatif premium via abonnement',
      price: '29€/mois',
    },
    {
      title: 'Communauté VIP',
      description:
        'Créez une communauté privée avec du contenu exclusif et des avantages membres',
      price: '19€/mois',
    },
    {
      title: 'Newsletter Premium',
      description:
        'Monétisez vos analyses de marché et insights via une newsletter Telegram payante',
      price: '9€/mois',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Créez votre compte',
      description: 'Inscription gratuite en 2 minutes, aucune carte bancaire requise',
    },
    {
      number: '2',
      title: 'Configurez votre produit',
      description: "Définissez vos plans d'abonnement, tarifs et périodes d'essai",
    },
    {
      number: '3',
      title: 'Connectez votre canal',
      description: 'Ajoutez notre bot à votre canal Telegram en quelques clics',
    },
    {
      number: '4',
      title: 'Partagez le lien',
      description: 'Diffusez votre lien de paiement et commencez à recevoir des abonnés payants',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: renderJsonLd(generateBreadcrumbSchema(breadcrumbItems)),
        }}
      />
      <Navbar />

      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                Abonnement Telegram Payant :<br />
                Automatisez Tout
              </h1>
              <p className="text-xl text-purple-100 mb-8 leading-relaxed">
                Transformez votre canal Telegram en source de revenus récurrents. Gestion automatique des paiements, accès et facturation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="inline-block bg-white hover:bg-purple-50 text-purple-600 font-semibold px-8 py-4 rounded-lg transition-colors duration-150 shadow-lg text-center"
                >
                  Démarrer gratuitement
                </Link>
                <Link
                  href="/pricing"
                  className="inline-block bg-purple-500 hover:bg-purple-400 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-150 text-center"
                >
                  Voir les tarifs
                </Link>
              </div>
              <p className="mt-6 text-sm text-purple-200">
                ✓ Gratuit jusqu&apos;à 10 abonnés &nbsp;&nbsp; ✓ Sans engagement &nbsp;&nbsp; ✓ Configuration en 5 min
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="space-y-4">
                {[
                  'Paiements automatiques via Stripe',
                  'Gestion des accès en temps réel',
                  'Facturation récurrente',
                  'Dashboard complet',
                  'Support multilingue',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-white">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              Fonctionnalités pour vos abonnements Telegram
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Tous les outils nécessaires pour gérer des abonnements payants sans effort
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl border border-border-custom p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 lg:py-28 bg-surface">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              Cas d&apos;usage populaires
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Découvrez comment d&apos;autres créateurs monétisent leurs canaux Telegram
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="bg-white rounded-xl border border-border-custom p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-text-primary">
                    {useCase.title}
                  </h3>
                  <span className="inline-block bg-purple-100 text-purple-700 font-semibold px-3 py-1 rounded-full text-sm">
                    {useCase.price}
                  </span>
                </div>
                <p className="text-text-secondary">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Lancez vos abonnements Telegram payants en 4 étapes simples
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 rounded-full bg-purple-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-purple-600">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Prêt à lancer vos abonnements Telegram payants ?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Rejoignez des centaines de créateurs qui génèrent des revenus récurrents avec Sublynk
          </p>
          <Link
            href="/register"
            className="inline-block bg-white hover:bg-purple-50 text-purple-600 font-semibold px-8 py-4 rounded-lg transition-colors duration-150 shadow-lg text-lg"
          >
            Créer mon compte gratuitement
          </Link>
          <p className="mt-6 text-purple-200">
            Aucune carte bancaire requise • Configuration en 5 minutes
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
