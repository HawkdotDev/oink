import React from 'react'
import FileTree from '../../FileTree'
import PluginsWidget from '../PluginsWidget'
import SidebarSearchView from './SidebarSearchView'
import SidebarTagsView from './SidebarTagsView'
import SidebarEmptyState from './SidebarEmptyState'

export type SidebarViewMode = 'explorer' | 'search' | 'plugins'

interface SidebarBodyProps {
  activeView: SidebarViewMode
  activeSubTab?: 'folders' | 'tags'
  searchQuery?: string
  workspacePath: string | null
  activeFilePath: string | null
  onCreateFileAtRoot?: () => void
  onFileSelect: (filePath: string) => void
  fileIcons: Record<string, string>
  onMetadataLoaded: (filePath: string, metadata: { icon?: string; banner?: string }) => void
  enabledPlugins: Record<string, boolean>
  onTogglePlugin?: (pluginId: string) => void
  onOpenWorkspace: () => void
  onOpenSettings?: () => void
  onSwitchView?: (view: SidebarViewMode) => void
}

function SidebarBody({
  activeView,
  activeSubTab = 'folders',
  searchQuery = '',
  workspacePath,
  activeFilePath,
  onFileSelect,
  fileIcons,
  onMetadataLoaded,
  enabledPlugins,
  onTogglePlugin,
  onOpenWorkspace,
  onOpenSettings,
  onSwitchView
}: SidebarBodyProps): React.JSX.Element {
  if (activeView === 'plugins') {
    return (
      <div className="flex-1 overflow-hidden h-full">
        <PluginsWidget
          enabledPlugins={enabledPlugins}
          onTogglePlugin={onTogglePlugin || ((): void => {})}
        />
      </div>
    )
  }

  if (activeView === 'search') {
    return (
      <SidebarSearchView
        workspacePath={workspacePath || ''}
        activeFilePath={activeFilePath}
        onFileSelect={onFileSelect}
        fileIcons={fileIcons}
        onBackToExplorer={(): void => onSwitchView?.('explorer')}
      />
    )
  }

  if (workspacePath) {
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
        {activeSubTab === 'tags' ? (
          <div className="sidebar-tree-wrapper flex-1 overflow-y-auto min-h-0">
            <SidebarTagsView />
          </div>
        ) : (
          <div
            className="sidebar-tree-wrapper flex-1 overflow-y-auto min-h-0"
            onContextMenu={(e): void => {
              if (e.target === e.currentTarget) {
                e.preventDefault()
                window.dispatchEvent(
                  new CustomEvent('sidebar-context-menu', {
                    detail: { x: e.clientX, y: e.clientY }
                  })
                )
              }
            }}
          >
            <FileTree
              rootPath={workspacePath}
              activeFilePath={activeFilePath}
              onFileSelect={onFileSelect}
              fileIcons={fileIcons}
              onMetadataLoaded={onMetadataLoaded}
              onOpenSettings={onOpenSettings}
              searchQuery={searchQuery}
            />
          </div>
        )}
      </div>
    )
  }

  return <SidebarEmptyState onOpenWorkspace={onOpenWorkspace} />
}

export default React.memo(SidebarBody)
