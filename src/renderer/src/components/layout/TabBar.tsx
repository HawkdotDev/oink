import React from 'react'
import { X, Plus, Minimize2 } from 'lucide-react'
import { OpenFileInfo } from '../../types'
import { ProfessionalFileIcon } from '../../utils/fileIconUtils'
import { getPathKey, normalizePath } from '../../utils/pathUtils'

interface TabItemProps {
  file: OpenFileInfo
  isActive: boolean
  isUnsaved: boolean
  customIcon?: string
  onTabSelect: (filePath: string) => void
  onTabClose: (filePath: string) => void
}

const TabItem = React.memo(function TabItem({
  file,
  isActive,
  isUnsaved,
  customIcon,
  onTabSelect,
  onTabClose
}: TabItemProps): React.JSX.Element {
  return (
    <div
      className={`header-tab ${isActive ? 'active' : ''} ${isUnsaved ? 'unsaved' : ''}`}
      onClick={(): void => onTabSelect(file.path)}
      title={file.path}
    >
      <span className="header-tab-icon">
        {customIcon ? (
          <span className="text-[12px]">{customIcon}</span>
        ) : (
          <ProfessionalFileIcon fileName={file.name} className="scale-[0.9]" />
        )}
      </span>
      <span className="header-tab-name">{file.name}</span>
      {isUnsaved ? <span className="header-tab-unsaved-dot" title="Unsaved changes" /> : null}
      <button
        type="button"
        className="header-tab-close"
        onClick={(e): void => {
          e.stopPropagation()
          onTabClose(file.path)
        }}
        title="Close tab"
      >
        <X size={12} strokeWidth={1.5} />
      </button>
    </div>
  )
})

interface TabBarProps {
  openFiles: OpenFileInfo[]
  activeFilePath: string | null
  fileIcons?: Record<string, string>
  workspacePath?: string | null
  unsavedFiles?: Record<string, boolean>
  onTabSelect: (filePath: string) => void
  onTabClose: (filePath: string) => void
  onCreateFileAtRoot?: () => void
  isFullScreen?: boolean
  onToggleFullScreen?: () => void
}

function TabBarComponent({
  openFiles,
  activeFilePath,
  fileIcons,
  workspacePath,
  unsavedFiles,
  onTabSelect,
  onTabClose,
  onCreateFileAtRoot,
  isFullScreen,
  onToggleFullScreen
}: TabBarProps): React.JSX.Element | null {
  const displayFiles = React.useMemo(() => {
    if (openFiles && openFiles.length > 0) return openFiles
    if (activeFilePath) {
      const fileName = activeFilePath.split(/[\\/]/).filter(Boolean).pop() || 'Untitled'
      return [{ path: activeFilePath, name: fileName }]
    }
    return []
  }, [openFiles, activeFilePath])

  if (displayFiles.length === 0 && !isFullScreen) return null

  return (
    <div className="header-tabs-container flex-1 min-w-0 flex items-stretch justify-between h-full">
      <div className="header-tabs-scroll-area flex items-stretch h-full overflow-x-auto scrollbar-none flex-1 min-w-0">
        {displayFiles.map((file) => {
          const isActive = activeFilePath === file.path
          const isUnsaved = unsavedFiles
            ? !!unsavedFiles[file.path] ||
              !!unsavedFiles[getPathKey(file.path)] ||
              !!unsavedFiles[normalizePath(file.path)]
            : false

          const rel = file.path
            .toLowerCase()
            .replace((workspacePath || '').toLowerCase(), '')
            .replace(/^[\\/]/, '')
          const customIcon = fileIcons ? fileIcons[rel] : undefined

          return (
            <TabItem
              key={file.path}
              file={file}
              isActive={isActive}
              isUnsaved={isUnsaved}
              customIcon={customIcon}
              onTabSelect={onTabSelect}
              onTabClose={onTabClose}
            />
          )
        })}
        {onCreateFileAtRoot && (
          <button
            type="button"
            className="header-tab-add-btn"
            onClick={onCreateFileAtRoot}
            title="New File Tab"
          >
            <Plus size={13} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {isFullScreen && onToggleFullScreen && (
        <div className="header-tabs-fullscreen-actions flex items-center px-2 shrink-0">
          <button
            type="button"
            className="fullscreen-exit-tab-btn"
            onClick={onToggleFullScreen}
            title="Exit Full Screen (Esc / F11)"
          >
            <Minimize2 size={12} strokeWidth={1.75} />
            <span>Exit Full Screen</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default React.memo(TabBarComponent)
