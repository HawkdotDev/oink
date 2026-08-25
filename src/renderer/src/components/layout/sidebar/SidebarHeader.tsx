import React, { useState } from 'react'
import { Plus, Search, FolderPlus, FilePlus } from 'lucide-react'
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
  const [showAddMenu, setShowAddMenu] = useState(false)

  const displayName = workspaceName || 'Knowledge Base'

  return (
    <div className="sidebar-header-redesign select-none">
      {/* Top Title & Action Controls Row */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
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

        {/* Right Header Buttons: + */}
        <div className="flex items-center gap-1 shrink-0 relative">
          <button
            type="button"
            className="sidebar-header-icon-btn"
            onClick={(): void => setShowAddMenu((p) => !p)}
            title="Create new file or folder"
          >
            <Plus size={15} strokeWidth={2} />
          </button>

          {/* Quick Create Dropdown Menu */}
          {showAddMenu && (
            <div
              className="sidebar-quick-add-menu"
              onMouseLeave={(): void => setShowAddMenu(false)}
            >
              <button
                type="button"
                className="quick-add-item"
                onClick={(): void => {
                  onCreateFileAtRoot()
                  setShowAddMenu(false)
                }}
              >
                <FilePlus size={13} className="text-zinc-400" />
                <span>New Page</span>
              </button>
              <button
                type="button"
                className="quick-add-item"
                onClick={(): void => {
                  window.dispatchEvent(new CustomEvent('create-root-folder'))
                  setShowAddMenu(false)
                }}
              >
                <FolderPlus size={13} className="text-zinc-400" />
                <span>New Folder</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Pill Input Matching Reference Image */}
      <div className="px-3 pb-2">
        <div className="sidebar-search-pill flex items-center gap-2">
          <Search size={13} className="text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e): void => onSearchChange?.(e.target.value)}
            className="sidebar-search-input-field"
          />
        </div>
      </div>

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
