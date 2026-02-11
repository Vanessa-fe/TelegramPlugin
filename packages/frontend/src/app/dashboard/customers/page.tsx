"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customersApi } from "@/lib/api/customers";
import type { Customer } from "@/types/customer";
import { Eye, Search, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CustomersPage() {
  const locale = useLocale();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const t = useTranslations("customers");

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
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("error"));
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-text-secondary">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
            {t("title")}
          </h1>
          <p className="mt-1 text-text-secondary">{t("subtitle")}</p>
          <p className="mt-1 text-text-secondary">
            {customers.length}{" "}
            {customers.length !== 1 ? t("plural") : t("singular")}
          </p>
        </div>
      </div>

      {/* Search */}
      {customers.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 border-border-custom focus:border-purple-600 focus:ring-purple-600"
          />
        </div>
      )}

      {/* Customers list */}
      {customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-border-custom p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {t("empty.title")}
          </h3>
          <p className="text-text-secondary max-w-sm mx-auto">
            {t("empty.description")}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border-custom overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-custom bg-surface">
                <th className="text-left text-sm font-medium text-text-secondary px-6 py-4">
                  {t("table.customer")}
                </th>
                <th className="text-left text-sm font-medium text-text-secondary px-6 py-4">
                  {t("table.Platform")}
                </th>
                <th className="text-left text-sm font-medium text-text-secondary px-6 py-4">
                  {t("table.since")}
                </th>
                <th className="text-right text-sm font-medium text-text-secondary px-6 py-4">
                  {t("table.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-text-secondary"
                  >
                    {t("noResults")}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-border-custom last:border-0 hover:bg-surface transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-medium text-sm">
                          {customer.displayName?.[0]?.toUpperCase() ||
                            customer.email?.[0]?.toUpperCase() ||
                            "?"}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">
                            {customer.displayName || t("detail.noName")}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {customer.email || t("detail.noEmail")}
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
                        <span className="text-text-secondary">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {new Date(customer.createdAt).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
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
