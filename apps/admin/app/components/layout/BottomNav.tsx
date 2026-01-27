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
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
};

interface BottomNavProps {
  items?: NavItem[];
  userRole?: string | null;
}

// Default navigation items
const defaultItems: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'RDV', href: '/dashboard/bookings', icon: Calendar },
  { label: 'CRM', href: '/dashboard/crm', icon: Kanban },
  { label: 'Devis', href: '/dashboard/quotes', icon: FileText },
  { label: 'Clients', href: '/dashboard/clients', icon: Users },
  { label: 'Messages', href: '/dashboard/conversations', icon: MessageSquare },
  { label: 'Stock', href: '/dashboard/inventory', icon: Package },
  { label: 'Finances', href: '/dashboard/finances', icon: DollarSign },
];

export default function BottomNav({
  items = defaultItems,
  userRole,
}: BottomNavProps) {
  const pathname = usePathname() || '';

  // Filter items based on user role
  const filteredItems = items.filter((item) => {
    if (!item.roles) return true;
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });

  return (
    <nav
      aria-label="Navigation principale"
      className="hidden lg:block fixed bottom-4 left-1/2 -translate-x-1/2 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* SVG gradient definition for icons */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="nav-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand-accent)" />
            <stop offset="100%" stopColor="var(--brand-primary)" />
          </linearGradient>
        </defs>
      </svg>

      <div className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-2xl bg-brand-dark/95 backdrop-blur-xl shadow-2xl shadow-brand-dark/25 border border-white/10">
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
                  ? 'bg-gradient-to-br from-brand-primary to-brand-accent text-white shadow-lg scale-105'
                  : 'bg-white/10 hover:bg-white/20 active:scale-95'
                }
              `}
            >
              <Icon
                className={`w-5 h-5 md:w-6 md:h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`}
                style={{ stroke: isActive ? 'white' : 'url(#nav-icon-gradient)' }}
              />
              <span
                className={
                  isActive
                    ? 'font-semibold text-white'
                    : 'font-semibold bg-gradient-to-r from-brand-accent to-brand-primary bg-clip-text text-transparent'
                }
              >
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
