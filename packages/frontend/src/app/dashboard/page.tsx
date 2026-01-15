import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bienvenue sur votre dashboard</h1>
        <p className="mt-2 text-gray-600">
          Sélectionnez une option dans le menu latéral pour commencer.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/products"
          className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h3 className="text-lg font-semibold">Produits</h3>
          <p className="mt-2 text-sm text-gray-600">
            Créez et gérez vos produits d&apos;abonnement
          </p>
        </Link>
        <Link
          href="/dashboard/billing"
          className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h3 className="text-lg font-semibold">Facturation</h3>
          <p className="mt-2 text-sm text-gray-600">
            Connectez Stripe et suivez votre configuration
          </p>
        </Link>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Channels</h3>
          <p className="mt-2 text-sm text-gray-600">
            Liez vos channels Telegram aux produits
          </p>
        </div>
      </div>
    </div>
  );
}
