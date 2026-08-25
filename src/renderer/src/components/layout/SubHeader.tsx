import React, { useMemo, useState, useEffect } from 'react'
import { X } from 'lucide-react'
import ShareMenu from './subheader/ShareMenu'
import PageActionsMenu from './subheader/PageActionsMenu'
import { StatusStatsConfig, OpenFileInfo } from '../../types'
import { ProfessionalFileIcon } from '../../utils/fileIconUtils'
import { getPathKey, normalizePath } from '../../utils/pathUtils'

interface SubHeaderProps {
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  onSidebarHoverEnter?: () => void
  onSidebarHoverLeave?: () => void
  workspacePath: string | null
  workspaceName: string
  activeFilePath: string | null
  fileContent?: string
  openFiles?: OpenFileInfo[]
  unsavedFiles?: Record<string, boolean>
  fileIcons?: Record<string, string>
  onTabSelect?: (filePath: string) => void
  onTabClose?: (filePath: string) => void
  onOpenWorkspace?: () => void
  autoSaveEnabled: boolean
  onToggleAutoSave: () => void
  onExportHTML?: () => void
  onExportText?: () => void
  onExportMarkdown?: () => void
  onCopyLink?: () => void
  lastEditedTime?: number | null
  statsConfig?: StatusStatsConfig
  onToggleStat?: (key: keyof StatusStatsConfig) => void
  showCover?: boolean
  showIcon?: boolean
  showFileName?: boolean
  isOnlyThisFile?: boolean
  onToggleCover?: () => void
  onToggleIcon?: () => void
  onToggleFileName?: () => void
  onToggleOnlyThisFile?: () => void
  editorFontFamily: string
  onChangeFontFamily: (family: string) => void
  editorFontSize: number
  onChangeFontSize: (size: number) => void
  editorLineHeight?: string
  onChangeLineHeight?: (val: string) => void
  editorLetterSpacing?: string
  onChangeLetterSpacing?: (val: string) => void
  editorParagraphSpacing?: string
  onChangeParagraphSpacing?: (val: string) => void
  editorFontWeight?: string
  onChangeFontWeight?: (val: string) => void
  editorTextAlign?: string
  onChangeTextAlign?: (val: string) => void
  isFullScreen?: boolean
  onToggleFullScreen?: () => void
  isPageLocked?: boolean
  onToggleLockPage?: () => void
  onDuplicateFile?: () => void
  onDeleteFile?: () => void
  onOpenAI?: () => void
  onUndo?: () => void
  onImport?: () => void
}

