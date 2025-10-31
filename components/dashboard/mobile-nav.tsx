'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CreditCard,
  Repeat,
  Settings,
  Wallet,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', href: '/dashboard/transactions', icon: CreditCard },
  { name: 'Subscriptions', href: '/dashboard/subscriptions', icon: Repeat },
  { name: 'Withdrawals', href: '/dashboard/withdrawals', icon: Wallet },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 lg:hidden">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 group',
                isActive && 'bg-orange-50'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 mb-1',
                  isActive ? 'text-orange-600' : 'text-gray-500 group-hover:text-orange-600'
                )}
              />
              <span
                className={cn(
                  'text-xs',
                  isActive ? 'text-orange-600' : 'text-gray-500 group-hover:text-orange-600'
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}


