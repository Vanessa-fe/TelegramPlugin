"use client";

import { useAuth } from "@/contexts/auth-context";
import { channelsApi } from "@/lib/api/channels";
import { platformSubscriptionApi } from "@/lib/api/platform-subscription";
import { cn } from "@/lib/utils";
import { ChannelProvider } from "@/types/channel";
import { UserRole } from "@/types/auth";
import type { PlatformSubscriptionStatus } from "@/types/platform-subscription";
import {
  CreditCard,
  Coins,
  FileText,
  Globe,
  Hash,
  Key,
  LayoutDashboard,
  Megaphone,
  Package,
  Shield,
  Ticket,
  UserPlus,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "pageBuilder", href: "/dashboard/page-builder", icon: Globe },
  { key: "products", href: "/dashboard/products", icon: Package },
  { key: "customers", href: "/dashboard/customers", icon: Users },
  { key: "subscriptions", href: "/dashboard/subscriptions", icon: FileText },
  { key: "promote", href: "/dashboard/promote", icon: Megaphone },
  { key: "coupons", href: "/dashboard/coupons", icon: Ticket },
  { key: "affiliates", href: "/dashboard/affiliates", icon: UserPlus },
  {
    key: "team",
    href: "/dashboard/team",
    icon: Shield,
    roles: [UserRole.SUPERADMIN, UserRole.ORG_ADMIN],
  },
  {
    key: "payments",
    href: "/dashboard/payments",
    icon: Coins,
    roles: [UserRole.SUPERADMIN, UserRole.SUPPORT, UserRole.ORG_ADMIN],
  },
  { key: "channels", href: "/dashboard/channels", icon: Hash },
  { key: "access", href: "/dashboard/access", icon: Key },
  { key: "billing", href: "/dashboard/billing", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const tSidebar = useTranslations("sidebar");
  const [pendingRemoveCount, setPendingRemoveCount] = useState(0);
  const [planName, setPlanName] = useState<string | null>(null);
  const [planStatus, setPlanStatus] = useState<PlatformSubscriptionStatus | null>(
    null,
  );
  const [isPlanLoading, setIsPlanLoading] = useState(true);

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true; // No role restriction
    return user?.role && item.roles.includes(user.role);
  });

  useEffect(() => {
    let cancelled = false;

    const loadPendingRemovals = async () => {
      if (!user) return;
      try {
        const channels = await channelsApi.findAll();
        const whatsappChannels = channels.filter(
          (channel) => channel.provider === ChannelProvider.WHATSAPP,
        );

        if (whatsappChannels.length === 0) {
          if (!cancelled) {
            setPendingRemoveCount(0);
          }
          return;
        }

        const counts = await Promise.all(
          whatsappChannels.map(async (channel) => {
            try {
              const accesses = await channelsApi.getAccesses(channel.id);
              return accesses.filter(
                (access) => access.status === "REVOKE_PENDING",
              ).length;
            } catch {
              return 0;
            }
          }),
        );

        if (!cancelled) {
          setPendingRemoveCount(counts.reduce((sum, value) => sum + value, 0));
        }
      } catch {
        if (!cancelled) {
          setPendingRemoveCount(0);
        }
      }
    };

    loadPendingRemovals();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const loadPlatformSubscription = async () => {
      if (!user) {
        if (!cancelled) {
          setPlanName(null);
          setPlanStatus(null);
          setIsPlanLoading(false);
        }
        return;
      }

      try {
        const subscription = await platformSubscriptionApi.getSubscription();
        if (!cancelled) {
          setPlanName(subscription?.plan?.displayName ?? null);
          setPlanStatus(subscription?.status ?? null);
        }
      } catch {
        if (!cancelled) {
          setPlanName(null);
          setPlanStatus(null);
        }
      } finally {
        if (!cancelled) {
          setIsPlanLoading(false);
        }
      }
    };

    loadPlatformSubscription();

    return () => {
      cancelled = true;
    };
  }, [user]);

  function getPlanStatusLabel(status: PlatformSubscriptionStatus | null): string {
    if (!status) return tSidebar("planStatusNone");
    return tSidebar(`planStatus.${status}`);
  }

  return (
    <div className="hidden lg:flex h-full w-64 flex-col border-r border-border-custom bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border-custom px-6">
        <Link href="/" className="text-xl font-bold text-text-primary">
          {tCommon("appName")}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-purple-600 text-white"
                  : "text-text-secondary hover:bg-purple-50 hover:text-purple-600",
              )}
            >
              <item.icon className="h-5 w-5" />
              {tNav(item.key)}
              {item.key === "channels" && pendingRemoveCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                  {pendingRemoveCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border-custom p-4">
        <div className="rounded-lg bg-purple-50 p-4">
          <p className="text-sm font-medium text-purple-600">{tSidebar("currentPlan")}</p>
          <p className="mt-1 text-sm font-semibold text-text-primary">
            {isPlanLoading ? tCommon("loading") : (planName ?? tSidebar("noPlan"))}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {isPlanLoading ? tCommon("loading") : getPlanStatusLabel(planStatus)}
          </p>
          <Link
            href="/dashboard/subscription"
            className="mt-3 block text-center text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            {planStatus === "ACTIVE" || planStatus === "TRIALING"
              ? tSidebar("manageSubscription")
              : tSidebar("upgradeNow")}{" "}
            →
          </Link>
        </div>
      </div>
    </div>
  );
}
