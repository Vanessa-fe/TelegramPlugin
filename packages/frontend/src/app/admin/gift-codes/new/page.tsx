"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { giftCodesApi } from "@/lib/api/gift-codes";
import type { CreateGiftCodeDto } from "@/types/gift-code";
import { ArrowLeft, Sparkles, Gift, Crown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function generateRandomCode(prefix: string = "GIFT"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = `${prefix}-`;
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

type CodeType = "product" | "platform";

export default function NewGiftCodePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Code type selection
  const [codeType, setCodeType] = useState<CodeType>("platform");

  // Common fields
  const [code, setCode] = useState(generateRandomCode("TRIAL"));
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");

  // Platform trial fields
  const [platformPlanName, setPlatformPlanName] = useState<"starter" | "growth" | "pro">("pro");
  const [trialDays, setTrialDays] = useState<string>("30");

  function handleCodeTypeChange(type: CodeType) {
    setCodeType(type);
    if (type === "platform") {
      setCode(generateRandomCode("TRIAL"));
    } else {
      setCode(generateRandomCode("GIFT"));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Le code est requis");
      return;
    }

    if (codeType === "platform" && !trialDays) {
      toast.error("La durée de l'essai est requise");
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateGiftCodeDto = {
        code: code.toUpperCase(),
        description: description || undefined,
        maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
        expiresAt: expiresAt || undefined,
        isPlatformTrial: codeType === "platform",
        platformPlanName: codeType === "platform" ? platformPlanName : undefined,
        trialDays: codeType === "platform" ? parseInt(trialDays, 10) : undefined,
      };

      await giftCodesApi.create(data);
      toast.success("Code cadeau créé avec succès !");
      router.push("/admin/gift-codes");
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/gift-codes"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nouveau code cadeau</h1>
        <p className="mt-2 text-gray-600">
          Créez un code pour offrir un essai gratuit ou un accès produit.
        </p>
      </div>

      {/* Code type selector */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleCodeTypeChange("platform")}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            codeType === "platform"
              ? "border-purple-600 bg-purple-50"
              : "border-gray-200 hover:border-purple-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${codeType === "platform" ? "bg-purple-100" : "bg-gray-100"}`}>
              <Crown className={`h-5 w-5 ${codeType === "platform" ? "text-purple-600" : "text-gray-500"}`} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Essai Plateforme</p>
              <p className="text-sm text-gray-500">Pour les testeurs du SaaS</p>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => handleCodeTypeChange("product")}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            codeType === "product"
              ? "border-purple-600 bg-purple-50"
              : "border-gray-200 hover:border-purple-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${codeType === "product" ? "bg-purple-100" : "bg-gray-100"}`}>
              <Gift className={`h-5 w-5 ${codeType === "product" ? "text-purple-600" : "text-gray-500"}`} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Accès Produit</p>
              <p className="text-sm text-gray-500">Accès gratuit à un produit créateur</p>
            </div>
          </div>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border p-6">
        {/* Code */}
        <div className="space-y-2">
          <Label htmlFor="code">Code *</Label>
          <div className="flex gap-2">
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={codeType === "platform" ? "TRIAL-XXXXXXXX" : "GIFT-XXXXXXXX"}
              className="uppercase font-mono"
              required
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setCode(generateRandomCode(codeType === "platform" ? "TRIAL" : "GIFT"))}
              className="shrink-0"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Générer
            </Button>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (interne)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              codeType === "platform"
                ? "Ex: Essai Pro pour les beta testeurs..."
                : "Ex: Code pour le lancement..."
            }
            rows={2}
          />
        </div>

        {/* Platform trial specific fields */}
        {codeType === "platform" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="platformPlan">Plan à offrir *</Label>
              <select
                id="platformPlan"
                value={platformPlanName}
                onChange={(e) => setPlatformPlanName(e.target.value as "starter" | "growth" | "pro")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="pro">Pro (recommandé)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trialDays">Durée de l&apos;essai (jours) *</Label>
              <Input
                id="trialDays"
                type="number"
                min="1"
                max="365"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                placeholder="30"
                required
              />
              <p className="text-sm text-gray-500">
                Nombre de jours d&apos;accès au plan sélectionné.
              </p>
            </div>
          </>
        )}

        {/* Max uses */}
        <div className="space-y-2">
          <Label htmlFor="maxUses">Nombre maximum d&apos;utilisations</Label>
          <Input
            id="maxUses"
            type="number"
            min="1"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="Illimité"
          />
        </div>

        {/* Expiration */}
        <div className="space-y-2">
          <Label htmlFor="expiresAt">Date d&apos;expiration du code</Label>
          <Input
            id="expiresAt"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          <p className="text-sm text-gray-500">
            Date limite pour utiliser le code (pas la durée de l&apos;essai).
          </p>
        </div>

        {/* Info box */}
        <div className={`rounded-lg border p-4 ${
          codeType === "platform"
            ? "border-purple-200 bg-purple-50"
            : "border-blue-200 bg-blue-50"
        }`}>
          <p className={`text-sm ${codeType === "platform" ? "text-purple-700" : "text-blue-700"}`}>
            {codeType === "platform" ? (
              <>
                <strong>Essai Plateforme :</strong> Ce code permettra à un utilisateur de tester
                le plan <strong>{platformPlanName.charAt(0).toUpperCase() + platformPlanName.slice(1)}</strong> pendant{" "}
                <strong>{trialDays || "X"} jours</strong> gratuitement.
              </>
            ) : (
              <>
                <strong>Accès Produit :</strong> Ce code offrira un accès 100% gratuit
                à un produit créateur. L&apos;utilisateur pourra l&apos;utiliser au checkout.
              </>
            )}
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link href="/admin/gift-codes">
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSubmitting ? "Création..." : "Créer le code"}
          </Button>
        </div>
      </form>
    </div>
  );
}
