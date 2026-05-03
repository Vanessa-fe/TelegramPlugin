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
import { useAuth } from "@/contexts/auth-context";
import { affiliateProgramApi } from "@/lib/api/affiliate-program";
import { productsApi } from "@/lib/api/products";
import type { Product } from "@/types/product";
import type {
  AffiliateProgram,
  CreateAffiliateProgramDto,
  UpdateAffiliateProgramDto,
  AffiliateProgramStatus,
  CommissionAppliesTo,
} from "@/types/affiliate";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Settings, Info } from "lucide-react";
import Link from "next/link";

export default function AffiliateProgramPage() {
  const t = useTranslations("affiliates");
  const { user } = useAuth();
  const [_program, setProgram] = useState<AffiliateProgram | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    commissionValue: 10,
    attributionWindowDays: 30,
    validationDelayDays: 14,
    appliesTo: "ALL_PRODUCTS" as CommissionAppliesTo,
    productIds: [] as string[],
    status: "ACTIVE" as AffiliateProgramStatus,
  });

  const loadData = useCallback(async () => {
    try {
      const [programData, productsData] = await Promise.all([
        affiliateProgramApi.findOne(),
        productsApi.findAll(),
      ]);

      setProducts(productsData);

      if (programData) {
        setProgram(programData);
        setFormData({
          name: programData.name,
          commissionValue: programData.commissionValue,
          attributionWindowDays: programData.attributionWindowDays,
          validationDelayDays: programData.validationDelayDays,
          appliesTo: programData.appliesTo,
          productIds: programData.productIds,
          status: programData.status,
        });
      } else {
        setIsCreating(true);
      }
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(axiosError.response?.data?.message || t("program.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (isCreating) {
        const dto: CreateAffiliateProgramDto = {
          organizationId: user?.organizationId ?? "",
          ...formData,
        };
        const created = await affiliateProgramApi.create(dto);
        setProgram(created);
        setIsCreating(false);
        toast.success(t("program.createSuccess"));
      } else {
        const dto: UpdateAffiliateProgramDto = { ...formData };
        const updated = await affiliateProgramApi.update(dto);
        setProgram(updated);
        toast.success(t("program.updateSuccess"));
      }
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message ||
          (isCreating ? t("program.createError") : t("program.updateError"))
      );
    } finally {
      setIsSaving(false);
    }
  }

  function toggleProduct(productId: string) {
    setFormData((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter((id) => id !== productId)
        : [...prev.productIds, productId],
    }));
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-text-secondary">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/affiliates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("back")}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
            {t("program.title")}
          </h1>
          <p className="mt-1 text-text-secondary">{t("program.subtitle")}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-border-custom p-6 space-y-6">
          {/* Program Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t("program.form.name")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder={t("program.form.namePlaceholder")}
              required
            />
          </div>

          {/* Commission Rate */}
          <div className="space-y-2">
            <Label htmlFor="commissionValue">
              {t("program.form.commissionRate")}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="commissionValue"
                type="number"
                min={1}
                max={100}
                value={formData.commissionValue}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    commissionValue: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="w-24"
                required
              />
              <span className="text-text-secondary">%</span>
            </div>
            <p className="text-sm text-text-secondary">
              {t("program.form.commissionRateHelp")}
            </p>
          </div>

          {/* Attribution Window */}
          <div className="space-y-2">
            <Label htmlFor="attributionWindowDays">
              {t("program.form.attributionWindow")}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="attributionWindowDays"
                type="number"
                min={1}
                max={90}
                value={formData.attributionWindowDays}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    attributionWindowDays: parseInt(e.target.value, 10) || 30,
                  }))
                }
                className="w-24"
              />
              <span className="text-text-secondary">{t("program.form.days")}</span>
            </div>
            <p className="text-sm text-text-secondary">
              {t("program.form.attributionWindowHelp")}
            </p>
          </div>

          {/* Validation Delay */}
          <div className="space-y-2">
            <Label htmlFor="validationDelayDays">
              {t("program.form.validationDelay")}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="validationDelayDays"
                type="number"
                min={0}
                max={60}
                value={formData.validationDelayDays}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    validationDelayDays: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="w-24"
              />
              <span className="text-text-secondary">{t("program.form.days")}</span>
            </div>
            <p className="text-sm text-text-secondary">
              {t("program.form.validationDelayHelp")}
            </p>
          </div>

          {/* Applies To */}
          <div className="space-y-2">
            <Label>{t("program.form.appliesTo")}</Label>
            <div className="w-full max-w-xs">
              <Select
                value={formData.appliesTo}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, appliesTo: value as CommissionAppliesTo }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_PRODUCTS">
                    {t("program.form.allProducts")}
                  </SelectItem>
                  <SelectItem value="SPECIFIC_PRODUCTS">
                    {t("program.form.specificProducts")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product Selection */}
          {formData.appliesTo === "SPECIFIC_PRODUCTS" && (
            <div className="space-y-3">
              <Label>{t("program.form.selectProducts")}</Label>
              {products.length === 0 ? (
                <div className="text-sm text-text-secondary bg-surface p-4 rounded-lg">
                  <Info className="h-4 w-4 inline mr-2" />
                  {t("program.form.noProducts")}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border border-border-custom rounded-lg p-3">
                  {products.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-surface cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.productIds.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                        className="rounded border-border-custom"
                      />
                      <span className="text-sm text-text-primary">
                        {product.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label>{t("program.form.status")}</Label>
            <div className="w-full max-w-xs">
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value as AffiliateProgramStatus }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    {t("program.form.statusActive")}
                  </SelectItem>
                  <SelectItem value="PAUSED">
                    {t("program.form.statusPaused")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-text-secondary">
              {t("program.form.statusHelp")}
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/affiliates">
            <Button variant="outline" type="button">
              {t("cancel")}
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                {t("saving")}
              </>
            ) : isCreating ? (
              <>
                <Settings className="mr-2 h-4 w-4" />
                {t("program.create")}
              </>
            ) : (
              <>
                <Settings className="mr-2 h-4 w-4" />
                {t("program.save")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
