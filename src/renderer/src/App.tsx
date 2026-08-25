import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { AppWindow, ListTree, X, Minimize2, Image, ChevronLeft, ChevronRight } from 'lucide-react'
import BlockEditor from './components/BlockEditor'
import BannerPicker from './components/BannerPicker'
import NotionPageHeader from './components/editor/NotionPageHeader'
import WelcomeScreen from './components/WelcomeScreen'
import SettingsModal from './components/SettingsModal'
import TopHeader from './components/layout/TopHeader'
import SubHeader from './components/layout/SubHeader'
import Sidebar from './components/layout/Sidebar'
import ActivityRail, { ActivityRailTab } from './components/layout/ActivityRail'
import TabBar from './components/layout/TabBar'
import FloatingWidgetsOverlay from './components/layout/FloatingWidgetsOverlay'
import OutlineWidget from './components/layout/OutlineWidget'
import StatusBar from './components/layout/StatusBar'

const GraphView = lazy(() => import('./components/GraphView'))

import { MarkdownMetadata, ViewMode, StatusStatsConfig } from './types'
import { normalizePath, getRelativePath, getPathKey } from './utils/pathUtils'
import { stripFrontmatter } from './utils/metadataUtils'
import { metadataEngine } from './utils/metadataEngine'
import { markdownToHtml } from './utils/markdownConverter'

import { usePersistentState } from './hooks/usePersistentState'
import { useSidebarResize } from './hooks/useSidebarResize'
import { useWidgetManager } from './hooks/useWidgetManager'
import { useIndexerWorker } from './hooks/useIndexerWorker'
import { useWorkspace } from './hooks/useWorkspace'
import { useFileStorage } from './hooks/useFileStorage'
import { useEditorTypography } from './hooks/useEditorTypography'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'

