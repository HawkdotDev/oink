import React from 'react'

interface SidebarHeaderProps {
  activeSubTab?: 'home' | 'folders' | 'search'
  onSelectSubTab?: (tab: 'home' | 'folders' | 'search') => void
}

function SidebarHeader({
  activeSubTab = 'folders',
  onSelectSubTab
}: SidebarHeaderProps): React.JSX.Element {
  return (
    <div className="sidebar-header-redesign select-none px-3 pt-3 pb-2 shrink-0">
      {/* Segmented Switcher: [ Home ] | [ Folders ] | [ Search ] */}
      <div className="sidebar-segmented-switcher">
        <button
          type="button"
          className={`switcher-pill-btn ${activeSubTab === 'home' ? 'active' : ''}`}
          onClick={(): void => onSelectSubTab?.('home')}
          title="Knowledge Base Home"
        >
          Home
        </button>
        <button
          type="button"
          className={`switcher-pill-btn ${activeSubTab === 'folders' ? 'active' : ''}`}
          onClick={(): void => onSelectSubTab?.('folders')}
          title="File Tree Explorer"
        >
          File Tree
        </button>
        <button
          type="button"
          className={`switcher-pill-btn ${activeSubTab === 'search' ? 'active' : ''}`}
          onClick={(): void => onSelectSubTab?.('search')}
          title="Search Workspace"
        >
          Search
        </button>
      </div>
    </div>
  )
}

export default React.memo(SidebarHeader)
