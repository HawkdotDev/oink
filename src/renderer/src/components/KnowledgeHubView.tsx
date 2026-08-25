import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Folder,
  FolderPlus,
  FilePlus,
  ChevronDown,
  ChevronRight,
  FileText,
  Search,
  ArrowLeft
} from 'lucide-react'
import { normalizePath, getRelativePath } from '../utils/pathUtils'
import { ProfessionalFileIcon } from '../utils/fileIconUtils'

export interface KnowledgeHubItem {
  name: string
  path: string
  isDir: boolean
  size?: number
  updatedAt?: number
  author?: string
  authorAvatar?: string
  fileCount?: number
  badgeIcons?: string[]
}

interface KnowledgeHubViewProps {
  workspacePath: string | null
  workspaceName?: string
  onFileSelect: (filePath: string) => void
  onCreateFileAtRoot?: () => void
  fileIcons?: Record<string, string>
}

// Sample fallback authors for rich visual presentation matching reference design
const SAMPLE_AUTHORS = [
  {
    name: 'kevin@mail.com',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces'
  },
  {
    name: 'antonwe@gmail.com',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces'
  },
  {
    name: 'sarah@company.io',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces'
  },
  {
    name: 'david.dev@oink.app',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces'
  }
]

function KnowledgeHubView({
  workspacePath,
  workspaceName,
  onFileSelect,
  fileIcons = {}
}: KnowledgeHubViewProps): React.JSX.Element {
  const [selectedSubDir, setSelectedSubDir] = useState<string | null>(null)
  const currentDir = selectedSubDir ?? workspacePath ?? ''

  const [items, setItems] = useState<KnowledgeHubItem[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [newFolderName, setNewFolderName] = useState<string>('')
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false)
  const [showNewFileModal, setShowNewFileModal] = useState<boolean>(false)
  const [newFileName, setNewFileName] = useState<string>('')
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false)
  const [refreshTick, setRefreshTick] = useState<number>(0)

  // Load directory contents
  useEffect(() => {
    let isMounted = true
    if (!currentDir) return

    const fetchDirectory = async (): Promise<void> => {
      try {
        if (window.api?.fs?.readDirectory) {
          const rawEntries = await window.api.fs.readDirectory(currentDir)
          const parsedItems: KnowledgeHubItem[] = await Promise.all(
            rawEntries
              .filter((entry) => !entry.name.startsWith('.'))
              .map(async (entry, index) => {
                let childCount = 0
                if (entry.isDir) {
                  try {
                    const children = await window.api.fs.readDirectory(entry.path)
                    childCount = children.filter((c) => !c.name.startsWith('.')).length
                  } catch {
                    childCount = 0
                  }
                }
                const authorData = SAMPLE_AUTHORS[index % SAMPLE_AUTHORS.length]
                return {
                  name: entry.name,
                  path: normalizePath(entry.path),
                  isDir: entry.isDir,
                  fileCount: entry.isDir ? childCount : undefined,
                  author: authorData.name,
                  authorAvatar: authorData.avatar
                }
              })
          )
          if (isMounted) {
            setItems(parsedItems)
          }
        }
      } catch (err) {
        console.error('Failed to load directory items:', err)
      }
    }

    void fetchDirectory()

    return (): void => {
      isMounted = false
    }
  }, [currentDir, refreshTick])

  // Folder navigation
  const handleNavigateFolder = useCallback((folderPath: string): void => {
    setSelectedSubDir(normalizePath(folderPath))
  }, [])

  const handleNavigateUp = useCallback((): void => {
    if (!workspacePath || normalizePath(currentDir) === normalizePath(workspacePath)) return
    const parent = currentDir.substring(
      0,
      Math.max(currentDir.lastIndexOf('/'), currentDir.lastIndexOf('\\'))
    )
    if (parent && parent.length >= workspacePath.length) {
      setSelectedSubDir(normalizePath(parent))
    } else {
      setSelectedSubDir(null)
    }
  }, [currentDir, workspacePath])

  // Split into folders and files
  const folders = useMemo(() => items.filter((item) => item.isDir), [items])
  const files = useMemo(() => items.filter((item) => !item.isDir), [items])

  // Filtered lists
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders
    const q = searchQuery.toLowerCase()
    return folders.filter((f) => f.name.toLowerCase().includes(q))
  }, [folders, searchQuery])

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files
    const q = searchQuery.toLowerCase()
    return files.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.author && f.author.toLowerCase().includes(q))
    )
  }, [files, searchQuery])

  // Breadcrumbs calculation
  const breadcrumbs = useMemo(() => {
    if (!workspacePath) return []
    const normWs = normalizePath(workspacePath)
    const normCur = normalizePath(currentDir)
    if (!normCur.startsWith(normWs)) {
      return [{ name: workspaceName || 'Workspace', path: normWs }]
    }
    const rel = normCur.slice(normWs.length).replace(/^[/\\]/, '')
    if (!rel) {
      return [{ name: workspaceName || 'Workspace', path: normWs }]
    }
    const segments = rel.split('/').filter(Boolean)
    const crumbs = [{ name: workspaceName || 'Workspace', path: normWs }]
    let acc = normWs
    for (const seg of segments) {
      acc = `${acc}/${seg}`
      crumbs.push({ name: seg, path: acc })
    }
    return crumbs
  }, [workspacePath, workspaceName, currentDir])

  const currentFolderName =
    breadcrumbs.length > 0
      ? breadcrumbs[breadcrumbs.length - 1].name
      : workspaceName || 'General Knowledge'

  // Handle create folder
  const handleCreateFolder = useCallback(async (): Promise<void> => {
    if (!newFolderName.trim() || !currentDir) return
    try {
      if (window.api?.fs?.createFolder) {
        await window.api.fs.createFolder(currentDir, newFolderName.trim())
        setNewFolderName('')
        setShowNewFolderModal(false)
        setRefreshTick((t) => t + 1)
      }
    } catch (err) {
      alert(`Error creating folder: ${err}`)
    }
  }, [newFolderName, currentDir])

  // Handle create file
  const handleCreateFile = useCallback(async (): Promise<void> => {
    if (!newFileName.trim() || !currentDir) return
    try {
      if (window.api?.fs?.createFile) {
        const name = newFileName.trim().endsWith('.md')
          ? newFileName.trim()
          : `${newFileName.trim()}.md`
        const newPath = await window.api.fs.createFile(currentDir, name)
        setNewFileName('')
        setShowNewFileModal(false)
        setRefreshTick((t) => t + 1)
        onFileSelect(normalizePath(newPath))
      }
    } catch (err) {
      alert(`Error creating note: ${err}`)
    }
  }, [newFileName, currentDir, onFileSelect])

  return (
    <div className="knowledge-hub-container select-none">
      {/* ====== 1. TOP HEADER & BREADCRUMB DROPDOWN ====== */}
      <div className="knowledge-hub-header flex items-center justify-between">
        {/* Left: Folder Dropdown / Breadcrumbs Title */}
        <div className="flex items-center gap-3">
          {normalizePath(currentDir) !== normalizePath(workspacePath || '') && (
            <button
              type="button"
              className="hub-back-btn"
              onClick={handleNavigateUp}
              title="Go up one folder"
            >
              <ArrowLeft size={14} />
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              className="hub-folder-dropdown-btn flex items-center gap-2"
              onClick={(): void => setDropdownOpen((p) => !p)}
            >
              <span className="hub-folder-title">{currentFolderName}</span>
              <ChevronDown
                size={14}
                className={`text-zinc-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className="hub-breadcrumbs-popover">
                <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 py-1.5">
                  Location Hierarchy
                </div>
                {breadcrumbs.map((crumb, idx) => (
                  <button
                    key={crumb.path}
                    type="button"
                    className={`hub-popover-item ${idx === breadcrumbs.length - 1 ? 'active' : ''}`}
                    onClick={(): void => {
                      handleNavigateFolder(crumb.path)
                      setDropdownOpen(false)
                    }}
                  >
                    <Folder size={13} className="text-zinc-400 shrink-0" />
                    <span className="truncate">{crumb.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Search & Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Search Box */}
          <div className="hub-search-box flex items-center gap-2">
            <Search size={13} className="text-zinc-400 shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e): void => setSearchQuery(e.target.value)}
              className="hub-search-input"
            />
          </div>

          {/* New Folder Button */}
          <button
            type="button"
            className="hub-action-btn"
            onClick={(): void => setShowNewFolderModal(true)}
            title="Create New Folder"
          >
            <FolderPlus size={14} className="text-zinc-300" />
            <span>Folder</span>
          </button>

          {/* New File Button */}
          <button
            type="button"
            className="hub-action-btn primary"
            onClick={(): void => setShowNewFileModal(true)}
            title="Create New Page"
          >
            <FilePlus size={14} />
            <span>New Page</span>
          </button>
        </div>
      </div>

      {/* ====== 2. MAIN SCROLLABLE CONTENT ====== */}
      <div className="knowledge-hub-content flex-1 overflow-y-auto">
        {/* ====== SECTION A: FOLDERS GRID ====== */}
        <div className="hub-section mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="hub-section-heading">Folders</h2>
            {filteredFolders.length > 0 && (
              <span className="text-xs text-zinc-500 font-medium">
                {filteredFolders.length} {filteredFolders.length === 1 ? 'Folder' : 'Folders'}
              </span>
            )}
          </div>

          {filteredFolders.length > 0 ? (
            <div className="hub-folder-grid">
              {filteredFolders.map((folder) => {
                const count = folder.fileCount ?? 0
                return (
                  <div
                    key={folder.path}
                    className="hub-folder-card group"
                    onClick={(): void => handleNavigateFolder(folder.path)}
                  >
                    {/* Rich 3D / Layered Folder Graphic Matching Reference Image */}
                    <div className="folder-3d-visual">
                      {/* Stacked Paper Sheets Peeking Out */}
                      <div className="folder-sheet sheet-3" />
                      <div className="folder-sheet sheet-2">
                        <div className="sheet-mini-lines" />
                      </div>
                      <div className="folder-sheet sheet-1">
                        <span className="sheet-doc-badge">PDF</span>
                        <div className="sheet-mini-lines-dense" />
                      </div>

                      {/* Main Folder Front Flap */}
                      <div className="folder-front-pocket">
                        <div className="folder-tab-lip" />
                        {/* Connected Service Badges at Bottom Left */}
                        <div className="folder-service-badges">
                          <div className="service-badge notion-badge" title="Notion Sync">
                            <span className="badge-letter">N</span>
                          </div>
                          <div className="service-badge drive-badge" title="Files Connected">
                            <span className="badge-letter">▲</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Folder Title & Count */}
                    <div className="hub-folder-meta">
                      <div className="hub-folder-card-title group-hover:text-white transition-colors truncate">
                        {folder.name}
                      </div>
                      <div className="hub-folder-card-subtitle">
                        {count} {count === 1 ? 'File' : 'Files'}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Add Folder Quick Card */}
              <div
                className="hub-folder-card add-card group"
                onClick={(): void => setShowNewFolderModal(true)}
              >
                <div className="add-card-inner flex flex-col items-center justify-center">
                  <div className="add-icon-circle group-hover:scale-110 transition-transform">
                    <FolderPlus size={18} className="text-zinc-400 group-hover:text-zinc-100" />
                  </div>
                  <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 mt-2">
                    Create Folder
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="hub-empty-subtle py-6">
              <Folder size={24} className="text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-500">No folders in this directory</p>
            </div>
          )}
        </div>

        {/* ====== SECTION B: FILES TABLE ====== */}
        <div className="hub-section">
          <div className="flex items-center justify-between mb-3">
            <h2 className="hub-section-heading">Files</h2>
            {filteredFiles.length > 0 && (
              <span className="text-xs text-zinc-500 font-medium">
                {filteredFiles.length} {filteredFiles.length === 1 ? 'Document' : 'Documents'}
              </span>
            )}
          </div>

          {filteredFiles.length > 0 ? (
            <div className="hub-files-table-wrapper">
              <table className="hub-files-table">
                <thead>
                  <tr>
                    <th className="th-name">Name</th>
                    <th className="th-author">Added By</th>
                    <th className="th-actions text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => {
                    const rel = getRelativePath(file.path, workspacePath).toLowerCase()
                    const customIcon = fileIcons[rel]

                    return (
                      <tr
                        key={file.path}
                        className="hub-file-row group"
                        onClick={(): void => onFileSelect(file.path)}
                      >
                        {/* File Name & Professional Icon */}
                        <td className="td-name">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="hub-file-icon-wrap shrink-0">
                              {customIcon ? (
                                <span className="text-[13px]">{customIcon}</span>
                              ) : (
                                <ProfessionalFileIcon
                                  fileName={file.name}
                                  className="scale-[0.95]"
                                />
                              )}
                            </span>
                            <span className="hub-file-name truncate group-hover:text-white transition-colors">
                              {file.name}
                            </span>
                          </div>
                        </td>

                        {/* Author / Added By with Avatar Pill */}
                        <td className="td-author">
                          <div className="hub-author-pill flex items-center gap-2">
                            <img
                              src={file.authorAvatar}
                              alt={file.author || 'User'}
                              className="hub-author-avatar"
                            />
                            <span className="hub-author-name truncate">{file.author}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="td-actions text-right">
                          <button
                            type="button"
                            className="hub-row-open-btn opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e): void => {
                              e.stopPropagation()
                              onFileSelect(file.path)
                            }}
                            title="Open Document"
                          >
                            <span>Open</span>
                            <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="hub-empty-subtle py-8">
              <FileText size={24} className="text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-500 mb-3">No documents in this directory</p>
              <button
                type="button"
                className="hub-action-btn primary"
                onClick={(): void => setShowNewFileModal(true)}
              >
                <FilePlus size={13} />
                <span>Create your first page</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ====== MODAL: NEW FOLDER ====== */}
      {showNewFolderModal && (
        <div className="hub-modal-overlay" onClick={(): void => setShowNewFolderModal(false)}>
          <div className="hub-modal-card" onClick={(e): void => e.stopPropagation()}>
            <h3 className="hub-modal-title">New Folder</h3>
            <p className="hub-modal-subtitle">Create a subfolder in {currentFolderName}</p>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Onboarding, Projects, Docs"
              value={newFolderName}
              onChange={(e): void => setNewFolderName(e.target.value)}
              onKeyDown={(e): void => {
                if (e.key === 'Enter') void handleCreateFolder()
                if (e.key === 'Escape') setShowNewFolderModal(false)
              }}
              className="hub-modal-input"
            />
            <div className="hub-modal-actions flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                className="hub-modal-btn cancel"
                onClick={(): void => setShowNewFolderModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="hub-modal-btn confirm"
                onClick={(): void => void handleCreateFolder()}
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL: NEW FILE ====== */}
      {showNewFileModal && (
        <div className="hub-modal-overlay" onClick={(): void => setShowNewFileModal(false)}>
          <div className="hub-modal-card" onClick={(e): void => e.stopPropagation()}>
            <h3 className="hub-modal-title">New Page</h3>
            <p className="hub-modal-subtitle">Create a markdown note in {currentFolderName}</p>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Project Roadmap, Meeting Notes"
              value={newFileName}
              onChange={(e): void => setNewFileName(e.target.value)}
              onKeyDown={(e): void => {
                if (e.key === 'Enter') void handleCreateFile()
                if (e.key === 'Escape') setShowNewFileModal(false)
              }}
              className="hub-modal-input"
            />
            <div className="hub-modal-actions flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                className="hub-modal-btn cancel"
                onClick={(): void => setShowNewFileModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="hub-modal-btn confirm"
                onClick={(): void => void handleCreateFile()}
              >
                Create Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(KnowledgeHubView)
