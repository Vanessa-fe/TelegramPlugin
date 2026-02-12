'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { productsApi } from '@/lib/api/products';
import { plansApi } from '@/lib/api/plans';
import { organizationsApi } from '@/lib/api/organizations';
import { PlanForm } from '@/components/plans/plan-form';
import type { Product } from '@/types/product';
import type { CreatePlanDto } from '@/types/plan';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function NewPlanPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const t = useTranslations('plans.newPage');

  const [product, setProduct] = useState<Product | null>(null);
  const [organizationCurrency, setOrganizationCurrency] = useState<string>('EUR');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function loadProduct() {
    try {
      const productData = await productsApi.findOne(productId);
      setProduct(productData);

      const organization = await organizationsApi.findOne(
        productData.organizationId,
      );
      setOrganizationCurrency(organization.currency);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message || t('toast.loadError')
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(data: CreatePlanDto) {
    try {
      await plansApi.create(data);
      toast.success(t('toast.createSuccess'));
      router.push(`/dashboard/products/${productId}/plans`);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message || t('toast.createError')
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <p className="text-center text-red-600">{t('notFound')}</p>
        <div className="flex justify-center">
          <Link href="/dashboard/products">
            <Button variant="outline">{t('backToProducts')}</Button>
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
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-2 text-gray-600">
            {t('subtitle', { productName: product.name })}
          </p>
        </div>
      </div>
      <PlanForm
        productId={productId}
        organizationCurrency={organizationCurrency}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
