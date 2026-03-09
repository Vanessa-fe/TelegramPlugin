"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { vipInvitationsApi } from "@/lib/api/vip-invitations";
import type { CreateVipInvitationDto } from "@/types/vip-invitation";
import { ArrowLeft, Star, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const PLAN_OPTIONS = [
  { value: "starter", label: "Starter", description: "Idéal pour débuter", recommended: false },
  { value: "growth", label: "Growth", description: "Pour les créateurs en croissance", recommended: false },
  { value: "pro", label: "Pro", description: "Toutes les fonctionnalités", recommended: true },
] as const;

const TRIAL_OPTIONS = [
  { value: 7, label: "7 jours", recommended: false },
  { value: 14, label: "14 jours", recommended: false },
  { value: 30, label: "30 jours", recommended: true },
  { value: 60, label: "60 jours", recommended: false },
  { value: 90, label: "90 jours", recommended: false },
] as const;

export default function NewVipInvitationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdEmail, setCreatedEmail] = useState("");

  // Form fields
  const [email, setEmail] = useState("");
  const [platformPlanName, setPlatformPlanName] = useState<"starter" | "growth" | "pro">("pro");
  const [trialDays, setTrialDays] = useState<number>(30);
  const [notes, setNotes] = useState("");

  // Email validation
  const [emailError, setEmailError] = useState("");

  function validateEmail(value: string): boolean {
    if (!value.trim()) {
      setEmailError("L'email est requis");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Format d'email invalide");
      return false;
    }
    setEmailError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateEmail(email)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateVipInvitationDto = {
        email: email.toLowerCase().trim(),
        platformPlanName,
        trialDays,
        notes: notes.trim() || undefined,
      };

      await vipInvitationsApi.create(data);
      setCreatedEmail(email);
      setShowSuccess(true);
      toast.success("Invitation VIP créée avec succès !");
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCreateAnother() {
    setShowSuccess(false);
    setEmail("");
    setNotes("");
    setCreatedEmail("");
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="bg-white rounded-xl border p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Invitation créée !</h2>
            <p className="mt-2 text-gray-600">
              Une invitation VIP a été créée pour <strong>{createdEmail}</strong>
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
            <p className="text-sm text-amber-700">
              <strong>Note :</strong> L&apos;envoi automatique par email n&apos;est pas encore actif.
              L&apos;invitation est en statut &quot;En attente&quot; dans la liste.
            </p>
          </div>
          <div className="flex justify-center gap-4 pt-4">
            <Button
              variant="outline"
              onClick={handleCreateAnother}
            >
              <Star className="h-4 w-4 mr-2" />
              Créer une autre
            </Button>
            <Link href="/admin/vip">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Voir les invitations
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/vip"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nouvelle invitation VIP</h1>
        <p className="mt-2 text-gray-600">
          Invitez un influenceur ou créateur à tester la plateforme gratuitement.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border p-6">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email de l&apos;influenceur *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) validateEmail(e.target.value);
            }}
            onBlur={() => validateEmail(email)}
            placeholder="influenceur@example.com"
            className={emailError ? "border-red-500 focus:ring-red-500" : ""}
            required
          />
          {emailError && (
            <p className="text-sm text-red-500">{emailError}</p>
          )}
        </div>

        {/* Plan selection */}
        <div className="space-y-3">
          <Label>Plan à offrir *</Label>
          <div className="grid grid-cols-3 gap-3">
            {PLAN_OPTIONS.map((plan) => (
              <button
                key={plan.value}
                type="button"
                onClick={() => setPlatformPlanName(plan.value)}
                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                  platformPlanName === plan.value
                    ? "border-purple-600 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                {plan.recommended && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                    Recommandé
                  </span>
                )}
                <p className="font-semibold text-gray-900">{plan.label}</p>
                <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Trial duration */}
        <div className="space-y-3">
          <Label>Durée de l&apos;essai gratuit *</Label>
          <div className="flex flex-wrap gap-2">
            {TRIAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTrialDays(option.value)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  trialDays === option.value
                    ? "border-purple-600 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-purple-300 text-gray-700"
                }`}
              >
                {option.label}
                {option.recommended && trialDays !== option.value && (
                  <span className="ml-1 text-xs text-gray-400">(rec.)</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes internes (optionnel)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Contact via DM Instagram, 50k followers..."
            rows={2}
          />
        </div>

        {/* Summary box */}
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <div className="flex items-start gap-3">
            <Star className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm text-purple-700">
                <strong>Récapitulatif :</strong> Cette invitation donnera accès au plan{" "}
                <strong>{platformPlanName.charAt(0).toUpperCase() + platformPlanName.slice(1)}</strong>{" "}
                pendant <strong>{trialDays} jours</strong> gratuitement.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link href="/admin/vip">
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSubmitting ? "Création..." : "Créer l'invitation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
