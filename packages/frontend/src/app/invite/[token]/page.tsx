"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { teamApi } from "@/lib/api/team";
import type { TeamPublicInvite } from "@/types/team";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [invite, setInvite] = useState<TeamPublicInvite | null>(null);
  const [isLoadingInvite, setIsLoadingInvite] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadInvite() {
      try {
        const resolved = await params;
        if (cancelled) return;

        setToken(resolved.token);

        const inviteData = await teamApi.getPublicInvite(resolved.token);
        if (!cancelled) {
          setInvite(inviteData);
        }
      } catch (error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };

        if (!cancelled) {
          setInvite({
            valid: false,
            reason: "invalid",
            message: axiosError.response?.data?.message || "Invitation invalide",
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingInvite(false);
        }
      }
    }

    loadInvite();

    return () => {
      cancelled = true;
    };
  }, [params]);

  async function handleAcceptInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;

    setIsSubmitting(true);

    try {
      await teamApi.acceptInvite({
        token,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        password: password.trim() || undefined,
      });

      toast.success("Invitation acceptée. Connecte-toi pour accéder au dashboard.");
      router.push("/login");
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || "Impossible d'accepter l'invitation");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingInvite) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-text-secondary">Chargement de l&apos;invitation...</p>
        </div>
      </div>
    );
  }

  if (!invite?.valid) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border-custom bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-text-primary">Invitation indisponible</h1>
          <p className="mt-2 text-text-secondary">{invite?.message || "Invitation invalide"}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login">
              <Button variant="outline">Connexion</Button>
            </Link>
            <Link href="/">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">Accueil</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-border-custom bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary">Rejoindre l&apos;équipe</h1>
        <p className="mt-2 text-text-secondary">
          Tu as été invité(e) à rejoindre <strong>{invite.organizationName}</strong>.
        </p>

        <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm">
          <p><strong>Email :</strong> {invite.email}</p>
          <p><strong>Rôle :</strong> {invite.role}</p>
        </div>

        <form onSubmit={handleAcceptInvite} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom (optionnel)</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                disabled={isSubmitting}
                placeholder="Prénom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom (optionnel)</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                disabled={isSubmitting}
                placeholder="Nom"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              placeholder="Requis si c'est ton premier accès"
            />
            <p className="text-xs text-text-secondary">
              Si tu as déjà un compte Sublynk avec cet email, tu peux laisser vide.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Validation..." : "Accepter l'invitation"}
          </Button>
        </form>
      </div>
    </div>
  );
}
