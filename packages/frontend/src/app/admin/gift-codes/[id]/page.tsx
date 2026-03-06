"use client";

import { Button } from "@/components/ui/button";
import { giftCodesApi } from "@/lib/api/gift-codes";
import type { GiftCode, GiftCodeUsage, GiftCodeStatus } from "@/types/gift-code";
import { ArrowLeft, Copy, Check, Gift, Pencil, Crown } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
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

export default function GiftCodeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const locale = useLocale();

  const [giftCode, setGiftCode] = useState<GiftCode | null>(null);
  const [usages, setUsages] = useState<GiftCodeUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [codeData, usagesData] = await Promise.all([
        giftCodesApi.findOne(id),
        giftCodesApi.getUsages(id),
      ]);
      setGiftCode(codeData);
      setUsages(usagesData);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCopyCode() {
    if (!giftCode) return;
    await navigator.clipboard.writeText(giftCode.code);
    setCopied(true);
    toast.success("Code copié !");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDisable() {
    if (!giftCode) return;
    try {
      await giftCodesApi.disable(giftCode.id);
      toast.success("Code cadeau désactivé");
      loadData();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Erreur lors de la désactivation");
    }
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

  if (!giftCode) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Code cadeau introuvable</p>
        <Link href="/admin/gift-codes" className="text-purple-600 hover:underline mt-2 inline-block">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/gift-codes"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            giftCode.isPlatformTrial
              ? "bg-purple-100 text-purple-600"
              : "bg-blue-100 text-blue-600"
          }`}>
            {giftCode.isPlatformTrial ? (
              <Crown className="w-6 h-6" />
            ) : (
              <Gift className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <code className="text-2xl font-bold font-mono text-gray-900">
                {giftCode.code}
              </code>
              <button
                onClick={handleCopyCode}
                className="text-gray-400 hover:text-purple-600 transition-colors"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClassNames[giftCode.status]}`}
              >
                {statusLabels[giftCode.status]}
              </span>
              {giftCode.isPlatformTrial ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  <Crown className="h-3 w-3" />
                  Essai Plateforme
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  <Gift className="h-3 w-3" />
                  Accès Produit
                </span>
              )}
            </div>
            {giftCode.description && (
              <p className="mt-1 text-gray-500">{giftCode.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/gift-codes/${giftCode.id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </Link>
          {giftCode.status === "ACTIVE" && (
            <Button variant="destructive" onClick={handleDisable}>
              Désactiver
            </Button>
          )}
        </div>
      </div>

      {/* Platform Trial Info */}
      {giftCode.isPlatformTrial && (
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">Essai Plateforme</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-purple-600">Plan offert</p>
              <p className="text-xl font-bold text-purple-900 mt-1">
                {giftCode.platformPlanName?.charAt(0).toUpperCase()}{giftCode.platformPlanName?.slice(1)}
              </p>
            </div>
            <div>
              <p className="text-sm text-purple-600">Durée de l&apos;essai</p>
              <p className="text-xl font-bold text-purple-900 mt-1">
                {giftCode.trialDays} jours
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500">Utilisations</p>
          <p className="text-2xl font-bold mt-1">
            {giftCode.usedCount}
            {giftCode.maxUses && (
              <span className="text-gray-400 font-normal text-lg"> / {giftCode.maxUses}</span>
            )}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500">Date de création</p>
          <p className="text-2xl font-bold mt-1">
            {new Date(giftCode.createdAt).toLocaleDateString(locale, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500">Expiration</p>
          <p className="text-2xl font-bold mt-1">
            {giftCode.expiresAt
              ? new Date(giftCode.expiresAt).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Jamais"}
          </p>
        </div>
      </div>

      {/* Usages */}
      <div className="bg-white rounded-xl border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Historique des utilisations</h2>
        </div>
        {usages.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            Ce code n&apos;a pas encore été utilisé.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-3">
                  Client
                </th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-3">
                  Organisation
                </th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-3">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {usages.map((usage) => (
                <tr key={usage.id} className="border-b last:border-0">
                  <td className="px-6 py-4 text-sm">
                    {usage.customerEmail || usage.customerId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {usage.organizationId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(usage.createdAt).toLocaleDateString(locale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
