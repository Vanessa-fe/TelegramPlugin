"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { giftCodesApi } from "@/lib/api/gift-codes";
import type { GiftCode, GiftCodeStatus } from "@/types/gift-code";
import { Gift, MoreHorizontal, Plus, Copy, Check } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const statusClassNames: Record<GiftCodeStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-orange-100 text-orange-700",
  DISABLED: "bg-gray-100 text-gray-500",
};

const statusLabels: Record<GiftCodeStatus, string> = {
  ACTIVE: "Actif",
  EXPIRED: "Expiré",
  DISABLED: "Désactivé",
};

export default function AdminGiftCodesPage() {
  const [giftCodes, setGiftCodes] = useState<GiftCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const locale = useLocale();

  const loadGiftCodes = useCallback(async () => {
    try {
      const data = await giftCodesApi.findAll();
      setGiftCodes(data);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGiftCodes();
  }, [loadGiftCodes]);

  async function handleDisable(id: string) {
    try {
      await giftCodesApi.disable(id);
      toast.success("Code cadeau désactivé");
      loadGiftCodes();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Erreur lors de la désactivation");
    }
  }

  async function handleCopyCode(code: string, id: string) {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Code copié !");
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Codes Cadeaux
          </h1>
          <p className="mt-1 text-gray-500">
            Créez des codes pour offrir des accès gratuits
          </p>
        </div>
        <Link href="/admin/gift-codes/new">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Créer un code
          </Button>
        </Link>
      </div>

      {/* Gift codes list */}
      {giftCodes.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun code cadeau
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Créez votre premier code cadeau pour offrir des accès gratuits à vos utilisateurs.
          </p>
          <Link href="/admin/gift-codes/new">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Créer un code
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                  Code
                </th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                  Description
                </th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                  Utilisations
                </th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                  Statut
                </th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                  Expiration
                </th>
                <th className="text-right text-sm font-medium text-gray-500 px-6 py-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {giftCodes.map((giftCode) => (
                <tr
                  key={giftCode.id}
                  className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-mono">
                        {giftCode.code}
                      </code>
                      <button
                        onClick={() => handleCopyCode(giftCode.code, giftCode.id)}
                        className="text-gray-400 hover:text-purple-600 transition-colors"
                      >
                        {copiedId === giftCode.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {giftCode.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="font-medium">{giftCode.usedCount}</span>
                    {giftCode.maxUses && (
                      <span className="text-gray-400"> / {giftCode.maxUses}</span>
                    )}
                    {!giftCode.maxUses && (
                      <span className="text-gray-400"> (illimité)</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClassNames[giftCode.status]}`}
                    >
                      {statusLabels[giftCode.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {giftCode.expiresAt
                      ? new Date(giftCode.expiresAt).toLocaleDateString(locale, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Jamais"}
                  </td>
                  <td className="px-6 py-4 text-right">
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
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/gift-codes/${giftCode.id}`}>
                            Voir les détails
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/gift-codes/${giftCode.id}/edit`}>
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        {giftCode.status === "ACTIVE" && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDisable(giftCode.id)}
                          >
                            Désactiver
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
