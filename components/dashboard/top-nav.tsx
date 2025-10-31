'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Plus } from 'lucide-react';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';

interface TopNavProps {
  user: {
    email: string;
    merchant?: {
      businessName: string;
    } | null;
  };
  onCreatePayment?: () => void;
}

export function TopNav({ user, onCreatePayment }: TopNavProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
  }

  const initials = user.email
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {user.merchant?.businessName || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-x-4">
            {onCreatePayment && (
              <Button onClick={onCreatePayment} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Payment
              </Button>
            )}
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger>
                <Avatar className="cursor-pointer h-8 w-8">
                  <AvatarFallback className="bg-orange-100 text-orange-600">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/settings')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}


