"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChannelProvider,
  type Channel,
  type CreateChannelDto,
} from "@/types/channel";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const channelFormSchema = z.object({
  provider: z.nativeEnum(ChannelProvider),
  externalId: z.string().min(1, "L'ID externe est requis"),
  title: z.string().optional(),
  username: z.string().optional(),
  inviteLink: z.string().url("URL invalide").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

type ChannelFormData = z.infer<typeof channelFormSchema>;

interface ChannelFormProps {
  organizationId: string;
  channel?: Channel;
  onSubmit: (data: CreateChannelDto) => void | Promise<void>;
}

const providerOptions = [
  { value: ChannelProvider.TELEGRAM, label: "Telegram" },
  { value: ChannelProvider.DISCORD, label: "Discord" },
];

export function ChannelForm({
  organizationId,
  channel,
  onSubmit,
}: ChannelFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ChannelFormData>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: channel
      ? {
          provider: channel.provider,
          externalId: channel.externalId,
          title: channel.title || "",
          username: channel.username || "",
          inviteLink: channel.inviteLink || "",
          isActive: channel.isActive,
        }
      : {
          provider: ChannelProvider.TELEGRAM,
          isActive: true,
        },
  });

  const selectedProvider = watch("provider");

  async function onSubmitForm(data: ChannelFormData) {
    const payload: CreateChannelDto = {
      organizationId,
      provider: data.provider,
      externalId: data.externalId,
      title: data.title || undefined,
      username: data.username || undefined,
      inviteLink: data.inviteLink || undefined,
      isActive: data.isActive ?? true,
    };

    await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <div className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Informations du channel</h2>

        <div>
          <Label htmlFor="provider">Provider *</Label>
          <Select
            value={selectedProvider}
            onValueChange={(value: string) =>
              setValue("provider", value as ChannelProvider)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un provider" />
            </SelectTrigger>
            <SelectContent>
              {providerOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.provider && (
            <p className="mt-1 text-sm text-red-600">
              {errors.provider.message}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Plateforme du channel (Telegram ou Discord)
          </p>
        </div>

        <div>
          <Label htmlFor="externalId">ID externe du channel *</Label>
          <Input
            id="externalId"
            {...register("externalId")}
            placeholder="-1003487441463"
          />
          {errors.externalId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.externalId.message}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            L&apos;ID numérique du channel Telegram (commence par -100)
          </p>
        </div>

        <div>
          <Label htmlFor="title">Titre du channel</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="Mon Channel VIP"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            {...register("username")}
            placeholder="mon_channel_vip"
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">
              {errors.username.message}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Username du channel (sans @)
          </p>
        </div>

        <div>
          <Label htmlFor="inviteLink">Lien d&apos;invitation</Label>
          <Input
            id="inviteLink"
            {...register("inviteLink")}
            placeholder="https://t.me/+AbcDefGhiJkl"
          />
          {errors.inviteLink && (
            <p className="mt-1 text-sm text-red-600">
              {errors.inviteLink.message}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Lien d&apos;invitation permanent du channel
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            {...register("isActive")}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Channel actif
          </Label>
        </div>
      </div>

      <div className="rounded-lg border bg-blue-50 p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Comment trouver l&apos;ID de votre channel Telegram
          </h3>
          <div className="space-y-4 text-sm text-blue-900">
            <div className="bg-white/50 rounded p-3 space-y-2">
              <p className="font-medium">Méthode 1: Via un bot (Recommandé)</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>
                  Transférez un message de votre channel à{" "}
                  <span className="font-mono bg-white px-1 rounded">
                    @userinfobot
                  </span>
                </li>
                <li>
                  Le bot vous répondra avec l&apos;ID du channel (commence par
                  -100)
                </li>
                <li>Copiez cet ID dans le champ ci-dessus</li>
              </ol>
            </div>

            <div className="bg-white/50 rounded p-3 space-y-2">
              <p className="font-medium">Méthode 2: Via l&apos;API Telegram</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>
                  Ajoutez le bot{" "}
                  <span className="font-mono bg-white px-1 rounded">
                    @getidsbot
                  </span>{" "}
                  à votre channel
                </li>
                <li>Le bot enverra automatiquement l&apos;ID du channel</li>
                <li>Supprimez le bot après avoir récupéré l&apos;ID</li>
              </ol>
            </div>

            <div className="bg-white/50 rounded p-3 space-y-2">
              <p className="font-medium">
                Méthode 3: Via le lien d&apos;invitation
              </p>
              <p className="ml-2">
                Si votre lien est{" "}
                <span className="font-mono bg-white px-1 rounded">
                  https://t.me/joinchat/XXXXXX
                </span>
                , vous devez d&apos;abord convertir ce lien en ID numérique avec
                un bot.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-200 pt-3">
          <p className="text-xs text-blue-700">
            ⚠️ <span className="font-medium">Important:</span> Assurez-vous que
            votre bot Telegram (configuré dans les variables
            d&apos;environnement) est administrateur de ce channel avec les
            permissions nécessaires pour inviter des utilisateurs.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Enregistrement..."
            : channel
              ? "Mettre à jour"
              : "Ajouter le channel"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
