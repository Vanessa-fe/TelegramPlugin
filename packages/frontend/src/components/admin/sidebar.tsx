'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, CreditCard, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations('admin');
  const navigation = [
    { key: 'home', href: '/admin', icon: LayoutDashboard },
    { key: 'organizations', href: '/admin/organizations', icon: Building2 },
    { key: 'billing', href: '/admin/billing', icon: CreditCard },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-gray-50">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">{t('home.title')}</h1>
      </div>
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
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
