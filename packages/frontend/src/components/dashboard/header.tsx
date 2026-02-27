'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { type Locale } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserRole } from '@/types/auth';
import { LogOut, Shield, User, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';

// Mobile navigation items
const mobileNav = [
  { key: 'dashboard', href: '/dashboard' },
  { key: 'products', href: '/dashboard/products' },
  { key: 'customers', href: '/dashboard/customers' },
  { key: 'subscriptions', href: '/dashboard/subscriptions' },
  { key: 'promote', href: '/dashboard/promote' },
  { key: 'coupons', href: '/dashboard/coupons' },
  { key: 'affiliates', href: '/dashboard/affiliates' },
  { key: 'payments', href: '/dashboard/payments' },
  { key: 'channels', href: '/dashboard/channels' },
  { key: 'access', href: '/dashboard/access' },
  { key: 'billing', href: '/dashboard/billing' },
];

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const locale = useLocale() as Locale;
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const tHeader = useTranslations('dashboard.header');

  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.email[0].toUpperCase() || 'U';

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(tCommon('logoutSuccess'));
      router.push('/login');
    } catch {
      toast.error(tCommon('logoutError'));
    }
  };

  const handleAdmin = () => {
    router.push('/admin');
  };

  const isSuperadmin = user?.role === UserRole.SUPERADMIN;

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border-custom bg-white px-4 lg:px-6">
        {/* Mobile: Logo + Menu button */}
        <div className="flex items-center gap-4 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          <Link href="/" className="inline-flex items-center" aria-label={tCommon('appName')}>
            <Image
              src="/android-chrome-192x192.png"
              alt={tCommon('appName')}
              width={32}
              height={32}
              className="rounded-md"
            />
          </Link>
        </div>

        {/* Desktop: Page title placeholder */}
        <div className="hidden lg:block" />

        {/* User menu */}
        <div className="flex items-center gap-4">
          <LocaleSwitcher currentLocale={locale} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full hover:bg-purple-50"
              >
                <Avatar>
                  <AvatarFallback className="bg-purple-600 text-white font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={12} className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-text-primary">
                    {displayName}
                  </p>
                  <p className="text-xs text-text-secondary">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isSuperadmin && (
                <DropdownMenuItem onClick={handleAdmin}>
                  <Shield className="mr-2 h-4 w-4" />
                  {tHeader('adminPanel')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                <User className="mr-2 h-4 w-4" />
                {tCommon('profile')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {tCommon('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border-custom bg-white">
          <nav className="px-4 py-4 space-y-1">
            {mobileNav.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  'text-text-secondary hover:bg-purple-50 hover:text-purple-600'
                )}
              >
                {tNav(item.key)}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
