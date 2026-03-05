"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { giftCodesApi } from "@/lib/api/gift-codes";
import type { GiftCode, UpdateGiftCodeDto, GiftCodeStatus } from "@/types/gift-code";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function EditGiftCodePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [giftCode, setGiftCode] = useState<GiftCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [status, setStatus] = useState<GiftCodeStatus>("ACTIVE");

  const loadGiftCode = useCallback(async () => {
    try {
      const data = await giftCodesApi.findOne(id);
      setGiftCode(data);
      setCode(data.code);
      setDescription(data.description || "");
      setMaxUses(data.maxUses?.toString() || "");
      setExpiresAt(data.expiresAt ? data.expiresAt.split("T")[0] : "");
      setStatus(data.status);
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
    loadGiftCode();
  }, [loadGiftCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Le code est requis");
      return;
    }

    setIsSubmitting(true);

    try {
      const data: UpdateGiftCodeDto = {
        code: code.toUpperCase(),
        description: description || null,
        maxUses: maxUses ? parseInt(maxUses, 10) : null,
        expiresAt: expiresAt || null,
        status,
      };

      await giftCodesApi.update(id, data);
      toast.success("Code cadeau mis à jour !");
      router.push(`/admin/gift-codes/${id}`);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Erreur lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/gift-codes/${id}`}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Modifier le code cadeau</h1>
        <p className="mt-2 text-gray-600">
          Modifiez les paramètres du code cadeau.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border p-6">
        {/* Code */}
        <div className="space-y-2">
          <Label htmlFor="code">Code *</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="GIFT-XXXXXXXX"
            className="uppercase font-mono"
            required
          />
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
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as GiftCodeStatus)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ACTIVE">Actif</option>
            <option value="DISABLED">Désactivé</option>
          </select>
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

        {/* Usage info */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">
            <strong>Utilisations :</strong> {giftCode.usedCount}
            {giftCode.maxUses && ` / ${giftCode.maxUses}`}
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link href={`/admin/gift-codes/${id}`}>
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