function formatRelativeEditedTime(timestamp?: number | null): string {
  if (!timestamp) return 'Edited recently'
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (diffSeconds < 10) return 'Edited just now'
  if (diffSeconds < 60) return `Edited ${diffSeconds}s ago`
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `Edited ${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `Edited ${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Edited yesterday'
  if (diffDays < 7) return `Edited ${diffDays}d ago`
  return `Edited ${new Date(timestamp).toLocaleDateString()}`
}

function SubHeader({
  workspacePath,
  workspaceName,
  activeFilePath,
  fileContent,
  openFiles = [],
  unsavedFiles,
  fileIcons,
  onTabSelect,
  onTabClose,
  onOpenWorkspace,
  autoSaveEnabled,
  onToggleAutoSave,
  onExportHTML,
  onExportText,
  onExportMarkdown,
  onCopyLink,
  lastEditedTime,
  statsConfig,
  onToggleStat,
  showCover = true,
  showIcon = true,
  showFileName = true,
  isOnlyThisFile = false,
  onToggleCover,
  onToggleIcon,
  onToggleFileName,
  onToggleOnlyThisFile,
  editorFontFamily,
  onChangeFontFamily,
  editorFontSize,
  onChangeFontSize,
  editorLineHeight,
  onChangeLineHeight,
  editorLetterSpacing,
  onChangeLetterSpacing,
  editorParagraphSpacing,
  onChangeParagraphSpacing,
  editorFontWeight,
  onChangeFontWeight,
  editorTextAlign,
  onChangeTextAlign,
  isFullScreen = false,
  onToggleFullScreen,
  isPageLocked = false,
  onToggleLockPage,
  onDuplicateFile,
  onDeleteFile,
  onOpenAI,
  onUndo,
  onImport
}: SubHeaderProps): React.JSX.Element {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!lastEditedTime) return
    const timer = setInterval(() => {
      setTick((t) => t + 1)
    }, 15000)
    return (): void => clearInterval(timer)
  }, [lastEditedTime])

  const relativeParts = useMemo(() => {
    if (!activeFilePath) return []
    const rel = activeFilePath.replace(workspacePath || '', '').replace(/^[\\/]/, '')
    return rel ? rel.split(/[\\/]/) : []
  }, [activeFilePath, workspacePath])

  const currentDisplayName =
    workspaceName ||
    (workspacePath ? workspacePath.split(/[\\/]/).filter(Boolean).pop() : '') ||
    'Select Workspace'

  const formattedEditedTime = useMemo(() => {
    if (tick < 0) return ''
    return formatRelativeEditedTime(lastEditedTime)
  }, [lastEditedTime, tick])

  const [activeSubTab, setActiveSubTab] = useState<'breadcrumbs' | 'tabs'>('breadcrumbs')

  return (
    <div className="app-actions-bar select-none">
      {/* Left Application Brand Logo & Navigation Breadcrumbs / File Tabs */}
      <div className="actions-bar-left flex items-center gap-2 overflow-hidden">
        {/* 2 Segmented Tabs determining display after divider */}
        <div className="subheader-tab-cluster">
          <button
            type="button"
            className={`subheader-tab-btn ${activeSubTab === 'breadcrumbs' ? 'active' : ''}`}
            onClick={(): void => setActiveSubTab('breadcrumbs')}
            title="Display Breadcrumbs Path"
          >
            <span>Breadcrumbs</span>
          </button>
          <button
            type="button"
            className={`subheader-tab-btn ${activeSubTab === 'tabs' ? 'active' : ''}`}
            onClick={(): void => setActiveSubTab('tabs')}
            title="Display Open File Tabs"
          >
            <span>Tabs</span>
            {openFiles.length > 0 && (
              <span className="text-[10px] px-1 py-0.2 bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono ml-0.5">
                {openFiles.length}
              </span>
            )}
          </button>
        </div>

        {/* Vertical Divider */}
        <div className="header-pipe-separator" />

        {/* Dynamic Display: Either Breadcrumbs Path or Open Document Tabs */}
        {activeSubTab === 'tabs' ? (
          openFiles.length > 0 ? (
            <div className="subheader-file-tabs flex items-center overflow-x-auto flex-1 min-w-0">
              {openFiles.map((file) => {
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
                  <div
                    key={file.path}
                    className={`subheader-tab-item ${isActive ? 'active' : ''} ${isUnsaved ? 'unsaved' : ''}`}
                    onClick={(): void => onTabSelect?.(file.path)}
                    title={file.path}
                  >
                    <span className="subheader-tab-item-icon">
                      {customIcon ? (
                        <span className="text-[12px]">{customIcon}</span>
                      ) : (
                        <ProfessionalFileIcon fileName={file.name} className="scale-[0.85]" />
                      )}
                    </span>
                    <span className="subheader-tab-item-name">{file.name}</span>
                    {onTabClose && (
                      <button
                        type="button"
                        className="subheader-tab-item-close"
                        onClick={(e): void => {
                          e.stopPropagation()
                          onTabClose(file.path)
                        }}
                        title="Close Tab"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-[11px] text-zinc-500 italic px-1">No open tabs</div>
          )
        ) : (
          (activeFilePath || workspacePath) && (
            <div className="nav-breadcrumbs">
              {/* First Folder in Breadcrumbs (Workspace Root) */}
              <div
                className="breadcrumb-item workspace-root"
                title={`Workspace: ${currentDisplayName}`}
                onClick={onOpenWorkspace}
              >
                <span className="max-w-35 truncate">{currentDisplayName}</span>
              </div>

              {relativeParts.map((part, idx) => {
                const isLast = idx === relativeParts.length - 1
                return (
                  <React.Fragment key={idx}>
                    <span className="breadcrumb-separator">/</span>
                    <div
                      className={`breadcrumb-item ${isLast ? 'active-file' : 'directory'}`}
                      title={part}
                    >
                      <span className="truncate max-w-44">{part}</span>
                    </div>
                  </React.Fragment>
                )
              })}
            </div>
          )
        )}
      </div>

      {/* Right Toolbar Actions */}
      <div className="actions-bar-right flex items-center gap-2">
        {/* Edited Time Indicator */}
        {activeFilePath && (
          <>
            <span
              className="edited-time-badge"
              title={lastEditedTime ? new Date(lastEditedTime).toLocaleString() : undefined}
            >
              {formattedEditedTime}
            </span>
            <span className="actions-bar-pipe" aria-hidden="true">
              |
            </span>
          </>
        )}

        {/* Autosave Toggle Switch */}
        <div
          className="header-toggle-group cursor-pointer"
          onClick={onToggleAutoSave}
          title={`Autosave is ${autoSaveEnabled ? 'Enabled' : 'Disabled'}`}
        >
          <span>Autosave</span>
          <div className={`toggle-switch ${autoSaveEnabled ? 'active' : ''}`}>
            <div className="toggle-knob" />
          </div>
        </div>

        {/* Share & Collaboration Dropdown */}
        <ShareMenu activeFilePath={activeFilePath} onCopyLink={onCopyLink} />

        {/* 3-Dots Page Actions Dropdown (includes Text Customisation, Customize Page, Import & Export) */}
        <PageActionsMenu
          activeFilePath={activeFilePath}
          workspacePath={workspacePath}
          fileContent={fileContent}
          editorFontFamily={editorFontFamily}
          onChangeFontFamily={onChangeFontFamily}
          editorFontSize={editorFontSize}
          onChangeFontSize={onChangeFontSize}
          editorLineHeight={editorLineHeight}
          onChangeLineHeight={onChangeLineHeight}
          editorLetterSpacing={editorLetterSpacing}
          onChangeLetterSpacing={onChangeLetterSpacing}
          editorParagraphSpacing={editorParagraphSpacing}
          onChangeParagraphSpacing={onChangeParagraphSpacing}
          editorFontWeight={editorFontWeight}
          onChangeFontWeight={onChangeFontWeight}
          editorTextAlign={editorTextAlign}
          onChangeTextAlign={onChangeTextAlign}
          isFullScreen={isFullScreen}
          onToggleFullScreen={onToggleFullScreen}
          isPageLocked={isPageLocked}
          onToggleLockPage={onToggleLockPage}
          onDuplicateFile={onDuplicateFile}
          onDeleteFile={onDeleteFile}
          onOpenAI={onOpenAI}
          onUndo={onUndo}
          onImport={onImport}
          onExportHTML={onExportHTML}
          onExportText={onExportText}
          onExportMarkdown={onExportMarkdown}
          onCopyLink={onCopyLink}
          statsConfig={statsConfig}
          onToggleStat={onToggleStat}
          showCover={showCover}
          showIcon={showIcon}
          showFileName={showFileName}
          isOnlyThisFile={isOnlyThisFile}
          onToggleCover={onToggleCover}
          onToggleIcon={onToggleIcon}
          onToggleFileName={onToggleFileName}
          onToggleOnlyThisFile={onToggleOnlyThisFile}
        />
      </div>
    </div>
  )
}

export default React.memo(SubHeader)
