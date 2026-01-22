'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-orange-100 p-3">
            <XCircle className="h-16 w-16 text-orange-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Paiement annulé
        </h1>

        <p className="text-gray-600 mb-6">
          Votre paiement a été annulé. Aucun montant n&apos;a été débité de votre compte.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            Si vous avez rencontré un problème lors du paiement, n&apos;hésitez pas à réessayer
            ou à nous contacter pour obtenir de l&apos;aide.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={() => window.history.back()} className="w-full">
            Réessayer
          </Button>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full">
              Retour à l&apos;accueil
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
