import React, { useState, useRef, useCallback } from 'react';
import * as Icons from './components/icons.jsx';
import { BRAND } from './lib/brand.js';
import Onboarding from './pages/Onboarding.jsx';
import Reconciliation from './pages/Reconciliation.jsx';
import Fraud from './pages/Fraud.jsx';

// Tabs: the brief explicitly requires a top bar with centered tabs (no left sidebar).
const TABS = [
  { id: 'Onboarding', label: 'Onboarding', badge: '5', icon: Icons.IconUserCheck || Icons.IconUsers || Icons.IconUser },
  { id: 'Reconciliation', label: 'Reconciliation', badge: '25', icon: Icons.IconScale || Icons.IconBalance || Icons.IconGrid },
  { id: 'Fraud', label: 'Fraud', badge: '12', icon: Icons.IconShieldAlert || Icons.IconShield || Icons.IconBell },
];

const PAGES = {
  Onboarding,
  Reconciliation,
  Fraud,
};

function BrandMark() {
  const name = BRAND.name || 'PayOps Console';
  return (
    <div className="flex items-center gap-3 min-w-0">
      {BRAND.logo ? (
        <img src={BRAND.logo} alt="" className="h-10 w-10 rounded-xl object-contain shrink-0" />
      ) : (
        <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-primary-500/20 shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-topbar-foreground font-bold text-base truncate">{name}</div>
        <div className="text-topbar-foreground/70 text-xs font-medium truncate hidden sm:block">
          {BRAND.tagline || 'Payments operations'}
        </div>
      </div>
    </div>
  );
}

function DemoBadge() {
  const Info = Icons.IconInfo || Icons.IconBell;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 whitespace-nowrap">
      {Info ? <Info className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-amber-500" />}
      Demo mode
    </span>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('Onboarding');
  const tabRefs = useRef({});

  const focusTab = useCallback((id) => {
    setActivePage(id);
    const el = tabRefs.current[id];
    if (el) el.focus();
  }, []);

  const onTabKeyDown = (e, index) => {
    let next = null;
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next !== null) {
      e.preventDefault();
      focusTab(TABS[next].id);
    }
  };

  const renderTabs = (extra = '') => (
    <div
      role="tablist"
      aria-label="AI agents"
      className={`flex items-center gap-1 sm:gap-2 ${extra}`}
    >
      {TABS.map((tab, i) => {
        const active = activePage === tab.id;
        const TabIcon = tab.icon;
        return (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[tab.id] = el; }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active}
            aria-controls={`panel-${tab.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => setActivePage(tab.id)}
            onKeyDown={(e) => onTabKeyDown(e, i)}
            className={`relative inline-flex items-center gap-2 px-3 sm:px-4 h-16 text-sm whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset rounded-lg ${
              active
                ? 'text-primary-700 font-bold'
                : 'text-topbar-foreground/70 hover:text-topbar-foreground font-medium'
            }`}
          >
            {TabIcon ? <TabIcon className="h-4 w-4 shrink-0" /> : null}
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                active ? 'bg-primary-500/15 text-primary-700' : 'bg-slate-100 text-slate-700'
              }`}
              aria-label={`${tab.badge} pending`}
            >
              {tab.badge}
            </span>
            {active && (
              <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary-600" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50/75 text-slate-900">
      {/* Top bar */}
      <header className="border-b border-topbar-foreground/10 bg-topbar text-topbar-foreground shrink-0 z-10 shadow-xs">
        <div className="h-16 px-4 sm:px-8 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-4">
          <BrandMark />
          <div className="hidden md:block">{renderTabs()}</div>
          <div className="flex justify-end">
            <DemoBadge />
          </div>
        </div>
        {/* Tabs row on tablet/mobile */}
        <div className="md:hidden border-t border-topbar-foreground/10 px-2 overflow-x-auto">
          {renderTabs('justify-center min-w-max mx-auto')}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/75 p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Each page stays mounted so every agent keeps its own chat state across tabs. */}
          <div
            role="tabpanel"
            id="panel-Onboarding"
            aria-labelledby="tab-Onboarding"
            hidden={activePage !== 'Onboarding'}
            className="space-y-6 sm:space-y-8"
          >
            <Onboarding onNavigate={setActivePage} />
          </div>
          <div
            role="tabpanel"
            id="panel-Reconciliation"
            aria-labelledby="tab-Reconciliation"
            hidden={activePage !== 'Reconciliation'}
            className="space-y-6 sm:space-y-8"
          >
            <Reconciliation onNavigate={setActivePage} />
          </div>
          <div
            role="tabpanel"
            id="panel-Fraud"
            aria-labelledby="tab-Fraud"
            hidden={activePage !== 'Fraud'}
            className="space-y-6 sm:space-y-8"
          >
            <Fraud onNavigate={setActivePage} />
          </div>
        </div>
      </main>
    </div>
  );
}
