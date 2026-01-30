import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  FileText,
  Hash,
  Megaphone,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

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
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1523]">
          {t("title")}
        </h1>
        <p className="mt-1 text-[#6F6E77]">{t("welcome")}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl border-border-[#E9E3EF] p-5 lg:p-6"
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
                      : "text-[#6F6E77]"
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
            <p className="mt-4 text-2xl font-bold text-[#1A1523]">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-[#6F6E77]">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-[#1A1523] mb-4">
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
                  : "border-border-[#E9E3EF] hover:border-purple-200"
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
              <h3 className="mt-4 font-semibold text-[#1A1523] group-hover:text-purple-600 transition-colors">
                {action.name}
              </h3>
              <p className="mt-1 text-sm text-[#6F6E77]">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting started checklist */}
      <div className="bg-white rounded-xl border-border-[#E9E3EF] p-6">
        <h2 className="text-lg font-semibold text-[#1A1523] mb-4">
          {t("gettingStarted.title")}
        </h2>

        <div className="space-y-3">
          <ChecklistItem
            label={t("gettingStarted.accountCreated")}
            completed={true}
            href="/dashboard"
          />
          <ChecklistItem
            label={t("gettingStarted.connectPayment")}
            completed={false}
            href="/dashboard/billing"
          />
          <ChecklistItem
            label={t("gettingStarted.createProduct")}
            completed={false}
            href="/dashboard/products/new"
          />
          <ChecklistItem
            label={t("gettingStarted.connectChannel")}
            completed={false}
            href="/dashboard/channels/new"
          />
          <ChecklistItem
            label={t("gettingStarted.promoteProduct")}
            completed={false}
            href="/dashboard/promote"
          />
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({
  label,
  completed,
  href,
}: {
  label: string;
  completed: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group"
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
          completed
            ? "bg-purple-600 text-white"
            : "border-2 border-[#E9E3EF] group-hover:border-purple-300"
        }`}
      >
        {completed && (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <span
        className={`text-sm font-medium ${
          completed ? "text-[#6F6E77] line-through" : "text-[#1A1523]"
        }`}
      >
        {label}
      </span>
      {!completed && (
        <ArrowUpRight className="w-4 h-4 text-[#6F6E77] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </Link>
  );
}
