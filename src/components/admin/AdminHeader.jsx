import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Sliders,
  Sparkles,
  Package,
  LogOut,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { Logo } from '../ui/Logo';

export function AdminHeader({ activeTab, onTabChange, onLogout, adminEmail }) {
  const tabs = [
    { id: 'overview', label: 'Sales & Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'hero', label: 'Hero Slider', icon: Sliders },
    { id: 'featured', label: 'Featured & Deals', icon: Sparkles },
    { id: 'products', label: 'Products & Stock', icon: Package },
  ];

  return (
    <header className="bg-white border-b border-[#E5E5E3] sticky top-0 z-30">
      {/* Top Bar */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-[#141414] text-white text-[11px] font-semibold tracking-wide uppercase">
            <Shield className="w-3 h-3 text-[#B0521F]" />
            <span>Admin</span>
          </div>
        </div>

        {/* User & Actions */}
        <div className="flex items-center gap-4">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6B6B6B] hover:text-[#141414] transition-colors"
          >
            <span>View Live Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#E5E5E3]">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[13px] font-mono font-medium text-[#141414]">
              {adminEmail || 'admin@wrapstore.com'}
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Sign out of Admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#E5E5E3] hover:border-[#141414] hover:bg-[#FAFAF9] text-[#141414] text-[13px] font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar" aria-label="Admin navigation">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-3 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#141414] text-[#141414] font-semibold'
                    : 'border-transparent text-[#6B6B6B] hover:text-[#141414] hover:border-[#D4D4D2]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#B0521F]' : 'text-[#6B6B6B]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default AdminHeader;
