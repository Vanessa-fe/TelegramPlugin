'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
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

// Mobile navigation items
const mobileNav = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Products', href: '/dashboard/products' },
  { name: 'Customers', href: '/dashboard/customers' },
  { name: 'Subscriptions', href: '/dashboard/subscriptions' },
  { name: 'Payments', href: '/dashboard/payments' },
  { name: 'Channels', href: '/dashboard/channels' },
  { name: 'Billing', href: '/dashboard/billing' },
];

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      toast.success('Logged out successfully');
      router.push('/login');
    } catch {
      toast.error('Error logging out');
    }
  };

  const handleAdmin = () => {
    router.push('/admin');
  };

  const isSuperadmin = user?.role === UserRole.SUPERADMIN;

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-[#E9E3EF] bg-white px-4 lg:px-6">
        {/* Mobile: Logo + Menu button */}
        <div className="flex items-center gap-4 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#6F6E77] hover:text-[#1A1523] transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          <Link href="/" className="text-lg font-bold text-[#1A1523]">
            TelegramPlugin
          </Link>
        </div>

        {/* Desktop: Page title placeholder */}
        <div className="hidden lg:block" />

        {/* User menu */}
        <div className="flex items-center gap-4">
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
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-[#1A1523]">
                    {displayName}
                  </p>
                  <p className="text-xs text-[#6F6E77]">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isSuperadmin && (
                <DropdownMenuItem onClick={handleAdmin}>
                  <Shield className="mr-2 h-4 w-4" />
                  Admin panel
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E9E3EF] bg-white">
          <nav className="px-4 py-4 space-y-1">
            {mobileNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  'text-[#6F6E77] hover:bg-purple-50 hover:text-purple-600'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
