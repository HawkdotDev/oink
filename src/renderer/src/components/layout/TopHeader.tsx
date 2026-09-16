import React from 'react'
import { Minus, Square, X, FileText, Network, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { ViewMode } from '../../types'
import HelpMenu from './subheader/HelpMenu'
import NotificationsMenu from './subheader/NotificationsMenu'
import ViewModeMenu from './subheader/ViewModeMenu'

interface TopHeaderProps {
  onOpenSettings?: () => void
  viewMode: ViewMode
  onToggleViewMode: () => void
  setViewMode?: (mode: ViewMode) => void
  onSwitchToFiles?: () => void
  showTabs?: boolean
  onToggleTabs?: () => void
  showRightSidebar: boolean
  onToggleRightSidebar: () => void
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  onSidebarHoverEnter?: () => void
  onSidebarHoverLeave?: () => void
  showCover?: boolean
  showIcon?: boolean
  showFileName?: boolean
  isOnlyThisFile?: boolean
  activeFilePath?: string | null
  onToggleCover?: () => void
  onToggleIcon?: () => void
  onToggleFileName?: () => void
  onToggleOnlyThisFile?: () => void
}

function TopHeader({
  onOpenSettings,
  viewMode,
  onToggleViewMode,
  setViewMode,
  onSwitchToFiles,
  showTabs = true,
  onToggleTabs,
  showRightSidebar,
  onToggleRightSidebar,
  sidebarCollapsed = false,
  onToggleSidebar,
  onSidebarHoverEnter,
  onSidebarHoverLeave,
  showCover = true,
  showIcon = true,
  showFileName = true,
  isOnlyThisFile = false,
  activeFilePath,
  onToggleCover,
  onToggleIcon,
  onToggleFileName,
  onToggleOnlyThisFile
}: TopHeaderProps): React.JSX.Element {
  return (
    <header
      className="top-header select-none"
      onDoubleClick={(): void => window.api?.window?.maximize?.()}
    >
      {/* LEFT SECTION: Core View Switchers */}
      <div className="top-header-left flex items-center gap-1.5 min-w-0">
        {/* Floating Segmented Navigation Cluster */}
        <div className="header-segmented-cluster">
          {/* Close / Open Sidebar Toggle Button */}
          {onToggleSidebar && (
            <button
              type="button"
              className={`action-pill-btn w-[28.6px] h-[28.6px] p-0 justify-center ${!sidebarCollapsed ? 'active' : ''}`}
              style={{ width: '28.6px', height: '28.6px' }}
              onClick={onToggleSidebar}
              onMouseEnter={onSidebarHoverEnter}
              onMouseLeave={onSidebarHoverLeave}
              title={sidebarCollapsed ? 'Open Sidebar (Ctrl+B)' : 'Close Sidebar (Ctrl+B)'}
              aria-label={sidebarCollapsed ? 'Open Sidebar' : 'Close Sidebar'}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={15.4} strokeWidth={1.75} className="text-zinc-400" />
              ) : (
                <PanelLeftClose size={15.4} strokeWidth={1.75} className="text-zinc-200" />
              )}
            </button>
          )}

          {/* Vertical Divider after Close Sidebar Button */}
          {onToggleSidebar && <div className="h-3.5 w-px bg-zinc-700/60 mx-0.5 shrink-0" />}

          {/* Files and Graph View Segmented Toggle */}
          <div className="topbar-view-toggle">
            {/* 1. File View Toggle */}
            <button
              type="button"
              className={`topbar-view-toggle-btn ${viewMode !== 'graph' ? 'active' : ''}`}
              onClick={(): void => {
                if (onSwitchToFiles) onSwitchToFiles()
                if (setViewMode) setViewMode('editor')
                else if (viewMode === 'graph') onToggleViewMode()
              }}
              title="Document Editor & File View"
            >
              <FileText
                size={13.5}
                strokeWidth={1.75}
                className={viewMode !== 'graph' ? 'text-zinc-100' : 'text-zinc-400'}
              />
              <span>File</span>
            </button>

            {/* 2. Knowledge Graph View Toggle */}
            <button
              type="button"
              className={`topbar-view-toggle-btn ${viewMode === 'graph' ? 'active' : ''}`}
              onClick={(): void => {
                if (setViewMode) setViewMode('graph')
                else if (viewMode === 'editor') onToggleViewMode()
              }}
              title="Knowledge Graph View"
            >
              <Network
                size={13.5}
                strokeWidth={1.75}
                className={viewMode === 'graph' ? 'text-zinc-100' : 'text-zinc-400'}
              />
              <span>Graph</span>
            </button>
          </div>

          {/* Document View Options Dropdown (Beside Toggle) */}
          <ViewModeMenu
            showTabs={showTabs}
            onToggleTabs={onToggleTabs}
            showRightSidebar={showRightSidebar}
            onToggleRightSidebar={onToggleRightSidebar}
            showCover={showCover}
            showIcon={showIcon}
            showFileName={showFileName}
            isOnlyThisFile={isOnlyThisFile}
            activeFilePath={activeFilePath}
            onToggleCover={onToggleCover}
            onToggleIcon={onToggleIcon}
            onToggleFileName={onToggleFileName}
            onToggleOnlyThisFile={onToggleOnlyThisFile}
          />
        </div>
      </div>

      {/* Right Header Action Icons & Window Controls */}
      <div className="top-header-right flex items-center gap-2">
        {/* Squircle Tool Buttons Group */}
        <div className="header-tool-cluster">
          {/* Help & Documentation Menu */}
          <HelpMenu onOpenSettings={onOpenSettings} />

          {/* Notifications Dropdown */}
          <NotificationsMenu />
        </div>

        {/* Vertical Divider */}
        <div className="h-3 w-px bg-zinc-700/60 mx-0.5" />

        {/* Window Controls (Minimize, Maximize, Close) */}
        <div className="window-controls">
          <button
            type="button"
            className="window-control-btn"
            onClick={(): void => window.api?.window?.minimize?.()}
            title="Minimize Window"
          >
            <Minus size={13} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className="window-control-btn"
            onClick={(): void => window.api?.window?.maximize?.()}
            title="Maximize / Restore Window"
          >
            <Square size={11} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className="window-control-btn close-btn"
            onClick={(): void => window.api?.window?.close?.()}
            title="Close Application"
          >
            <X size={13} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default React.memo(TopHeader)
