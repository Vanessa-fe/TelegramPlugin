'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('session_id');
    setSessionId(id);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Paiement réussi !
        </h1>

        <p className="text-gray-600 mb-6">
          Merci pour votre achat. Votre abonnement a été activé avec succès.
        </p>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            Vous allez recevoir un email de confirmation avec tous les détails de votre abonnement.
            Si vous avez fourni votre username Telegram, vous recevrez également un lien d&apos;invitation
            pour rejoindre le(s) channel(s) privé(s).
          </p>
        </div>

        {sessionId && (
          <p className="text-xs text-gray-500 mb-6 font-mono">
            Session ID: {sessionId}
          </p>
        )}

        <div className="space-y-3">
          <Link href="/" className="block">
            <Button variant="default" className="w-full">
              Retour à l&apos;accueil
            </Button>
          </Link>
          <p className="text-xs text-gray-500">
            Vous pouvez fermer cette page en toute sécurité
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">Chargement...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
