'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertCircle,
  Building2,
  CreditCard,
  Gift,
  LayoutDashboard,
  Star,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations('admin');

  // SUPERADMIN navigation - organized by priority
  const navigation = [
    { key: 'home', href: '/admin', icon: LayoutDashboard },
    { key: 'vip', href: '/admin/vip', icon: Star },
    { key: 'payments', href: '/admin/payments', icon: AlertCircle },
    { key: 'creators', href: '/admin/creators', icon: Users },
    { key: 'organizations', href: '/admin/organizations', icon: Building2 },
    { key: 'giftCodes', href: '/admin/gift-codes', icon: Gift },
    { key: 'billing', href: '/admin/billing', icon: CreditCard },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-gray-50">
      <Link href="/admin" className="flex h-16 items-center border-b px-6">
        <Image src="/logo_160.svg" alt="Sublynk" width={32} height={32} />
        <span className="ml-2 text-xl font-bold text-purple-600">Sublynk</span>
      </Link>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
              )}
            >
              <item.icon className="h-5 w-5" />
              {t(`nav.${item.key}`)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
