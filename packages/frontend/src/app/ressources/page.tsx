import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/marketing';
import { getLocale } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';
import { generateBreadcrumbSchema, renderJsonLd } from '@/lib/json-ld';
import {
  BookOpen,
  Video,
  FileText,
  Zap,
  MessageCircle,
  TrendingUp,
  Shield,
  Workflow,
} from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return buildMetadata({
    canonical: '/ressources',
    title: 'Ressources – Guides, tutoriels et outils pour Telegram',
    description:
      'Accédez à nos guides complets, tutoriels vidéo, templates et outils pour réussir la monétisation de vos canaux Telegram.',
    locale,
  });
}

export default function RessourcesPage() {
  const breadcrumbItems = [
    { name: 'Accueil', url: '/' },
    { name: 'Ressources', url: '/ressources' },
  ];

  const resources = [
    {
      icon: BookOpen,
      title: 'Guide de démarrage',
      description:
        'Apprenez les bases pour lancer votre premier canal Telegram monétisé en moins de 30 minutes',
      link: '/ressources/guide-demarrage',
      badge: 'Guide',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      icon: Video,
      title: 'Tutoriels vidéo',
      description:
        'Formations vidéo étape par étape pour maîtriser Sublynk et optimiser vos revenus',
      link: '/ressources/tutoriels-video',
      badge: 'Vidéos',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      icon: FileText,
      title: 'Templates de messages',
      description:
        'Messages pré-rédigés pour vos lancements, promotions et communications avec vos abonnés',
      link: '/ressources/templates',
      badge: 'Templates',
      color: 'bg-green-100 text-green-700',
    },
    {
      icon: Zap,
      title: 'Guide Stripe',
      description:
        'Configuration complète de Stripe pour accepter les paiements et gérer vos revenus',
      link: '/ressources/guide-stripe',
      badge: 'Intégration',
      color: 'bg-yellow-100 text-yellow-700',
    },
    {
      icon: MessageCircle,
      title: 'Bot Telegram',
      description:
        'Documentation complète pour configurer et personnaliser votre bot Telegram',
      link: '/ressources/bot-telegram',
      badge: 'Technique',
      color: 'bg-indigo-100 text-indigo-700',
    },
    {
      icon: TrendingUp,
      title: 'Stratégies de croissance',
      description:
        'Tactiques éprouvées pour augmenter vos abonnés et maximiser vos conversions',
      link: '/ressources/strategies-croissance',
      badge: 'Marketing',
      color: 'bg-pink-100 text-pink-700',
    },
    {
      icon: Shield,
      title: 'Sécurité et conformité',
      description:
        'Bonnes pratiques pour protéger vos données et respecter le RGPD',
      link: '/ressources/securite',
      badge: 'Sécurité',
      color: 'bg-red-100 text-red-700',
    },
    {
      icon: Workflow,
      title: 'Automatisations',
      description:
        'Configurez des workflows automatiques pour gérer vos abonnements sans effort',
      link: '/ressources/automatisations',
      badge: 'Avancé',
      color: 'bg-teal-100 text-teal-700',
    },
  ];

  const quickLinks = [
    { title: "Centre d'aide", url: '/faq' },
    { title: 'Blog Sublynk', url: '/blog' },
    { title: 'API Documentation', url: '/docs/api' },
    { title: 'Contactez le support', url: '/contact' },
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
      <section className="py-16 lg:py-24 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-6">
              Ressources Sublynk
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              Guides complets, tutoriels vidéo, templates et outils pour
              réussir la monétisation de vos canaux Telegram. Tout ce dont vous
              avez besoin pour démarrer et grandir.
            </p>
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <Link
                key={resource.title}
                href={resource.link}
                className="group block bg-white rounded-2xl border border-border-custom p-6 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <resource.icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`inline-block text-xs font-medium px-2 py-1 rounded ${resource.color}`}
                  >
                    {resource.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-purple-600 transition-colors">
                  {resource.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {resource.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 lg:py-20 bg-surface">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-text-primary text-center mb-12">
            Liens utiles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.title}
                href={link.url}
                className="block bg-white rounded-xl border border-border-custom p-6 text-center hover:border-purple-300 hover:shadow-md transition-all"
              >
                <span className="font-semibold text-text-primary hover:text-purple-600">
                  {link.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-purple-600">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Besoin d&apos;aide personnalisée ?
          </h2>
          <p className="text-purple-200 mb-8 max-w-xl mx-auto">
            Notre équipe support est disponible pour vous accompagner dans
            votre projet
          </p>
          <Link
            href="/contact"
            className="inline-block bg-white hover:bg-purple-50 text-purple-600 font-semibold px-8 py-4 rounded-lg transition-colors duration-150 shadow-md"
          >
            Contactez-nous
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
