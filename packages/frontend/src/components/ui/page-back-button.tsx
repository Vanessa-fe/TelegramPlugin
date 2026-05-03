"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageBackButtonProps {
  href: string;
  label?: string;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

export function PageBackButton({
  href,
  label,
  className,
  variant = "ghost",
  size = "sm",
}: PageBackButtonProps) {
  const t = useTranslations("common");

  return (
    <Button asChild variant={variant} size={size} className={cn("w-fit", className)}>
      <Link href={href}>
        <ArrowLeft className="h-4 w-4" />
        {label ?? t("back")}
      </Link>
    </Button>
  );
}
