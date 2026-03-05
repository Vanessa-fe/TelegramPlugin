"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { giftCodesApi } from "@/lib/api/gift-codes";
import type { CreateGiftCodeDto } from "@/types/gift-code";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function generateRandomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GIFT-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function NewGiftCodePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [code, setCode] = useState(generateRandomCode());
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Le code est requis");
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateGiftCodeDto = {
        code: code.toUpperCase(),
        description: description || undefined,
        maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
        expiresAt: expiresAt || undefined,
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
          Créez un code pour offrir des accès gratuits à vos utilisateurs.
        </p>
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
              placeholder="GIFT-XXXXXXXX"
              className="uppercase font-mono"
              required
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setCode(generateRandomCode())}
              className="shrink-0"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Générer
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Le code que les utilisateurs devront saisir au checkout.
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (interne)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Code pour le lancement, Code pour les beta testeurs..."
            rows={2}
          />
          <p className="text-sm text-gray-500">
            Note interne pour vous rappeler l&apos;usage de ce code.
          </p>
        </div>

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
          <p className="text-sm text-gray-500">
            Laissez vide pour un nombre illimité d&apos;utilisations.
          </p>
        </div>

        {/* Expiration */}
        <div className="space-y-2">
          <Label htmlFor="expiresAt">Date d&apos;expiration</Label>
          <Input
            id="expiresAt"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          <p className="text-sm text-gray-500">
            Laissez vide pour que le code n&apos;expire jamais.
          </p>
        </div>

        {/* Info box */}
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <p className="text-sm text-purple-700">
            <strong>Note :</strong> Ce code offrira un accès 100% gratuit.
            L&apos;utilisateur pourra l&apos;utiliser au checkout pour obtenir un accès sans paiement.
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
