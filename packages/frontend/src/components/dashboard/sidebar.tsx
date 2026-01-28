'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CreditCard,
  LayoutDashboard,
  Package,
  Users,
  FileText,
  DollarSign,
  Hash,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types/auth';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Subscriptions', href: '/dashboard/subscriptions', icon: FileText },
  { name: 'Payments', href: '/dashboard/payments', icon: DollarSign, roles: [UserRole.SUPERADMIN, UserRole.SUPPORT] },
  { name: 'Channels', href: '/dashboard/channels', icon: Hash },
  { name: 'Entitlements', href: '/dashboard/entitlements', icon: Key },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true; // No role restriction
    return user?.role && item.roles.includes(user.role);
  });

  return (
    <div className="hidden lg:flex h-full w-64 flex-col border-r border-[#E9E3EF] bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-[#E9E3EF] px-6">
        <Link href="/" className="text-xl font-bold text-[#1A1523]">
          TelegramPlugin
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'text-[#6F6E77] hover:bg-purple-50 hover:text-purple-600'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#E9E3EF] p-4">
        <div className="rounded-lg bg-purple-50 p-4">
          <p className="text-sm font-medium text-purple-600">Pro Plan</p>
          <p className="mt-1 text-xs text-[#6F6E77]">14 days left in trial</p>
          <Link
            href="/dashboard/billing"
            className="mt-3 block text-center text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            Upgrade now →
          </Link>
        </div>
      </div>
    </div>
  );
}
