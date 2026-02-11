"use client";

import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/auth";
import {
  CreditCard,
  DollarSign,
  FileText,
  Globe,
  Hash,
  Key,
  LayoutDashboard,
  Megaphone,
  Package,
  Ticket,
  UserPlus,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    key: "payments",
    href: "/dashboard/payments",
    icon: DollarSign,
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
  const trialDaysLeft = 14;

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true; // No role restriction
    return user?.role && item.roles.includes(user.role);
  });

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
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border-custom p-4">
        <div className="rounded-lg bg-purple-50 p-4">
          <p className="text-sm font-medium text-purple-600">
            {tSidebar("proPlan")}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {tSidebar("trialDaysLeft", { count: trialDaysLeft })}
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-3 block text-center text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            {tSidebar("upgradeNow")} →
          </Link>
        </div>
      </div>
    </div>
  );
}
