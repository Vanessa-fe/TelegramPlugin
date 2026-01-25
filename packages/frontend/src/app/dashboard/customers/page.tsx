'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { customersApi } from '@/lib/api/customers';
import type { Customer } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Users, Eye, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = customers.filter(
        (c) =>
          c.displayName?.toLowerCase().includes(search.toLowerCase()) ||
          c.email?.toLowerCase().includes(search.toLowerCase()) ||
          c.telegramUsername?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [search, customers]);

  async function loadCustomers() {
    try {
      const data = await customersApi.findAll();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message || 'Failed to load customers'
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-[#6F6E77]">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1523]">
            Customers
          </h1>
          <p className="mt-1 text-[#6F6E77]">
            {customers.length} customer{customers.length !== 1 ? 's' : ''} total
          </p>
        </div>
      </div>

      {/* Search */}
      {customers.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6F6E77]" />
          <Input
            placeholder="Search by name, email, or Telegram..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 border-[#E9E3EF] focus:border-purple-600 focus:ring-purple-600"
          />
        </div>
      )}

      {/* Customers list */}
      {customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E9E3EF] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-[#1A1523] mb-2">
            No customers yet
          </h3>
          <p className="text-[#6F6E77] max-w-sm mx-auto">
            Customers will appear here when they purchase access to your
            products.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E9E3EF] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E9E3EF] bg-[#FDFAFF]">
                <th className="text-left text-sm font-medium text-[#6F6E77] px-6 py-4">
                  Customer
                </th>
                <th className="text-left text-sm font-medium text-[#6F6E77] px-6 py-4">
                  Telegram
                </th>
                <th className="text-left text-sm font-medium text-[#6F6E77] px-6 py-4">
                  Joined
                </th>
                <th className="text-right text-sm font-medium text-[#6F6E77] px-6 py-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-[#6F6E77]"
                  >
                    No customers match your search
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-[#E9E3EF] last:border-0 hover:bg-[#FDFAFF] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-medium text-sm">
                          {customer.displayName?.[0]?.toUpperCase() ||
                            customer.email?.[0]?.toUpperCase() ||
                            '?'}
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1523]">
                            {customer.displayName || 'No name'}
                          </p>
                          <p className="text-sm text-[#6F6E77]">
                            {customer.email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.telegramUsername ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          @{customer.telegramUsername}
                        </span>
                      ) : (
                        <span className="text-[#6F6E77]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6F6E77]">
                      {new Date(customer.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/customers/${customer.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-purple-50 hover:text-purple-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
