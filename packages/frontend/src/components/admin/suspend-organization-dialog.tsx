"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SuspendOrganizationDialogProps {
  open: boolean;
  organizationName: string;
  isLoading?: boolean;
  defaultReason?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => Promise<void>;
}

export function SuspendOrganizationDialog({
  open,
  organizationName,
  isLoading = false,
  defaultReason = "",
  onOpenChange,
  onConfirm,
}: SuspendOrganizationDialogProps) {
  const [reason, setReason] = useState(defaultReason);

  useEffect(() => {
    if (open) {
      setReason(defaultReason);
    }
  }, [defaultReason, open, organizationName]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2 text-red-700">
              <Ban className="h-5 w-5" />
              Suspendre {organizationName}
            </span>
          </DialogTitle>
          <DialogDescription>
            Le compte ne sera pas supprimé. Son accès à Sublynk sera bloqué
            jusqu’à sa réactivation.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Cette action suspend toute l’organisation et pas uniquement la
              ligne affichée dans le tableau.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="suspension-reason">Raison (optionnelle)</Label>
          <Textarea
            id="suspension-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ex. compte de test, impayé, demande du client…"
            disabled={isLoading}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onConfirm(reason.trim() || undefined)}
            disabled={isLoading}
          >
            {isLoading ? "Suspension…" : "Confirmer la suspension"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
