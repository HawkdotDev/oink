import React, { useState, useRef } from 'react'
import { Search, X } from 'lucide-react'
import WorkspaceSelector from './WorkspaceSelector'
import type { SidebarViewMode } from './SidebarBody'

interface SidebarHeaderProps {
  activeView?: SidebarViewMode
  workspacePath: string | null
  workspaceName?: string
  workspaceIcons?: Record<string, string>
  onSetWorkspaceIcon?: (workspacePath: string, icon: string | null) => void
  recentWorkspaces?: { path: string; name: string }[]
  onOpenWorkspace: () => void
  onCloseWorkspace?: () => void
  onSwitchWorkspace?: (path: string, name?: string) => void
  onRemoveRecentWorkspace?: (path: string) => void
  onRenameWorkspace?: () => void
  onCreateFileAtRoot: () => void
  onToggleSidebar?: () => void
  searchQuery?: string
  onSearchChange?: (q: string) => void
  activeSubTab?: 'folders' | 'tags'
  onSelectSubTab?: (tab: 'folders' | 'tags') => void
}

function SidebarHeader({
  workspacePath,
  workspaceName,
  workspaceIcons,
  onSetWorkspaceIcon,
  recentWorkspaces,
  onOpenWorkspace,
  onCloseWorkspace,
  onSwitchWorkspace,
  onRemoveRecentWorkspace,
  onRenameWorkspace,
  onCreateFileAtRoot,
  searchQuery = '',
  onSearchChange,
  activeSubTab = 'folders',
  onSelectSubTab
}: SidebarHeaderProps): React.JSX.Element {
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const isSearchOpen = showSearch || Boolean(searchQuery && searchQuery.trim().length > 0)
  const displayName = workspaceName || 'Knowledge Base'

  return (
    <div className="sidebar-header-redesign select-none">
      {/* Top Title & Action Controls Row */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        {/* Workspace Title with Popover Trigger */}
        <WorkspaceSelector
          workspacePath={workspacePath}
          workspaceName={displayName}
          workspaceIcons={workspaceIcons}
          onSetWorkspaceIcon={onSetWorkspaceIcon}
          recentWorkspaces={recentWorkspaces}
          onOpenWorkspace={onOpenWorkspace}
          onCloseWorkspace={onCloseWorkspace}
          onSwitchWorkspace={onSwitchWorkspace}
          onRemoveRecentWorkspace={onRemoveRecentWorkspace}
          onRenameWorkspace={onRenameWorkspace}
          onCreateFileAtRoot={onCreateFileAtRoot}
        />

        {/* Right Header Buttons: Search Toggle */}
        <div className="flex items-center gap-1 shrink-0 relative">
          <button
            type="button"
            className={`sidebar-header-icon-btn ${isSearchOpen ? 'active' : ''}`}
            onClick={(): void => {
              setShowSearch((prev) => {
                const next = !prev
                if (!next && onSearchChange) {
                  onSearchChange('')
                }
                return next
              })
              if (!showSearch) {
                setTimeout(() => searchInputRef.current?.focus(), 50)
              }
            }}
            title={isSearchOpen ? 'Close Search (Esc)' : 'Search Files (Ctrl+F)'}
          >
            <Search size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Search Pill Input: Only rendered when search is toggled open */}
      {isSearchOpen && (
        <div className="px-3 pb-2">
          <div className="sidebar-search-pill flex items-center gap-2">
            <Search size={13} className="text-zinc-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e): void => onSearchChange?.(e.target.value)}
              className="sidebar-search-input-field"
              autoFocus
              onKeyDown={(e): void => {
                if (e.key === 'Escape') {
                  if (searchQuery) {
                    onSearchChange?.('')
                  } else {
                    setShowSearch(false)
                  }
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                onClick={(): void => onSearchChange?.('')}
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Segmented Switcher: [ Folders ] | [ Tags ] */}
      <div className="px-3 pb-2">
        <div className="sidebar-segmented-switcher">
          <button
            type="button"
            className={`switcher-pill-btn ${activeSubTab === 'folders' ? 'active' : ''}`}
            onClick={(): void => onSelectSubTab?.('folders')}
          >
            Folders
          </button>
          <button
            type="button"
            className={`switcher-pill-btn ${activeSubTab === 'tags' ? 'active' : ''}`}
            onClick={(): void => onSelectSubTab?.('tags')}
          >
            Tags
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(SidebarHeader)
