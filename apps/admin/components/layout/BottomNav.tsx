'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Kanban,
  Package,
  DollarSign,
  FileText,
  MessageSquare,
  Settings,
  UserCog,
  Wrench,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { useUserRole } from '@/lib/useUserRole';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
};

// Navigation items with role-based access
const navItems: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'RDV', href: '/dashboard/appointments', icon: Calendar },
  { label: 'Interventions', href: '/dashboard/interventions', icon: Wrench, roles: ['admin', 'super_admin'] },
  { label: 'Missions', href: '/dashboard/missions', icon: MapPin, roles: ['admin', 'super_admin'] },
  { label: 'CRM', href: '/dashboard/crm', icon: Kanban, roles: ['admin', 'super_admin'] },
  { label: 'Devis', href: '/dashboard/devis', icon: FileText, roles: ['admin', 'super_admin'] },
  { label: 'Clients', href: '/dashboard/clients', icon: Users, roles: ['admin', 'super_admin'] },
  { label: 'Messages', href: '/dashboard/conversations', icon: MessageSquare, roles: ['admin', 'super_admin'] },
  { label: 'Stock', href: '/dashboard/inventory', icon: Package, roles: ['admin', 'super_admin'] },
  { label: 'Finances', href: '/dashboard/finances', icon: DollarSign, roles: ['super_admin'] },
  { label: 'Users', href: '/dashboard/users', icon: UserCog, roles: ['super_admin'] },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['super_admin'] },
];

export default function BottomNav() {
  const pathname = usePathname() || '';
  const { role } = useUserRole();

  // Filter items based on user role
  const filteredItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role);
  });

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100%-2rem)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-2xl bg-white/95 backdrop-blur-xl shadow-lg border border-airBorder overflow-x-auto scrollbar-hide">
        {filteredItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex flex-col items-center justify-center gap-0.5 md:gap-1
                px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl
                text-[10px] md:text-xs font-medium tracking-wide uppercase whitespace-nowrap
                transition-all duration-300 ease-out min-w-[50px] md:min-w-[60px]
                ${isActive
                  ? 'bg-gradient-to-r from-airPrimary to-airAccent text-white shadow-md scale-105'
                  : 'text-airMuted hover:bg-airSurface hover:text-airDark active:scale-95'
                }
              `}
            >
              <Icon
                className={`w-5 h-5 md:w-6 md:h-6 ${isActive ? 'stroke-[2.5] text-white' : 'stroke-[1.5]'}`}
              />
              <span className={isActive ? 'font-semibold text-white' : 'font-medium'}>

                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
