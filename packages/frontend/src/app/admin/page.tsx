'use client';

import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Back-office</h1>
        <p className="mt-2 text-gray-600">
          Gérez les organisations clientes et la facturation.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/organizations"
          className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h3 className="text-lg font-semibold">Organisations</h3>
          <p className="mt-2 text-sm text-gray-600">
            Visualisez et gérez les organisations clientes
          </p>
        </Link>
        <Link
          href="/admin/billing"
          className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h3 className="text-lg font-semibold">Facturation</h3>
          <p className="mt-2 text-sm text-gray-600">
            Suivez l&apos;etat Stripe et la configuration billing
          </p>
        </Link>
      </div>
    </div>
  );
}
