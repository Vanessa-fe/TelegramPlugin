'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productsApi } from '@/lib/api/products';
import type { Product, ProductStatus } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Plus, Package, MoreHorizontal, List } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusConfig: Record<ProductStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700',
  },
  ACTIVE: {
    label: 'Active',
    className: 'bg-green-100 text-green-700',
  },
  ARCHIVED: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-500',
  },
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await productsApi.findAll();
      setProducts(data);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-[#6F6E77]">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1523]">Products</h1>
          <p className="mt-1 text-[#6F6E77]">
            Manage your subscription and one-time products
          </p>
        </div>
        <Link href="/dashboard/products/new">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            New product
          </Button>
        </Link>
      </div>

      {/* Products list */}
      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E9E3EF] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-[#1A1523] mb-2">
            No products yet
          </h3>
          <p className="text-[#6F6E77] mb-6 max-w-sm mx-auto">
            Create your first product to start selling access to your community.
          </p>
          <Link href="/dashboard/products/new">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Create product
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E9E3EF] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E9E3EF] bg-[#FDFAFF]">
                <th className="text-left text-sm font-medium text-[#6F6E77] px-6 py-4">
                  Product
                </th>
                <th className="text-left text-sm font-medium text-[#6F6E77] px-6 py-4">
                  Status
                </th>
                <th className="text-left text-sm font-medium text-[#6F6E77] px-6 py-4">
                  Created
                </th>
                <th className="text-right text-sm font-medium text-[#6F6E77] px-6 py-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-[#E9E3EF] last:border-0 hover:bg-[#FDFAFF] transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-[#1A1523]">{product.name}</p>
                    {product.description && (
                      <p className="text-sm text-[#6F6E77] truncate max-w-xs">
                        {product.description}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[product.status].className}`}
                    >
                      {statusConfig[product.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6F6E77]">
                    {new Date(product.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/products/${product.id}/plans`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#E9E3EF] hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
                        >
                          <List className="mr-2 h-4 w-4" />
                          Plans
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-purple-50"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
