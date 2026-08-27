"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { authApi } from "@/lib/api/auth";
import { organizationsApi } from "@/lib/api/organizations";
import { toast } from "sonner";
import { Loader2, Save, Image as ImageIcon, Info } from "lucide-react";
import type { Organization } from "@/types/organization";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [hideBranding, setHideBranding] = useState(false);

  const isProPlan =
    organization?.platformPlan === "pro" &&
    (organization?.platformStatus === "ACTIVE" ||
      organization?.platformStatus === "TRIALING");

  useEffect(() => {
    loadOrganization();
  }, []);

  async function loadOrganization() {
    try {
      setLoading(true);
      const user = await authApi.getProfile();

      if (!user.organizationId) {
        toast.error("Aucune organisation associée");
        return;
      }

      const org = await organizationsApi.findOne(user.organizationId);
      setOrganization(org);

      const branding = org.metadata?.branding as { logoUrl?: string; hideSublynkBranding?: boolean } | undefined;
      setLogoUrl(branding?.logoUrl || "");
      setHideBranding(branding?.hideSublynkBranding || false);
    } catch (error) {
      console.error("Error loading organization:", error);
      toast.error("Erreur lors du chargement des paramètres");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!organization) return;

    try {
      setSaving(true);

      const updatedMetadata: Record<string, unknown> = {
        ...(organization.metadata || {}),
        branding: {
          logoUrl: logoUrl.trim() || undefined,
          hideSublynkBranding: isProPlan ? hideBranding : false,
        },
      };

      await organizationsApi.update(organization.id, {
        metadata: updatedMetadata,
      });

      toast.success("Paramètres sauvegardés avec succès");
      await loadOrganization();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-2 text-gray-600">
          Personnalisez l&apos;apparence de vos pages de paiement
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Personnalisation du checkout
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Ces paramètres s&apos;appliquent à vos pages de paiement publiques
            </p>
          </div>

          {/* Logo */}
          <div className="space-y-3">
            <Label htmlFor="logoUrl" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Logo (URL)
            </Label>
            <Input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://exemple.com/mon-logo.png"
              className="max-w-2xl"
            />
            <p className="text-xs text-gray-500">
              URL de votre logo (PNG, JPG ou SVG recommandé). Hauteur recommandée: 40-60px
            </p>
            {logoUrl && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg max-w-xs">
                <p className="text-xs text-gray-600 mb-2">Aperçu:</p>
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="max-h-16 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    toast.error("URL du logo invalide");
                  }}
                />
              </div>
            )}
          </div>

          {/* Hide Sublynk Branding */}
          <div className="space-y-3 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="hideBranding"
                  className="text-base font-medium"
                >
                  Masquer &quot;Powered by Sublynk&quot;
                </Label>
                <p className="text-sm text-gray-600">
                  Retire le branding Sublynk de vos pages de paiement
                </p>
              </div>
              <Switch
                id="hideBranding"
                checked={hideBranding}
                onCheckedChange={setHideBranding}
                disabled={!isProPlan}
              />
            </div>

            {!isProPlan && (
              <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
                <Info className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
                <div className="text-sm text-purple-900">
                  <p className="font-medium">Feature Plan Pro</p>
                  <p className="text-purple-700 mt-1">
                    Masquer le branding Sublynk est réservé aux utilisateurs du{" "}
                    <a
                      href="/dashboard/subscription"
                      className="underline font-medium hover:text-purple-900"
                    >
                      plan Pro
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder les paramètres
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
