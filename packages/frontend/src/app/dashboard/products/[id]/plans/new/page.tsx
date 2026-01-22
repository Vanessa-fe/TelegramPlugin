'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { productsApi } from '@/lib/api/products';
import { plansApi } from '@/lib/api/plans';
import { PlanForm } from '@/components/plans/plan-form';
import type { Product } from '@/types/product';
import type { CreatePlanDto } from '@/types/plan';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewPlanPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  async function loadProduct() {
    try {
      const data = await productsApi.findOne(productId);
      setProduct(data);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message ||
          'Erreur lors du chargement du produit'
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(data: CreatePlanDto) {
    try {
      await plansApi.create(data);
      toast.success('Plan créé avec succès');
      router.push(`/dashboard/products/${productId}/plans`);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message ||
          'Erreur lors de la création du plan'
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <p className="text-center text-red-600">Produit non trouvé</p>
        <div className="flex justify-center">
          <Link href="/dashboard/products">
            <Button variant="outline">Retour aux produits</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/products/${productId}/plans`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nouveau plan</h1>
          <p className="mt-2 text-gray-600">
            Créer un plan tarifaire pour {product.name}
          </p>
        </div>
      </div>
      <PlanForm
        productId={productId}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
