import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/marketing';
import { getLocale, getTranslations } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';
import { generateBreadcrumbSchema, renderJsonLd } from '@/lib/json-ld';
import { getAllPosts, getFeaturedPosts, getAllCategories } from '@/lib/blog';
import { Calendar, Clock, Tag } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return buildMetadata({
    canonical: '/blog',
    title: 'Blog Sublynk – Guides et conseils pour monétiser Telegram',
    description:
      'Découvrez nos guides, tutoriels et conseils pour monétiser efficacement vos canaux Telegram avec Sublynk.',
    locale,
  });
}

export default async function BlogPage() {
  const t = await getTranslations('blog');
  const allPosts = getAllPosts();
  const featuredPosts = getFeaturedPosts();
  const categories = getAllCategories();

  const breadcrumbItems = [
    { name: 'Accueil', url: '/' },
    { name: 'Blog', url: '/blog' },
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
              Blog Sublynk
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              Guides, tutoriels et conseils pour monétiser efficacement vos
              canaux Telegram
            </p>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-4 lg:px-6">
            <h2 className="text-2xl font-bold text-text-primary mb-8">
              Articles à la une
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.slice(0, 2).map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block bg-white rounded-2xl border border-border-custom overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {post.image && (
                    <div className="aspect-video bg-purple-100 overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.imageAlt || post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-text-secondary mb-3">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readingTime}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-purple-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-text-secondary line-clamp-2">
                      {post.description}
                    </p>
                    <div className="mt-4">
                      <span className="inline-block bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="py-12 lg:py-16 bg-surface">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-text-primary mb-8">
                Tous les articles
              </h2>
              {allPosts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-border-custom p-12 text-center">
                  <p className="text-text-secondary">
                    Aucun article publié pour le moment. Revenez bientôt !
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {allPosts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className="group block bg-white rounded-xl border border-border-custom p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-6">
                        {post.image && (
                          <div className="w-48 h-32 flex-shrink-0 bg-purple-100 rounded-lg overflow-hidden">
                            <img
                              src={post.image}
                              alt={post.imageAlt || post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-4 text-sm text-text-secondary mb-2">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(post.date).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {post.readingTime}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-purple-600 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-text-secondary line-clamp-2 mb-3">
                            {post.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="inline-block bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">
                              {post.category}
                            </span>
                            {post.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 text-xs text-text-secondary"
                              >
                                <Tag className="w-3 h-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-border-custom p-6 sticky top-8">
                <h3 className="text-lg font-bold text-text-primary mb-4">
                  Catégories
                </h3>
                {categories.length > 0 ? (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <Link
                        key={category}
                        href={`/blog/category/${category.toLowerCase()}`}
                        className="block px-4 py-2 rounded-lg text-text-secondary hover:bg-purple-50 hover:text-purple-700 transition-colors"
                      >
                        {category}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">
                    Aucune catégorie disponible
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
