import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Scale,
  Shield,
} from 'lucide-react';

export type NavigationTab = 'dashboard' | 'documents' | 'analysis' | 'privacy';

export interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemConfig {
  id: NavigationTab;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={15} />,
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: <FileText size={15} />,
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: <Scale size={15} />,
  },
  {
    id: 'privacy',
    label: 'Privacy & Security',
    icon: <Shield size={15} />,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-icon-wrapper" aria-hidden="true">
            <Scale size={14} />
          </div>
          <div className="brand-title">
            <span>Private Legal Triage</span>
            <span className="brand-subtitle">Rental Agreement Review</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav-item-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-info">
            <span>127.0.0.1:8000</span>
            <span style={{ color: 'var(--border-medium)' }}>/</span>
            <span>local</span>
          </div>
        </div>
      </aside>
    </>
  );
};
