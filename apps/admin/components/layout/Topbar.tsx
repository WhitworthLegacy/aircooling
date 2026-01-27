'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, User, LogOut, X } from 'lucide-react';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  businessName?: string;
  onLogout?: () => Promise<void>;
  searchPlaceholder?: string;
  searchRedirectPath?: string;
}

export default function Topbar({
  title,
  subtitle,
  businessName = 'Admin',
  onLogout,
  searchPlaceholder = 'Rechercher...',
  searchRedirectPath = '/dashboard/clients',
}: TopbarProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`${searchRedirectPath}?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    }
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-brand-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Left - Title */}
        <div className="flex items-center gap-4 lg:gap-0">
          <div className="lg:hidden w-10" />
          <div>
            {title && (
              <h1 className="text-lg font-semibold text-brand-dark">{title}</h1>
            )}
            {subtitle && (
              <p className="text-sm text-brand-muted">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div ref={searchRef} className="relative">
            <button
              onClick={() => {
                setSearchOpen(!searchOpen);
                setNotifOpen(false);
                setProfileOpen(false);
              }}
              className="p-2 rounded-lg text-brand-muted hover:text-brand-dark hover:bg-brand-surface transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {searchOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-brand-border p-3 z-50">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                    <input
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-brand-muted hover:text-brand-dark"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setSearchOpen(false);
                setProfileOpen(false);
              }}
              className="relative p-2 rounded-lg text-brand-muted hover:text-brand-dark hover:bg-brand-surface transition-colors"
            >
              <Bell className="w-5 h-5" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-brand-border z-50">
                <div className="p-3 border-b border-brand-border">
                  <h3 className="font-semibold text-brand-dark">Notifications</h3>
                </div>
                <div className="p-4 text-center text-brand-muted text-sm">
                  Aucune notification
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setSearchOpen(false);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 p-2 rounded-lg text-brand-muted hover:text-brand-dark hover:bg-brand-surface transition-colors"
            >
              <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-brand-primary" />
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-brand-border z-50">
                <div className="p-3 border-b border-brand-border">
                  <p className="font-semibold text-brand-dark text-sm">{businessName}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Se deconnecter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
