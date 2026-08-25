import React from 'react'
import {
  Home,
  Layers,
  Network,
  Blocks,
  Settings,
  ArrowLeftRight,
  Boxes
} from 'lucide-react'

export type ActivityRailTab = 'home' | 'explorer' | 'graph' | 'plugins' | 'search'

interface ActivityRailProps {
  activeTab: ActivityRailTab
  onSelectTab: (tab: ActivityRailTab) => void
  onOpenSettings: () => void
  enabledPluginsCount?: number
  onToggleSearch?: () => void
}

function ActivityRail({
  activeTab,
  onSelectTab,
  onOpenSettings,
  enabledPluginsCount = 0,
  onToggleSearch
}: ActivityRailProps): React.JSX.Element {
  return (
    <nav className="activity-rail select-none flex flex-col items-center justify-between py-3">
      {/* Top Group: Brand Icon & Core Views */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Brand Cube Icon */}
        <button
          type="button"
          className="rail-brand-btn group"
          onClick={(): void => onSelectTab('home')}
          title="Oink Knowledge Base"
        >
          <div className="rail-brand-icon-wrap">
            <Boxes size={19} className="text-zinc-100 group-hover:scale-110 transition-transform" />
          </div>
        </button>

        {/* Navigation Items */}
        <div className="flex flex-col items-center gap-1.5 w-full px-2">
          {/* Home / Hub */}
          <button
            type="button"
            className={`rail-nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={(): void => onSelectTab('home')}
            title="Knowledge Base Hub"
          >
            <Home size={17} strokeWidth={1.8} />
          </button>

          {/* Database / Knowledge Base Explorer */}
          <button
            type="button"
            className={`rail-nav-item ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={(): void => onSelectTab('explorer')}
            title="Folders & Documents"
          >
            <Layers size={17} strokeWidth={1.8} />
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
            <ArrowLeftRight size={16} strokeWidth={1.8} />
          </button>

          {/* Knowledge Graph View */}
          <button
            type="button"
            className={`rail-nav-item ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={(): void => onSelectTab('graph')}
            title="Knowledge Graph"
          >
            <Network size={17} strokeWidth={1.8} />
          </button>

          {/* Extensions / Plugins */}
          <button
            type="button"
            className={`rail-nav-item relative ${activeTab === 'plugins' ? 'active' : ''}`}
            onClick={(): void => onSelectTab('plugins')}
            title="Plugins & Extensions"
          >
            <Blocks size={17} strokeWidth={1.8} />
            {enabledPluginsCount > 0 && (
              <span className="rail-badge-dot" title={`${enabledPluginsCount} active plugins`} />
            )}
          </button>
        </div>
      </div>

      {/* Bottom Group: Settings */}
      <div className="flex flex-col items-center gap-1.5 w-full px-2">
        <button
          type="button"
          className="rail-nav-item"
          onClick={onOpenSettings}
          title="Preferences & Settings"
        >
          <Settings size={17} strokeWidth={1.8} />
        </button>
      </div>
    </nav>
  )
}

export default React.memo(ActivityRail)
