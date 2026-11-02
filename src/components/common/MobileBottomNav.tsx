import React from 'react';
import { Activity, UserCheck, Globe, Clock, FileText } from 'lucide-react';

export type PrimaryNavTab = 'scan' | 'patients' | 'trends' | 'history' | 'report';

interface MobileBottomNavProps {
  activeTab: PrimaryNavTab;
  onSelectTab: (tab: PrimaryNavTab) => void;
  hasActiveReport?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  hasActiveReport = false,
}) => {
  const tabs = [
    {
      id: 'scan' as PrimaryNavTab,
      label: 'Analyzer',
      icon: Activity,
      badge: null,
    },
    ...(hasActiveReport
      ? [
          {
            id: 'report' as PrimaryNavTab,
            label: 'Report',
            icon: FileText,
            badge: 'Live',
          },
        ]
      : []),
    {
      id: 'patients' as PrimaryNavTab,
      label: 'Patients',
      icon: UserCheck,
      badge: null,
    },
    {
      id: 'trends' as PrimaryNavTab,
      label: 'Trends',
      icon: Globe,
      badge: null,
    },
    {
      id: 'history' as PrimaryNavTab,
      label: 'History',
      icon: Clock,
      badge: null,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#D9D4C8] px-2 py-1.5 flex lg:hidden items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 relative ${
              isActive
                ? 'text-[#5C8A6B] bg-emerald-50 font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium active:scale-95'
            }`}
          >
            {/* Active Indicator Top Pill */}
            {isActive && (
              <span className="absolute -top-1.5 w-6 h-0.5 rounded-full bg-[#5C8A6B]" />
            )}

            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#5C8A6B] stroke-[2.5]' : 'stroke-2'}`} />
              {tab.badge && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-[#D98E3F] text-white text-[8px] font-bold rounded-full animate-pulse">
                  {tab.badge}
                </span>
              )}
            </div>

            <span className="text-[10px] tracking-tight mt-0.5 leading-none">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
