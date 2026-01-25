import Link from 'next/link';
import {
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  CreditCard,
  Hash,
} from 'lucide-react';

type ChangeType = 'positive' | 'negative' | 'neutral';

const stats: Array<{
  name: string;
  value: string;
  change: string;
  changeType: ChangeType;
  icon: typeof DollarSign;
}> = [
  {
    name: 'Total Revenue',
    value: '€0.00',
    change: '+0%',
    changeType: 'neutral',
    icon: DollarSign,
  },
  {
    name: 'Active Subscriptions',
    value: '0',
    change: '+0%',
    changeType: 'neutral',
    icon: FileText,
  },
  {
    name: 'Total Customers',
    value: '0',
    change: '+0%',
    changeType: 'neutral',
    icon: Users,
  },
  {
    name: 'Conversion Rate',
    value: '0%',
    change: '+0%',
    changeType: 'neutral',
    icon: TrendingUp,
  },
];

const quickActions = [
  {
    name: 'Create Product',
    description: 'Set up a new subscription or one-time product',
    href: '/dashboard/products/new',
    icon: Package,
  },
  {
    name: 'Connect Channel',
    description: 'Link a Telegram, Discord, or WhatsApp channel',
    href: '/dashboard/channels/new',
    icon: Hash,
  },
  {
    name: 'Setup Billing',
    description: 'Connect your Stripe account to receive payments',
    href: '/dashboard/billing',
    icon: CreditCard,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1523]">
          Dashboard
        </h1>
        <p className="mt-1 text-[#6F6E77]">
          Welcome back! Here&apos;s an overview of your business.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl border border-[#E9E3EF] p-5 lg:p-6"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <stat.icon className="h-5 w-5" />
              </div>
              <span
                className={`inline-flex items-center text-sm font-medium ${
                  stat.changeType === 'positive'
                    ? 'text-green-600'
                    : stat.changeType === 'negative'
                      ? 'text-red-600'
                      : 'text-[#6F6E77]'
                }`}
              >
                {stat.changeType === 'positive' && (
                  <ArrowUpRight className="h-4 w-4 mr-0.5" />
                )}
                {stat.changeType === 'negative' && (
                  <ArrowDownRight className="h-4 w-4 mr-0.5" />
                )}
                {stat.change}
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-[#1A1523]">{stat.value}</p>
            <p className="mt-1 text-sm text-[#6F6E77]">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-[#1A1523] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="group bg-white rounded-xl border border-[#E9E3EF] p-5 lg:p-6 hover:border-purple-200 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <action.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-[#1A1523] group-hover:text-purple-600 transition-colors">
                {action.name}
              </h3>
              <p className="mt-1 text-sm text-[#6F6E77]">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting started checklist */}
      <div className="bg-white rounded-xl border border-[#E9E3EF] p-6">
        <h2 className="text-lg font-semibold text-[#1A1523] mb-4">
          Getting Started
        </h2>
        <div className="space-y-3">
          <ChecklistItem
            label="Create your account"
            completed={true}
            href="/dashboard"
          />
          <ChecklistItem
            label="Connect your Stripe account"
            completed={false}
            href="/dashboard/billing"
          />
          <ChecklistItem
            label="Create your first product"
            completed={false}
            href="/dashboard/products/new"
          />
          <ChecklistItem
            label="Connect a Telegram channel"
            completed={false}
            href="/dashboard/channels/new"
          />
          <ChecklistItem
            label="Share your payment link"
            completed={false}
            href="/dashboard/products"
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
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          completed
            ? 'bg-purple-600 text-white'
            : 'border-2 border-[#E9E3EF] group-hover:border-purple-300'
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
          completed ? 'text-[#6F6E77] line-through' : 'text-[#1A1523]'
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
