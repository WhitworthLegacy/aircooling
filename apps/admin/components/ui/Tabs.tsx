'use client';

import { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export default function Tabs({
  tabs,
  defaultTab,
  onChange,
  className = '',
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div className={`border-b border-brand-border ${className}`}>
      <nav className="-mb-px flex gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                inline-flex items-center gap-2 px-4 py-3
                text-sm font-medium
                border-b-2 transition-colors
                ${isActive
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-muted hover:text-brand-dark hover:border-brand-border'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function TabsControlled({
  tabs,
  activeTab,
  onChange,
  className = '',
}: Omit<TabsProps, 'defaultTab'> & { activeTab: string }) {
  return (
    <div className={`border-b border-brand-border ${className}`}>
      <nav className="-mb-px flex gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange?.(tab.id)}
              className={`
                inline-flex items-center gap-2 px-4 py-3
                text-sm font-medium
                border-b-2 transition-colors
                ${isActive
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-muted hover:text-brand-dark hover:border-brand-border'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
