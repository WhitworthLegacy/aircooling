'use client';

import { BottomNav } from '@/components/layout';
import { ToastProvider } from '@/components/ui';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-airSurface">
        <main className="min-h-screen pb-24">{children}</main>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
