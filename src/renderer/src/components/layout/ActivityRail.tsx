import React from 'react'
import {
  Home,
  Layers,
  Network,
  Blocks,
  ArrowLeftRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'

export type ActivityRailTab = 'home' | 'explorer' | 'graph' | 'plugins' | 'search'

interface ActivityRailProps {
  activeTab: ActivityRailTab
  onSelectTab: (tab: ActivityRailTab) => void
  onOpenSettings?: () => void
  enabledPluginsCount?: number
  onToggleSearch?: () => void
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

function ActivityRail({
  activeTab,
  onSelectTab,
  enabledPluginsCount = 0,
  onToggleSearch,
  sidebarCollapsed = false,
  onToggleSidebar
}: ActivityRailProps): React.JSX.Element {
  return (
    <nav className="activity-rail select-none flex flex-col items-center py-3">
      {/* Top Group: Open / Close Sidebar Button & Core Views */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Open / Close Sidebar Toggle (Replaced Oink Knowledge Base Button) */}
        <button
          type="button"
          className="rail-brand-btn group"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Open Sidebar (Ctrl+B)' : 'Close Sidebar (Ctrl+B)'}
        >
          <div className="rail-brand-icon-wrap">
            {sidebarCollapsed ? (
              <PanelLeftOpen
                size={16}
                strokeWidth={1.8}
                className="text-zinc-300 group-hover:text-white transition-colors"
              />
            ) : (
              <PanelLeftClose
                size={16}
                strokeWidth={1.8}
                className="text-zinc-300 group-hover:text-white transition-colors"
              />
            )}
          </div>
        </button>

        {/* Navigation Items */}
        <div className="flex flex-col items-center gap-1.5 w-full px-1.5">
          {/* Home / Hub */}
          <button
            type="button"
            className={`rail-nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={(): void => onSelectTab('home')}
            title="Knowledge Base Hub"
          >
            <Home size={15} strokeWidth={1.8} />
          </button>

          {/* Database / Folders & Documents Explorer */}
          <button
            type="button"
            className={`rail-nav-item ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={(): void => onSelectTab('explorer')}
            title="Folders & Documents"
          >
            <Layers size={15} strokeWidth={1.8} />
          </button>

          {/* Sync / Switcher */}
          <button
            type="button"
            className="rail-nav-item"
            onClick={(): void => {
              if (onToggleSearch) onToggleSearch()
              else onSelectTab('search')
            }}
            title="Quick Switcher / Search (Ctrl+P)"
          >
            <ArrowLeftRight size={14} strokeWidth={1.8} />
          </button>

          {/* Knowledge Graph View */}
          <button
            type="button"
            className={`rail-nav-item ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={(): void => onSelectTab('graph')}
            title="Knowledge Graph"
          >
            <Network size={15} strokeWidth={1.8} />
          </button>

          {/* Extensions / Plugins */}
          <button
            type="button"
            className={`rail-nav-item relative ${activeTab === 'plugins' ? 'active' : ''}`}
            onClick={(): void => onSelectTab('plugins')}
            title="Plugins & Extensions"
          >
            <Blocks size={15} strokeWidth={1.8} />
            {enabledPluginsCount > 0 && (
              <span className="rail-badge-dot" title={`${enabledPluginsCount} active plugins`} />
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default React.memo(ActivityRail)
