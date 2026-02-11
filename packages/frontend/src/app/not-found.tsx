import Link from 'next/link';
import { Navbar, Footer } from '@/components/marketing';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 lg:px-6 text-center">
          <p className="text-sm uppercase tracking-widest text-purple-600 font-semibold mb-4">
            404
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
            {t('title')}
          </h1>
          <p className="text-text-secondary mb-8">
            {t('description')}
          </p>
          <Link
            href="/"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            {t('cta')}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
