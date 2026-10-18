import React from 'react';
import { Menu } from 'lucide-react';
import { NavigationTab } from './Sidebar';

export interface TopBarProps {
  activeTab: NavigationTab;
  onOpenMobileMenu: () => void;
}

const PAGE_TITLES: Record<NavigationTab, string> = {
  dashboard: 'Overview',
  documents: 'Documents',
  analysis: 'Clause Analysis',
  privacy: 'Privacy & Security',
};

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onOpenMobileMenu,
}) => {
  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          className="mobile-nav-toggle"
          onClick={onOpenMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>
        <h1 className="topbar-title">{PAGE_TITLES[activeTab]}</h1>
      </div>

      <div className="topbar-right">
        <span
          className="loopback-tag"
          title="Backend client configured strictly for loopback interface 127.0.0.1:8000"
        >
          127.0.0.1 (loopback)
        </span>
      </div>
    </header>
  );
};