export default function App(): React.JSX.Element {
  const { savedState, saveState } = usePersistentState()

  // 1. Workspace Domain Management
  const {
    workspacePath,
    workspaceName,
    recentWorkspaces,
    handleOpenWorkspace,
    handleSwitchWorkspace,
    handleRemoveRecentWorkspace,
    handleCloseWorkspace,
    handleRenameWorkspace
  } = useWorkspace(
    savedState.workspacePath ?? 'c:\\Users\\dwaip\\OneDrive\\Documents\\Application',
    savedState.workspaceName ?? 'Application'
  )

  // 2. View Mode & Sidebar UI States
  const [viewMode, setViewMode] = useState<ViewMode>(() => savedState.viewMode ?? 'editor')
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(
    () => savedState.autoSaveEnabled ?? true
  )
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    () => savedState.sidebarCollapsed ?? false
  )
  const [isSidebarHoverPeeked, setIsSidebarHoverPeeked] = useState<boolean>(false)
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(
    () => savedState.showRightSidebar ?? false
  )
  const [showTabs, setShowTabs] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('oink_show_tabs')
      return saved !== null ? saved === 'true' : true
    } catch {
      return true
    }
  })
  const [sidebarView, setSidebarView] = useState<'explorer' | 'search' | 'plugins'>(() => {
    try {
      const saved = localStorage.getItem('oink_sidebar_view')
      if (saved === 'explorer' || saved === 'search' || saved === 'plugins') {
        return saved as 'explorer' | 'search' | 'plugins'
      }
      return 'explorer'
    } catch {
      return 'explorer'
    }
  })
  const [railTab, setRailTab] = useState<ActivityRailTab>('home')
  const [activityRailCollapsed, setActivityRailCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('oink_activity_rail_collapsed')
      return saved !== null ? saved === 'true' : false
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('oink_activity_rail_collapsed', String(activityRailCollapsed))
    } catch {
      // ignore
    }
  }, [activityRailCollapsed])
  const [enabledPlugins, setEnabledPlugins] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('oink_enabled_plugins')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return {
      'katex-math': true,
      'daily-notes': true,
      'mermaid-pro': true
    }
  })

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false)
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false)
  const [isPageLocked, setIsPageLocked] = useState<boolean>(false)
  const [showBannerPicker, setShowBannerPicker] = useState<boolean>(false)
  const [maxUndoHistory, setMaxUndoHistory] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('oink_max_undo_count')
      return saved ? parseInt(saved, 10) : 50
    } catch {
      return 50
    }
  })

  const handleTriggerUndo = useCallback(() => {
    window.dispatchEvent(new CustomEvent('oink:undo'))
  }, [])

  // 3. Typography Domain Management
  const {
    editorFontFamily,
    editorFontSize,
    editorLineHeight,
    editorLetterSpacing,
    editorParagraphSpacing,
    editorFontWeight,
    editorTextAlign,
    handleFontFamilyChange,
    handleFontSizeChange,
    handleLineHeightChange,
    handleLetterSpacingChange,
    handleParagraphSpacingChange,
    handleFontWeightChange,
    handleTextAlignChange
  } = useEditorTypography()

  // 4. File Storage Domain Management
  const {
    activeFilePath,
    setActiveFilePath,
    openFiles,
    setOpenFiles,
    fileContents,
    setFileContents,
    originalFileContents,
    fileIcons,
    setFileIcons,
    fileBanners,
    setFileBanners,
    setFileMetadataMap,
    activeRelKey,
    activeFileMeta,
    isOnlyThisFile,
    handleFileSelect,
    handleTabSelect,
    handleTabClose,
    handleSaveActiveFile,
    handleSetFileIcon,
    handleSetFileBanner,
    handleRenameActiveFile,
    handleCreateFileAtRoot,
    handleDuplicateFile,
    handleDeleteFile,
    resetAllFileStates,
    unsavedFiles
  } = useFileStorage(
    workspacePath,
    savedState.activeFilePath ?? null,
    savedState.openFiles ?? [],
    autoSaveEnabled
  )

  // 5. Sidebar Resize & Widget Manager Hooks
  const {
    sidebarWidth,
    rightSidebarWidth,
    isResizingLeft,
    isResizingRight,
    startLeftResize,
    startRightResize
  } = useSidebarResize(savedState.sidebarWidth ?? 240, savedState.rightSidebarWidth ?? 220)

  const {
    widgetState,
    setWidgetState,
    widgetZIndexes,
    widgetPositions,
    bringWidgetToFront,
    handleToggleWidget,
    handleWidgetLayoutChange
  } = useWidgetManager(
    savedState.widgetState,
    savedState.widgetZIndexes,
    savedState.widgetPositions
  )

  // 6. Multithreaded Background Indexer
  const { stats: workerStats, headings: workerHeadings } = useIndexerWorker(
    activeFilePath ? fileContents[activeFilePath] : ''
  )

  // 7. Display Options (Cover, Icon, Title)
  const [globalShowCover, setGlobalShowCover] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('oink_global_show_cover')
      return saved !== null ? saved === 'true' : true
    } catch {
      return true
    }
  })
  const [globalShowIcon, setGlobalShowIcon] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('oink_global_show_icon')
      return saved !== null ? saved === 'true' : true
    } catch {
      return true
    }
  })
  const [globalShowFileName, setGlobalShowFileName] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('oink_global_show_file_name')
      return saved !== null ? saved === 'true' : true
    } catch {
      return true
    }
  })

  const effectiveShowCover =
    activeFileMeta?.showCover !== undefined ? activeFileMeta.showCover : globalShowCover
  const effectiveShowIcon =
    activeFileMeta?.showIcon !== undefined ? activeFileMeta.showIcon : globalShowIcon
  const effectiveShowFileName =
    activeFileMeta?.showFileName !== undefined ? activeFileMeta.showFileName : globalShowFileName

  // 8. Custom Workspace Icons
  const [workspaceIcons, setWorkspaceIcons] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('oink_workspace_icons')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const handleSetWorkspaceIcon = useCallback((wsPath: string, icon: string | null) => {
    setWorkspaceIcons((prev) => {
      const next = { ...prev }
      const key = getPathKey(wsPath)
      if (!icon) {
        delete next[key]
        delete next[wsPath]
      } else {
        next[key] = icon
        next[wsPath] = icon
      }
      try {
        localStorage.setItem('oink_workspace_icons', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  // 9. Status Bar Stats Metrics Config
  const [statsConfig, setStatsConfig] = useState<StatusStatsConfig>(() => {
    try {
      const saved = localStorage.getItem('oink_status_stats_config')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return {
      showWords: true,
      showLines: true,
      showChars: false,
      showSpaces: true,
      showReadingTime: false,
      showLanguage: true,
      showSavedBadge: true
    }
  })

  const handleToggleStat = useCallback((key: keyof StatusStatsConfig) => {
    setStatsConfig((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem('oink_status_stats_config', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  // 10. Sidebar Interactions
  const handleSidebarHoverEnter = useCallback((): void => {
    if (sidebarCollapsed) {
      setIsSidebarHoverPeeked(true)
    }
  }, [sidebarCollapsed])

  const handleSidebarHoverLeave = useCallback((): void => {
    setTimeout(() => {
      setIsSidebarHoverPeeked(false)
    }, 220)
  }, [])

  const handleToggleSidebar = useCallback((): void => {
    setIsSidebarHoverPeeked(false)
    setSidebarCollapsed((p) => !p)
  }, [])

  const effectiveSidebarCollapsed = sidebarCollapsed && !isSidebarHoverPeeked

  const handleTogglePlugin = useCallback((pluginId: string) => {
    setEnabledPlugins((prev) => {
      const updated = { ...prev, [pluginId]: !prev[pluginId] }
      try {
        localStorage.setItem('oink_enabled_plugins', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }, [])

  const handleTogglePluginsView = useCallback(() => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false)
      setSidebarView('plugins')
    } else if (sidebarView === 'plugins') {
      setSidebarView('explorer')
    } else {
      setSidebarView('plugins')
    }
  }, [sidebarCollapsed, sidebarView])

  const handleToggleSearch = useCallback(() => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false)
      setSidebarView('search')
    } else if (sidebarView === 'search') {
      setSidebarView('explorer')
    } else {
      setSidebarView('search')
    }
  }, [sidebarCollapsed, sidebarView])

  const handleSwitchToFiles = useCallback(() => {
    setSidebarView('explorer')
    if (sidebarCollapsed) {
      setSidebarCollapsed(false)
    }
  }, [sidebarCollapsed])

  // 11. Workspace Action Handlers (Connecting Hooks)
  const onOpenWorkspaceClick = useCallback(async () => {
    const newPath = await handleOpenWorkspace()
    if (newPath) {
      resetAllFileStates()
    }
  }, [handleOpenWorkspace, resetAllFileStates])

  const onSwitchWorkspaceClick = useCallback(
    (path: string, name?: string) => {
      const newPath = handleSwitchWorkspace(path, name)
      if (newPath) {
        resetAllFileStates()
      }
    },
    [handleSwitchWorkspace, resetAllFileStates]
  )

  const onCloseWorkspaceClick = useCallback(() => {
    handleCloseWorkspace()
    resetAllFileStates()
  }, [handleCloseWorkspace, resetAllFileStates])

  const onRenameWorkspaceClick = useCallback(
    async (newName?: string) => {
      const newPath = await handleRenameWorkspace(newName)
      if (newPath && workspacePath) {
        setOpenFiles((prev) =>
          prev.map((f) => {
            const rel = f.path.substring(workspacePath.length)
            return { ...f, path: normalizePath(`${newPath}${rel}`) }
          })
        )
        if (activeFilePath && activeFilePath.startsWith(workspacePath)) {
          const rel = activeFilePath.substring(workspacePath.length)
          setActiveFilePath(normalizePath(`${newPath}${rel}`))
        }
      }
    },
    [handleRenameWorkspace, workspacePath, activeFilePath, setActiveFilePath, setOpenFiles]
  )

  // 12. Display Option Toggles
  const handleToggleOnlyThisFile = useCallback(() => {
    if (!activeFilePath || !workspacePath) return
    const rel = getRelativePath(activeFilePath, workspacePath)
    const relKey = rel.toLowerCase()

    setFileMetadataMap((prev) => {
      const current = prev[relKey] || {}
      const currentlyOnlyThisFile =
        current.showCover !== undefined ||
        current.showIcon !== undefined ||
        current.showFileName !== undefined

      const nextMeta = { ...current }
      if (currentlyOnlyThisFile) {
        delete nextMeta.showCover
        delete nextMeta.showIcon
        delete nextMeta.showFileName
        metadataEngine.clearFileOverrides(rel)
      } else {
        nextMeta.showCover = effectiveShowCover
        nextMeta.showIcon = effectiveShowIcon
        nextMeta.showFileName = effectiveShowFileName
        metadataEngine.setShowCover(rel, effectiveShowCover)
        metadataEngine.setShowIcon(rel, effectiveShowIcon)
        metadataEngine.setShowFileName(rel, effectiveShowFileName)
      }
      return { ...prev, [relKey]: nextMeta }
    })

    setTimeout(() => {
      void handleSaveActiveFile()
    }, 50)
  }, [
    activeFilePath,
    workspacePath,
    effectiveShowCover,
    effectiveShowIcon,
    effectiveShowFileName,
    setFileMetadataMap,
    handleSaveActiveFile
  ])

  const handleToggleCover = useCallback(() => {
    if (isOnlyThisFile && activeFilePath && workspacePath) {
      const rel = getRelativePath(activeFilePath, workspacePath)
      const relKey = rel.toLowerCase()
      const nextVal = !effectiveShowCover
      setFileMetadataMap((prev) => ({
        ...prev,
        [relKey]: { ...prev[relKey], showCover: nextVal }
      }))
      metadataEngine.setShowCover(rel, nextVal)
      setTimeout(() => {
        void handleSaveActiveFile()
      }, 50)
    } else {
      setGlobalShowCover((prev) => {
        const next = !prev
        try {
          localStorage.setItem('oink_global_show_cover', String(next))
        } catch {
          // ignore
        }
        return next
      })
    }
  }, [
    isOnlyThisFile,
    activeFilePath,
    workspacePath,
    effectiveShowCover,
    setFileMetadataMap,
    handleSaveActiveFile
  ])

  const handleToggleIcon = useCallback(() => {
    if (isOnlyThisFile && activeFilePath && workspacePath) {
      const rel = getRelativePath(activeFilePath, workspacePath)
      const relKey = rel.toLowerCase()
      const nextVal = !effectiveShowIcon
      setFileMetadataMap((prev) => ({
        ...prev,
        [relKey]: { ...prev[relKey], showIcon: nextVal }
      }))
      metadataEngine.setShowIcon(rel, nextVal)
      setTimeout(() => {
        void handleSaveActiveFile()
      }, 50)
    } else {
      setGlobalShowIcon((prev) => {
        const next = !prev
        try {
          localStorage.setItem('oink_global_show_icon', String(next))
        } catch {
          // ignore
        }
        return next
      })
    }
  }, [
    isOnlyThisFile,
    activeFilePath,
    workspacePath,
    effectiveShowIcon,
    setFileMetadataMap,
    handleSaveActiveFile
  ])

  const handleToggleFileName = useCallback(() => {
    if (isOnlyThisFile && activeFilePath && workspacePath) {
      const rel = getRelativePath(activeFilePath, workspacePath)
      const relKey = rel.toLowerCase()
      const nextVal = !effectiveShowFileName
      setFileMetadataMap((prev) => ({
        ...prev,
        [relKey]: { ...prev[relKey], showFileName: nextVal }
      }))
      metadataEngine.setShowFileName(rel, nextVal)
      setTimeout(() => {
        void handleSaveActiveFile()
      }, 50)
    } else {
      setGlobalShowFileName((prev) => {
        const next = !prev
        try {
          localStorage.setItem('oink_global_show_file_name', String(next))
        } catch {
          // ignore
        }
        return next
      })
    }
  }, [
    isOnlyThisFile,
    activeFilePath,
    workspacePath,
    effectiveShowFileName,
    setFileMetadataMap,
    handleSaveActiveFile
  ])

  const handleMetadataLoaded = useCallback(
    (filePath: string, metadata: MarkdownMetadata): void => {
      const rel = getRelativePath(filePath, workspacePath)
      const relKey = rel.toLowerCase()
      if (metadata.icon) {
        setFileIcons((prev) => ({ ...prev, [relKey]: metadata.icon! }))
      }
      if (metadata.banner) {
        setFileBanners((prev) => ({ ...prev, [relKey]: metadata.banner! }))
      }
      setFileMetadataMap((prev) => ({
        ...prev,
        [relKey]: { ...prev[relKey], ...metadata }
      }))
    },
    [workspacePath, setFileIcons, setFileBanners, setFileMetadataMap]
  )

  // 13. Wikilink Navigation
  const handleWikilinkClick = useCallback(
    async (targetName: string): Promise<void> => {
      if (!workspacePath) return
      const cleanName = targetName.replace(/^\[\[|\]\]$/g, '').trim()
      const targetFileName = cleanName.endsWith('.md') ? cleanName : `${cleanName}.md`

      try {
        const targetPath = `${workspacePath}/${targetFileName}`
        const normPath = normalizePath(targetPath)!
        let exists = false
        try {
          await window.api.fs.readFile(normPath)
          exists = true
        } catch {
          exists = false
        }

        if (exists) {
          await handleFileSelect(normPath)
        } else {
          const create = confirm(
            `File "${targetFileName}" does not exist. Would you like to create it?`
          )
          if (create) {
            const newPath = await window.api.fs.createFile(workspacePath, targetFileName)
            await handleFileSelect(newPath)
          }
        }
      } catch (err) {
        console.error('Error navigating wikilink:', err)
      }
    },
    [workspacePath, handleFileSelect]
  )

  // 14. Document Exports & Utilities
  const handleToggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => {
      const next = !prev
      try {
        window.api?.window?.toggleFullScreen?.()
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const handleToggleLockPage = useCallback(() => {
    setIsPageLocked((prev) => !prev)
  }, [])

  const handleExportHTML = useCallback(async () => {
    if (!activeFilePath) return
    const rawContent = fileContents[activeFilePath] || ''
    const baseName = activeFilePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') || 'document'
    const htmlBody = markdownToHtml(rawContent)
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${baseName}</title>
  <style>
    body {
      font-family: ${editorFontFamily};
      font-size: ${editorFontSize}px;
      line-height: 1.65;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      color: #e4e4e7;
      background: #18181b;
    }
    h1, h2, h3, h4, h5, h6 { color: #f4f4f5; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; }
    h1 { font-size: 2.2em; border-bottom: 1px solid #27272a; padding-bottom: 0.3em; }
    h2 { font-size: 1.6em; border-bottom: 1px solid #27272a; padding-bottom: 0.3em; }
    h3 { font-size: 1.3em; }
    p { margin-bottom: 1em; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { background: #27272a; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    pre { background: #27272a; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 1em 0; }
    blockquote { border-left: 4px solid #3b82f6; margin: 1em 0; padding: 0.5em 1em; color: #a1a1aa; background: #202023; border-radius: 0 4px 4px 0; }
    ul, ol { padding-left: 2em; margin-bottom: 1em; }
    li { margin-bottom: 0.3em; }
    hr { border: none; border-top: 1px solid #27272a; margin: 2em 0; }
    img { max-width: 100%; border-radius: 6px; margin: 1em 0; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    th, td { border: 1px solid #27272a; padding: 8px 12px; text-align: left; }
    th { background: #202023; }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`
    try {
      const savePath = await window.api.fs.showSaveDialog(`${baseName}.html`)
      if (savePath) {
        await window.api.fs.writeFile(savePath, fullHtml)
      }
    } catch (err) {
      alert(`Export HTML error: ${err}`)
    }
  }, [activeFilePath, fileContents, editorFontFamily, editorFontSize])

  const handleExportText = useCallback(async () => {
    if (!activeFilePath) return
    const rawContent = fileContents[activeFilePath] || ''
    const baseName = activeFilePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') || 'document'
    const plainText = stripFrontmatter(rawContent).replace(/[#*_`~[\]()]/g, '')
    try {
      const savePath = await window.api.fs.showSaveDialog(`${baseName}.txt`)
      if (savePath) {
        await window.api.fs.writeFile(savePath, plainText)
      }
    } catch (err) {
      alert(`Export Text error: ${err}`)
    }
  }, [activeFilePath, fileContents])

  const handleExportMarkdown = useCallback(async () => {
    if (!activeFilePath) return
    const rawContent = fileContents[activeFilePath] || ''
    const baseName = activeFilePath.split(/[\\/]/).pop() || 'document.md'
    try {
      const savePath = await window.api.fs.showSaveDialog(baseName)
      if (savePath) {
        await window.api.fs.writeFile(savePath, rawContent)
      }
    } catch (err) {
      alert(`Export Markdown error: ${err}`)
    }
  }, [activeFilePath, fileContents])

  const handleCopyLink = useCallback(() => {
    if (!activeFilePath) return
    const baseName = activeFilePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') || 'document'
    navigator.clipboard.writeText(`[[${baseName}]]`)
  }, [activeFilePath])

  const handleImportFile = useCallback(async () => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.md,.markdown,.txt,.json'
      input.onchange = async (e: Event): Promise<void> => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        const text = await file.text()
        const fileName = file.name
        if (workspacePath) {
          const newPath = normalizePath(`${workspacePath}/${fileName}`)
          await window.api.fs.writeFile(newPath, text)
          await handleFileSelect(newPath)
        }
      }
      input.click()
    } catch (err) {
      alert(`Import error: ${err}`)
    }
  }, [workspacePath, handleFileSelect])

  // 15. Global Application Keyboard Shortcuts Hook
  useGlobalShortcuts({
    isFullScreen,
    activeFilePath,
    onSaveActiveFile: (): void => {
      void handleSaveActiveFile()
    },
    onOpenWorkspace: (): void => {
      void onOpenWorkspaceClick()
    },
    onCreateFileAtRoot: (): void => {
      void handleCreateFileAtRoot()
    },
    onCloseActiveTab: handleTabClose,
    onToggleFullScreen: handleToggleFullScreen,
    onToggleSearch: handleToggleSearch,
    onToggleSettings: (): void => setShowSettingsModal((prev) => !prev)
  })

  // 16. State Persistence Sync
  useEffect(() => {
    saveState({
      workspacePath,
      workspaceName,
      activeFilePath,
      openFiles,
      viewMode,
      autoSaveEnabled,
      sidebarCollapsed,
      sidebarWidth,
      showRightSidebar,
      rightSidebarWidth,
      widgetState,
      widgetZIndexes,
      widgetPositions
    })

    if (workspacePath) {
      metadataEngine.setWorkspaceInfo({ name: workspaceName })
      metadataEngine.setSessionState({
        activeFilePath,
        openFiles,
        viewMode,
        autoSaveEnabled,
        sidebarCollapsed,
        sidebarWidth,
        showRightSidebar,
        rightSidebarWidth,
        widgetState,
        widgetZIndexes,
        widgetPositions
      })
    }
  }, [
    workspacePath,
    workspaceName,
    activeFilePath,
    openFiles,
    viewMode,
    autoSaveEnabled,
    sidebarCollapsed,
    sidebarWidth,
    showRightSidebar,
    rightSidebarWidth,
    widgetState,
    widgetZIndexes,
    widgetPositions,
    saveState
  ])

  const handleSelectRailTab = useCallback(
    (tab: ActivityRailTab) => {
      setRailTab(tab)
      if (tab === 'home') {
        setActiveFilePath(null)
        setViewMode('editor')
        setSidebarView('explorer')
      } else if (tab === 'graph') {
        setViewMode('graph')
      } else if (tab === 'plugins') {
        setViewMode('editor')
        setSidebarView('plugins')
      } else if (tab === 'search') {
        setViewMode('editor')
        setSidebarView('search')
      } else if (tab === 'explorer') {
        setViewMode('editor')
        setSidebarView('explorer')
      }
    },
    [setActiveFilePath]
  )

  const activeUnsaved = activeFilePath
    ? !!unsavedFiles[normalizePath(activeFilePath)] ||
      fileContents[activeFilePath] !== originalFileContents[activeFilePath]
    : false

  const activeFileIcon = activeFilePath ? fileIcons[activeRelKey] : undefined
  const activeFileBanner = activeFilePath ? fileBanners[activeRelKey] : undefined

  return (
    <div className={`app-container ${isFullScreen ? 'distraction-free-fullscreen' : ''}`}>
      {/* Floating Exit Fullscreen Button in Distraction-Free Mode */}
      {isFullScreen && (
        <div className="fullscreen-exit-wrapper">
          <button
            type="button"
            className="exit-fullscreen-floating-btn"
            onClick={handleToggleFullScreen}
            title="Exit Full Screen (Esc / F11)"
          >
            <Minimize2 size={13} />
            <span>Exit Full Screen</span>
          </button>
        </div>
      )}

      {/* ====== 1. TOP WINDOW TITLEBAR ====== */}
      <TopHeader
        onOpenSettings={(): void => setShowSettingsModal(true)}
        viewMode={viewMode}
        onToggleViewMode={(): void => setViewMode((m) => (m === 'graph' ? 'editor' : 'graph'))}
        setViewMode={setViewMode}
        sidebarView={sidebarView}
        sidebarCollapsed={effectiveSidebarCollapsed}
        onTogglePluginsView={handleTogglePluginsView}
        onSwitchToFiles={handleSwitchToFiles}
        enabledPluginsCount={Object.values(enabledPlugins).filter(Boolean).length}
        showTabs={showTabs}
        onToggleTabs={(): void => setShowTabs((p) => !p)}
        showRightSidebar={showRightSidebar}
        onToggleRightSidebar={(): void => setShowRightSidebar((p) => !p)}
        widgetState={widgetState}
        onToggleWidget={handleToggleWidget}
        activeUnsaved={activeUnsaved}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={(): void => setAutoSaveEnabled((p) => !p)}
        showCover={effectiveShowCover}
        showIcon={effectiveShowIcon}
        showFileName={effectiveShowFileName}
        isOnlyThisFile={isOnlyThisFile}
        activeFilePath={activeFilePath}
        onToggleCover={handleToggleCover}
        onToggleIcon={handleToggleIcon}
        onToggleFileName={handleToggleFileName}
        onToggleOnlyThisFile={handleToggleOnlyThisFile}
      />

      {/* ====== 2. MAIN APP BODY CONTAINER ====== */}
      <div className="app-body flex flex-1 min-h-0 min-w-0 overflow-hidden">
        {/* Activity Rail Wrapper with Over-the-edge Toggle Button */}
        <div
          className={`activity-rail-wrapper relative flex shrink-0 ${activityRailCollapsed ? 'rail-collapsed' : ''}`}
        >
          {/* Activity Rail on the far left - spans from SubHeader/Tabs level down to window bottom */}
          <ActivityRail
            activeTab={railTab}
            onSelectTab={handleSelectRailTab}
            sidebarCollapsed={effectiveSidebarCollapsed}
            onToggleSidebar={handleToggleSidebar}
            onOpenSettings={(): void => setShowSettingsModal(true)}
            enabledPluginsCount={Object.values(enabledPlugins).filter(Boolean).length}
            onToggleSearch={(): void =>
              setSidebarView((prev) => (prev === 'search' ? 'explorer' : 'search'))
            }
          />

          {/* Over-the-edge Open / Close Button */}
          <button
            type="button"
            className="activity-rail-edge-toggle"
            onClick={(): void => setActivityRailCollapsed((prev) => !prev)}
            title={activityRailCollapsed ? 'Expand Activity Rail' : 'Collapse Activity Rail'}
          >
            {activityRailCollapsed ? (
              <ChevronRight size={10} strokeWidth={2.2} />
            ) : (
              <ChevronLeft size={10} strokeWidth={2.2} />
            )}
          </button>
        </div>

        {/* App Content Column (SubHeader + Workspace) */}
        <div className="app-content-column flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
          {/* Sub-Header Actions & Breadcrumbs / Tabs Bar */}
          <SubHeader
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={handleToggleSidebar}
            onSidebarHoverEnter={handleSidebarHoverEnter}
            onSidebarHoverLeave={handleSidebarHoverLeave}
            workspacePath={workspacePath}
            workspaceName={workspaceName}
            activeFilePath={activeFilePath}
            openFiles={openFiles}
            unsavedFiles={unsavedFiles}
            fileIcons={fileIcons}
            onTabSelect={handleTabSelect}
            onTabClose={handleTabClose}
            onOpenWorkspace={(): void => {
              void onOpenWorkspaceClick()
            }}
            autoSaveEnabled={autoSaveEnabled}
            onToggleAutoSave={(): void => setAutoSaveEnabled((p) => !p)}
            onExportHTML={(): void => {
              void handleExportHTML()
            }}
            onExportText={(): void => {
              void handleExportText()
            }}
            onExportMarkdown={(): void => {
              void handleExportMarkdown()
            }}
            onCopyLink={handleCopyLink}
            statsConfig={statsConfig}
            onToggleStat={handleToggleStat}
            showCover={effectiveShowCover}
            showIcon={effectiveShowIcon}
            showFileName={effectiveShowFileName}
            isOnlyThisFile={isOnlyThisFile}
            onToggleCover={handleToggleCover}
            onToggleIcon={handleToggleIcon}
            onToggleFileName={handleToggleFileName}
            onToggleOnlyThisFile={handleToggleOnlyThisFile}
            fileContent={activeFilePath ? fileContents[normalizePath(activeFilePath)] : ''}
            editorFontFamily={editorFontFamily}
            onChangeFontFamily={handleFontFamilyChange}
            editorFontSize={editorFontSize}
            onChangeFontSize={handleFontSizeChange}
            editorLineHeight={editorLineHeight}
            onChangeLineHeight={handleLineHeightChange}
            editorLetterSpacing={editorLetterSpacing}
            onChangeLetterSpacing={handleLetterSpacingChange}
            editorParagraphSpacing={editorParagraphSpacing}
            onChangeParagraphSpacing={handleParagraphSpacingChange}
            editorFontWeight={editorFontWeight}
            onChangeFontWeight={handleFontWeightChange}
            editorTextAlign={editorTextAlign}
            onChangeTextAlign={handleTextAlignChange}
            isFullScreen={isFullScreen}
            onToggleFullScreen={handleToggleFullScreen}
            isPageLocked={isPageLocked}
            onToggleLockPage={handleToggleLockPage}
            onDuplicateFile={(): void => {
              void handleDuplicateFile()
            }}
            onDeleteFile={(): void => {
              void handleDeleteFile()
            }}
            onUndo={handleTriggerUndo}
            onImport={(): void => {
              void handleImportFile()
            }}
          />

          {/* Main App Workspace */}
          <div className="app-main flex flex-1 min-h-0 overflow-hidden">
            {/* Sidebar Panel */}
            <Sidebar
              activeView={sidebarView}
              sidebarCollapsed={effectiveSidebarCollapsed}
              sidebarWidth={sidebarWidth}
              isResizing={isResizingLeft}
              workspacePath={workspacePath}
              workspaceName={workspaceName}
              workspaceIcons={workspaceIcons}
              onSetWorkspaceIcon={handleSetWorkspaceIcon}
              recentWorkspaces={recentWorkspaces}
              activeFilePath={activeFilePath}
              onFileSelect={(f): void => {
                void handleFileSelect(f)
              }}
              onCreateFileAtRoot={(): void => {
                void handleCreateFileAtRoot()
              }}
              onOpenWorkspace={(): void => {
                void onOpenWorkspaceClick()
              }}
              onCloseWorkspace={onCloseWorkspaceClick}
              onSwitchWorkspace={onSwitchWorkspaceClick}
              onRemoveRecentWorkspace={handleRemoveRecentWorkspace}
              onRenameWorkspace={onRenameWorkspaceClick}
              fileIcons={fileIcons}
              onMetadataLoaded={handleMetadataLoaded}
              onStartResize={startLeftResize}
              enabledPlugins={enabledPlugins}
              onTogglePlugin={handleTogglePlugin}
              onOpenSettings={(): void => setShowSettingsModal(true)}
              onSwitchView={setSidebarView}
              onMouseEnter={handleSidebarHoverEnter}
              onMouseLeave={handleSidebarHoverLeave}
              onToggleSidebar={handleToggleSidebar}
            />

            {/* Editor Workspace & Split Area */}
            <div
              className={`editor-workspace ${effectiveSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
            >
              {viewMode !== 'graph' && showTabs && (
                <div className="editor-top-nav">
                  <TabBar
                    openFiles={openFiles}
                    activeFilePath={activeFilePath}
                    fileIcons={fileIcons}
                    workspacePath={workspacePath}
                    unsavedFiles={unsavedFiles}
                    onTabSelect={handleTabSelect}
                    onTabClose={handleTabClose}
                    onCreateFileAtRoot={(): void => {
                      void handleCreateFileAtRoot()
                    }}
                  />
                </div>
              )}

              <div className="editor-center-split">
                {viewMode === 'graph' && workspacePath ? (
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center flex-1 text-zinc-500 text-xs italic">
                        Loading Knowledge Graph...
                      </div>
                    }
                  >
                    <GraphView
                      workspacePath={workspacePath}
                      onNodeClick={(nodeId): void => void handleFileSelect(nodeId)}
                      onClose={(): void => setViewMode('editor')}
                    />
                  </Suspense>
                ) : activeFilePath ? (
                  <div className="editor-writing-viewport">
                    <div
                      className="editor-container"
                      style={
                        {
                          '--editor-font-family': editorFontFamily,
                          '--editor-font-size': `${editorFontSize}px`,
                          '--editor-line-height': editorLineHeight,
                          '--editor-letter-spacing': editorLetterSpacing,
                          '--editor-paragraph-spacing': editorParagraphSpacing,
                          '--editor-font-weight': editorFontWeight,
                          '--editor-text-align': editorTextAlign
                        } as React.CSSProperties
                      }
                    >
                      {/* Notion-style Full-Width Cover Banner */}
                      {effectiveShowCover && activeFileBanner && (
                        <div
                          className="notion-cover-banner group"
                          style={
                            activeFileBanner.startsWith('linear-gradient')
                              ? { background: activeFileBanner }
                              : {
                                  backgroundImage: `url("${activeFileBanner}")`,
                                  backgroundPosition: 'center',
                                  backgroundSize: 'cover',
                                  backgroundRepeat: 'no-repeat'
                                }
                          }
                        >
                          <div className="notion-cover-actions opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="notion-cover-btn"
                              onClick={(): void => setShowBannerPicker((prev) => !prev)}
                            >
                              <Image size={12} strokeWidth={1.75} className="shrink-0 opacity-80" />
                              <span>Change cover</span>
                            </button>
                            <button
                              className="notion-cover-btn"
                              onClick={(): void => {
                                if (!activeFilePath) return
                                const rel = getRelativePath(
                                  activeFilePath,
                                  workspacePath
                                ).toLowerCase()
                                setFileBanners((prev) => {
                                  const updated = { ...prev }
                                  delete updated[rel]
                                  return updated
                                })
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}

                      <div
                        className={`editor-wrapper ${effectiveShowCover && activeFileBanner ? 'has-cover' : ''}`}
                      >
                        {/* Notion-style Page Header */}
                        <NotionPageHeader
                          activeFilePath={activeFilePath}
                          workspacePath={workspacePath}
                          effectiveShowCover={effectiveShowCover}
                          effectiveShowIcon={effectiveShowIcon}
                          effectiveShowFileName={effectiveShowFileName}
                          activeFileBanner={activeFileBanner}
                          activeFileIcon={activeFileIcon}
                          isPageLocked={isPageLocked}
                          onSetFileIcon={handleSetFileIcon}
                          onSetFileBanner={handleSetFileBanner}
                          onRenameActiveFile={handleRenameActiveFile}
                        />

                        <BlockEditor
                          value={fileContents[activeFilePath] || ''}
                          readOnly={isPageLocked}
                          workspacePath={workspacePath}
                          maxUndoHistory={maxUndoHistory}
                          onChange={(value): void => {
                            if (activeFilePath) {
                              const norm = normalizePath(activeFilePath)
                              setFileContents((prev) => ({
                                ...prev,
                                [activeFilePath]: value,
                                [norm]: value
                              }))
                            }
                          }}
                          activeFilePath={activeFilePath}
                          onWikilinkClick={handleWikilinkClick}
                        />
                      </div>
                    </div>

                    {/* Floating Stats & Autosave Pill */}
                    <StatusBar
                      activeFilePath={activeFilePath}
                      activeFileContent={activeFilePath ? fileContents[activeFilePath] : undefined}
                      stats={workerStats}
                      autoSaveEnabled={autoSaveEnabled}
                      activeUnsaved={activeUnsaved}
                      statsConfig={statsConfig}
                    />
                  </div>
                ) : (
                  <WelcomeScreen
                    workspacePath={workspacePath}
                    workspaceName={workspaceName}
                    onFileSelect={(f): void => {
                      void handleFileSelect(f)
                    }}
                    onCreateFileAtRoot={(): void => {
                      void handleCreateFileAtRoot()
                    }}
                    fileIcons={fileIcons}
                  />
                )}

                {/* ====== FLOATING WIDGET WINDOWS OVERLAY ====== */}
                <FloatingWidgetsOverlay
                  viewMode={viewMode}
                  widgetState={widgetState}
                  widgetZIndexes={widgetZIndexes}
                  widgetPositions={widgetPositions}
                  activeFilePath={activeFilePath}
                  workspacePath={workspacePath}
                  fileContents={fileContents}
                  headings={workerHeadings}
                  onUpdateFileContent={(filePath, content): void => {
                    setFileContents((prev) => ({ ...prev, [filePath]: content }))
                  }}
                  bringWidgetToFront={bringWidgetToFront}
                  handleToggleWidget={handleToggleWidget}
                  handleWidgetLayoutChange={handleWidgetLayoutChange}
                  onInsertSnippet={(snippetText): void => {
                    if (activeFilePath) {
                      setFileContents((prev) => ({
                        ...prev,
                        [activeFilePath]: (prev[activeFilePath] || '') + '\n\n' + snippetText
                      }))
                    }
                  }}
                  onDockOutline={(): void => {
                    setWidgetState((prev) => ({ ...prev, outline: false }))
                    setShowRightSidebar(true)
                  }}
                />

                {/* ====== RIGHT SIDEBAR PANEL (OUTLINE) ====== */}
                {viewMode !== 'graph' && (
                  <div
                    className={`right-sidebar-panel ${!showRightSidebar ? 'is-collapsed' : ''} ${
                      isResizingRight ? 'is-resizing' : ''
                    }`}
                    style={{ width: showRightSidebar ? rightSidebarWidth : 0 }}
                  >
                    <div
                      className="sidebar-resize-handle sidebar-resize-handle-left"
                      onMouseDown={startRightResize}
                    />
                    <div className="right-sidebar-header">
                      <div className="flex items-center gap-2">
                        <ListTree size={13} strokeWidth={1.75} className="text-zinc-400 shrink-0" />
                        <span className="text-xs font-medium text-zinc-200">Outline</span>
                      </div>
                      <div className="right-sidebar-header-actions">
                        <button
                          className="right-sidebar-btn"
                          onClick={(): void => {
                            setShowRightSidebar(false)
                            setWidgetState((prev) => ({ ...prev, outline: true }))
                            bringWidgetToFront('outline')
                          }}
                          title="Pop out to floating window"
                        >
                          <AppWindow size={13} strokeWidth={1.75} />
                        </button>
                        <button
                          className="right-sidebar-btn"
                          onClick={(): void => setShowRightSidebar(false)}
                          title="Close Outline"
                        >
                          <X size={13} strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                    <div className="right-sidebar-content">
                      {activeFilePath ? (
                        <OutlineWidget
                          content={fileContents[activeFilePath] || ''}
                          headings={workerHeadings}
                        />
                      ) : (
                        <div className="text-zinc-600 text-center py-8 text-[11px]">
                          No file open
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popovers */}
      {showBannerPicker && (
        <BannerPicker
          onSelect={(bannerUrl): void => {
            if (activeRelKey) handleSetFileBanner(activeRelKey, bannerUrl)
            setShowBannerPicker(false)
          }}
          onClose={(): void => setShowBannerPicker(false)}
        />
      )}

      {/* ====== PREFERENCES & SETTINGS MODAL ====== */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={(): void => setShowSettingsModal(false)}
        currentAutoSave={autoSaveEnabled}
        onToggleAutoSave={(): void => setAutoSaveEnabled((p) => !p)}
        editorFontFamily={editorFontFamily}
        editorFontSize={editorFontSize}
        onFontFamilyChange={handleFontFamilyChange}
        onFontSizeChange={handleFontSizeChange}
        maxUndoHistory={maxUndoHistory}
        onMaxUndoHistoryChange={setMaxUndoHistory}
        enabledPlugins={enabledPlugins}
        onTogglePlugin={handleTogglePlugin}
      />
    </div>
  )
}
