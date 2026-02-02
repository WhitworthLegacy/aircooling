'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Kanban,
  LogOut,
  Menu,
  X,
  Package,
  DollarSign,
  FileText,
  MessageSquare,
  ShoppingBag,
  FileEdit,
  Settings,
  PenLine,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
};

interface SidebarProps {
  navigation?: NavItem[];
  logoSrc?: string;
  logoAlt?: string;
  userRole?: string | null;
  onLogout?: () => Promise<void>;
}

// Default navigation items
const defaultNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'CRM', href: '/dashboard/crm', icon: Kanban, roles: ['admin', 'super_admin'] },
  { name: 'Clients', href: '/dashboard/clients', icon: Users, roles: ['admin', 'super_admin'] },
  { name: 'Rendez-vous', href: '/dashboard/bookings', icon: Calendar },
  { name: 'Rapport', href: '/dashboard/tech/report', icon: PenLine },
  { name: 'Devis', href: '/dashboard/quotes', icon: FileText, roles: ['admin', 'super_admin'] },
  { name: 'Messages', href: '/dashboard/conversations', icon: MessageSquare, roles: ['admin', 'super_admin'] },
  { name: 'Produits', href: '/dashboard/products', icon: ShoppingBag, roles: ['admin', 'super_admin'] },
  { name: 'Commandes', href: '/dashboard/orders', icon: Package, roles: ['admin', 'super_admin'] },
  { name: 'Blog', href: '/dashboard/blog', icon: FileEdit, roles: ['admin', 'super_admin'] },
  { name: 'Finances', href: '/dashboard/finances', icon: DollarSign, roles: ['super_admin'] },
  { name: 'Parametres', href: '/dashboard/settings', icon: Settings, roles: ['super_admin'] },
];

export default function Sidebar({
  navigation = defaultNavigation,
  logoSrc = '/images/logo.png',
  logoAlt = 'Logo',
  userRole,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true;
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });

  async function handleLogout() {
    if (onLogout) {
      await onLogout();
    }
    router.push('/login');
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-white/10 px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img
            src={logoSrc}
            alt={logoAlt}
            className="h-8 w-auto brightness-0 invert"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-6 px-3">
        <ul className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-brand-accent text-white shadow-sm'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Deconnexion
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-brand-dark text-white shadow-md"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-brand-dark
          transform transition-transform duration-300 ease-in-out
          flex flex-col
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 bg-brand-dark flex-col">
        <SidebarContent />
      </aside>
    </>
  );
}
