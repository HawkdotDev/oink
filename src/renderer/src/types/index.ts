export interface MarkdownMetadata {
  icon?: string
  banner?: string
  showIcon?: boolean
  showCover?: boolean
  showFileName?: boolean
}

export interface OinkFileMetadata extends MarkdownMetadata {
  title?: string
  tags?: string[]
  aliases?: string[]
  isFavorite?: boolean
  isPinned?: boolean
  isLocked?: boolean
  wordCount?: number
  charCount?: number
  readingTimeMinutes?: number
  createdAt?: number
  lastEditedTime?: number
  customProps?: Record<string, unknown>
}

export interface OinkWorkspaceInfo {
  name: string
  id: string
  icon?: string
  description?: string
  createdAt: number
  updatedAt: number
}

export interface OinkWorkspaceSession {
  activeFilePath?: string | null
  openFiles?: OpenFileInfo[]
  recentFiles?: string[]
  viewMode?: ViewMode
  sidebarCollapsed?: boolean
  sidebarWidth?: number
  showRightSidebar?: boolean
  rightSidebarWidth?: number
  showTabs?: boolean
  autoSaveEnabled?: boolean
  widgetState?: WidgetState
  widgetPositions?: Record<string, WidgetLayout>
  widgetZIndexes?: Record<string, number>
}

export interface OinkWorkspaceConfig {
  name?: string
  description?: string
  version?: string
  theme?: {
    mode?: 'dark' | 'light' | 'system'
    accentColor?: string
    background?: string
    surface?: string
    sidebarBg?: string
    fontFamily?: string
  }
  editor?: {
    fontFamily?: string
    fontSize?: number
    lineHeight?: string
    letterSpacing?: string
    paragraphSpacing?: string
    fontWeight?: string
    textAlign?: string
    maxUndoHistory?: number
    autoSave?: boolean
    autoSaveIntervalMs?: number
  }
  markdown?: {
    wikilinks?: boolean
    strikethrough?: boolean
    autoCloseBrackets?: boolean
    tableOfContentsDepth?: number
  }
  excludePatterns?: string[]
  plugins?: Record<string, boolean>
  customCSS?: string
  keybindings?: Record<string, string>
  export?: {
    defaultFormat?: 'markdown' | 'html' | 'text'
    includeFrontmatter?: boolean
    pageWidth?: string
  }
  hooks?: {
    onWorkspaceOpen?: string
    onFileSave?: string
  }
}

export interface StoredWorkspaceMetadataFile {
  version: number
  appVersion?: string
  updatedAt: number
  workspace?: OinkWorkspaceInfo
  session?: OinkWorkspaceSession
  files?: Record<string, OinkFileMetadata>
  tags?: Record<string, { color?: string; description?: string; count?: number }>
  icons?: Record<string, string>
  banners?: Record<string, string>
  showCover?: Record<string, boolean | undefined>
  showIcon?: Record<string, boolean | undefined>
  showFileName?: Record<string, boolean | undefined>
  customProps?: Record<string, Record<string, unknown>>
}

export interface ParsedDocument {
  metadata: MarkdownMetadata
  content: string
  title: string
}

export interface OpenFileInfo {
  path: string
  name: string
}

export interface FileNode {
  name: string
  path: string
  isDir: boolean
}

export interface ContextMenuState {
  x: number
  y: number
  path: string
  isDir: boolean
  parentPath: string
}

export type ViewMode = 'editor' | 'graph'

export type TerminalTabType = 'PROBLEMS' | 'OUTPUT' | 'TERMINAL' | 'DEBUG CONSOLE'

export interface StatusStatsConfig {
  showWords: boolean
  showLines: boolean
  showChars: boolean
  showSpaces: boolean
  showReadingTime: boolean
  showLanguage: boolean
  showSavedBadge: boolean
}

export interface WidgetState {
  assistant: boolean
  stats: boolean
  terminal: boolean
  snippets: boolean
  outline: boolean
}

export interface WidgetLayout {
  x: number
  y: number
  width: number
  height: number
}

export interface PersistentAppState {
  workspacePath: string | null
  workspaceName: string
  activeFilePath: string | null
  openFiles: OpenFileInfo[]
  viewMode: ViewMode
  autoSaveEnabled: boolean
  sidebarCollapsed: boolean
  sidebarWidth: number
  showRightSidebar: boolean
  rightSidebarWidth: number
  sidebarView?: 'explorer' | 'search' | 'plugins'
  showSearchInput?: boolean
  showDiffToggle?: boolean
  showCover?: boolean
  showIcon?: boolean
  showFileName?: boolean
  searchQuery?: string
  widgetState: WidgetState
  widgetZIndexes: Record<string, number>
  widgetPositions: Record<string, WidgetLayout>
}
