import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  FileText,
  Hash,
  Megaphone,
  Package,
  Ticket,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { GettingStartedChecklist } from "@/components/dashboard/getting-started-checklist";

type ChangeType = "positive" | "negative" | "neutral";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  const stats: Array<{
    name: string;
    value: string;
    change: string;
    changeType: ChangeType;
    icon: typeof DollarSign;
  }> = [
    {
      name: t("stats.revenue"),
      value: "0 €",
      change: "+0%",
      changeType: "neutral",
      icon: DollarSign,
    },
    {
      name: t("stats.activeSubscribers"),
      value: "0",
      change: "+0%",
      changeType: "neutral",
      icon: FileText,
    },
    {
      name: t("stats.totalCustomers"),
      value: "0",
      change: "+0%",
      changeType: "neutral",
      icon: Users,
    },
    {
      name: t("stats.conversionRate"),
      value: "0%",
      change: "+0%",
      changeType: "neutral",
      icon: TrendingUp,
    },
  ];

  const quickActions = [
    {
      name: t("quickActions.createProduct.title"),
      description: t("quickActions.createProduct.description"),
      href: "/dashboard/products/new",
      icon: Package,
    },
    {
      name: t("quickActions.promote.title"),
      description: t("quickActions.promote.description"),
      href: "/dashboard/promote",
      icon: Megaphone,
      highlight: true,
    },
    {
      name: t("quickActions.connectChannel.title"),
      description: t("quickActions.connectChannel.description"),
      href: "/dashboard/channels/new",
      icon: Hash,
    },
    {
      name: t("quickActions.billing.title"),
      description: t("quickActions.billing.description"),
      href: "/dashboard/billing",
      icon: CreditCard,
    },
    {
      name: t("quickActions.coupons.title"),
      description: t("quickActions.coupons.description"),
      href: "/dashboard/coupons",
      icon: Ticket,
    },
    {
      name: t("quickActions.affiliates.title"),
      description: t("quickActions.affiliates.description"),
      href: "/dashboard/affiliates",
      icon: UserPlus,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
          {t("title")}
        </h1>
        <p className="mt-1 text-text-secondary">{t("welcome")}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl border-border-custom p-5 lg:p-6"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <stat.icon className="h-5 w-5" />
              </div>
              <span
                className={`inline-flex items-center text-sm font-medium ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : stat.changeType === "negative"
                      ? "text-red-600"
                      : "text-text-secondary"
                }`}
              >
                {stat.changeType === "positive" && (
                  <ArrowUpRight className="h-4 w-4 mr-0.5" />
                )}
                {stat.changeType === "negative" && (
                  <ArrowDownRight className="h-4 w-4 mr-0.5" />
                )}
                {stat.change}
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-text-primary">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-text-secondary">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className={`group bg-white rounded-xl border p-5 lg:p-6 hover:shadow-md transition-all ${
                action.highlight
                  ? "border-purple-300 bg-purple-50/50 hover:border-purple-400"
                  : "border-border-custom hover:border-purple-200"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  action.highlight
                    ? "bg-purple-600 text-white group-hover:bg-purple-700"
                    : "bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
                }`}
              >
                <action.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-text-primary group-hover:text-purple-600 transition-colors">
                {action.name}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting started checklist */}
      <GettingStartedChecklist />
    </div>
  );
}
