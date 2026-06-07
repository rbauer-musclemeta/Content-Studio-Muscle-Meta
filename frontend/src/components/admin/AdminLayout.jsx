/**
 * AdminLayout — Unified MM™ Admin Platform Shell
 *
 * Provides sidebar navigation and consistent layout for all admin modules:
 * - Dashboard (home)
 * - Research Library
 * - Asset Library
 * - Content Studio (planned)
 * - Workflows (planned)
 * - Analytics (planned)
 */

import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { BRAND } from '../../lib/brand';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Sparkles,
  GitBranch,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin',
    exact: true,
  },
  {
    id: 'research',
    label: 'Research Library',
    icon: BookOpen,
    path: '/admin/research',
    description: 'PMID/DOI citations',
  },
  {
    id: 'assets',
    label: 'Asset Library',
    icon: Layers,
    path: '/admin/assets',
    description: 'Briefs, newsletters, media',
  },
  {
    id: 'studio',
    label: 'Content Studio',
    icon: Sparkles,
    path: '/admin/studio',
    description: 'AI-powered generation',
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: GitBranch,
    path: '/admin/workflows',
    badge: 'Soon',
    disabled: true,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/admin/analytics',
    badge: 'Soon',
    disabled: true,
  },
];

const BOTTOM_NAV = [
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/admin/settings',
    disabled: true,
  },
];

export default function AdminLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const NavItem = ({ item }) => {
    const active = isActive(item);
    const Icon = item.icon;

    if (item.disabled) {
      return (
        <div
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-not-allowed opacity-50 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Icon className="w-5 h-5 flex-shrink-0" style={{ color: BRAND.inkMuted }} />
          {!collapsed && (
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm" style={{ color: BRAND.inkMuted }}>{item.label}</span>
              {item.badge && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {item.badge}
                </Badge>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
          collapsed ? 'justify-center' : ''
        }`}
        style={{
          backgroundColor: active ? `${BRAND.teal}15` : 'transparent',
          color: active ? BRAND.teal : BRAND.inkSoft,
        }}
      >
        <Icon
          className="w-5 h-5 flex-shrink-0"
          style={{ color: active ? BRAND.teal : BRAND.inkMuted }}
        />
        {!collapsed && (
          <div className="flex-1">
            <span className="text-sm font-medium">{item.label}</span>
            {item.description && !active && (
              <p className="text-xs" style={{ color: BRAND.inkMuted }}>{item.description}</p>
            )}
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: BRAND.surface }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white border-r transition-all duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          borderColor: BRAND.border,
          width: collapsed ? '72px' : '260px',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-4 py-4 border-b"
          style={{ borderColor: BRAND.border }}
        >
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: BRAND.teal }}
              >
                <span className="text-white font-bold text-lg">M²</span>
              </div>
              <div>
                <h1
                  className="text-lg font-bold leading-tight"
                  style={{ color: BRAND.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  MM™ Admin
                </h1>
                <p className="text-xs" style={{ color: BRAND.inkMuted }}>Content Platform</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto"
              style={{ backgroundColor: BRAND.teal }}
            >
              <span className="text-white font-bold text-lg">M²</span>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-gray-100"
          >
            <X className="w-5 h-5" style={{ color: BRAND.inkMuted }} />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: BRAND.border }}>
          {BOTTOM_NAV.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-lg w-full hover:bg-gray-50 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 mx-auto" style={{ color: BRAND.inkMuted }} />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" style={{ color: BRAND.inkMuted }} />
                <span className="text-sm" style={{ color: BRAND.inkMuted }}>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 py-3 bg-white border-b"
          style={{ borderColor: BRAND.border }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" style={{ color: BRAND.ink }} />
            </button>
            <Breadcrumb />
          </div>

          <div className="flex items-center gap-3">
            {/* AI Assistant toggle (placeholder) */}
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2"
              disabled
              title="Coming in Phase C"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden md:inline">AI Assistant</span>
              <Badge variant="outline" className="text-xs ml-1">Soon</Badge>
            </Button>

            <Link
              to="/"
              className="flex items-center gap-1 text-sm hover:underline"
              style={{ color: BRAND.inkMuted }}
            >
              <span className="hidden sm:inline">View Site</span>
              <ExternalLink className="w-4 h-4" />
            </Link>

            <Badge
              className="hidden sm:inline-flex"
              style={{ backgroundColor: `${BRAND.teal}20`, color: BRAND.teal }}
            >
              Admin
            </Badge>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const labels = {
    admin: 'Admin',
    research: 'Research Library',
    assets: 'Asset Library',
    studio: 'Content Studio',
    workflows: 'Workflows',
    analytics: 'Analytics',
    settings: 'Settings',
  };

  if (segments.length <= 1) {
    return (
      <h2 className="text-lg font-semibold" style={{ color: BRAND.ink }}>
        Dashboard
      </h2>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Link to="/admin" className="hover:underline" style={{ color: BRAND.inkMuted }}>
        Admin
      </Link>
      {segments.slice(1).map((seg, i) => (
        <React.Fragment key={seg}>
          <span style={{ color: BRAND.inkMuted }}>/</span>
          <span style={{ color: i === segments.length - 2 ? BRAND.ink : BRAND.inkMuted }}>
            {labels[seg] || seg}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}
