import React from 'react'
import { Settings } from 'lucide-react'
import WorkspaceSelector from './WorkspaceSelector'

interface SidebarFooterProps {
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
  onOpenSettings?: () => void
}

function SidebarFooter({
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
  onOpenSettings
}: SidebarFooterProps): React.JSX.Element {
  const displayName = workspaceName || 'Knowledge Base'

  return (
    <div className="sidebar-footer select-none flex items-center justify-between gap-2 px-3 py-2 border-t border-white/6 bg-transparent shrink-0">
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

      {/* Right Footer Button: Settings Button */}
      <div className="flex items-center gap-1 shrink-0 relative">
        <button
          type="button"
          className="sidebar-header-icon-btn"
          onClick={onOpenSettings}
          title="Settings & Preferences"
          aria-label="Settings"
        >
          <Settings size={14} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}

export default React.memo(SidebarFooter)
