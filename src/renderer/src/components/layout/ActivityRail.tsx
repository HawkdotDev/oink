import React from 'react'
import { Home, Blocks, ArrowLeftRight } from 'lucide-react'

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
  onToggleSearch
}: ActivityRailProps): React.JSX.Element {
  return (
    <nav className="activity-rail select-none flex flex-col items-center py-2">
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
    </nav>
  )
}

export default React.memo(ActivityRail)
