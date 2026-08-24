import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { normalizePath, getRelativePath, getPathKey } from '../utils/pathUtils'
import { metadataEngine } from '../utils/metadataEngine'
import { MarkdownMetadata } from '../types'
import { stripFrontmatter } from '../utils/metadataUtils'

export interface OpenFileItem {
  path: string
  name: string
}

export interface UseFileStorageReturn {
  activeFilePath: string | null
  setActiveFilePath: React.Dispatch<React.SetStateAction<string | null>>
  openFiles: OpenFileItem[]
  setOpenFiles: React.Dispatch<React.SetStateAction<OpenFileItem[]>>
  fileContents: Record<string, string>
  setFileContents: React.Dispatch<React.SetStateAction<Record<string, string>>>
  originalFileContents: Record<string, string>
  fileIcons: Record<string, string>
  setFileIcons: React.Dispatch<React.SetStateAction<Record<string, string>>>
  fileBanners: Record<string, string>
  setFileBanners: React.Dispatch<React.SetStateAction<Record<string, string>>>
  fileMetadataMap: Record<string, MarkdownMetadata>
  setFileMetadataMap: React.Dispatch<React.SetStateAction<Record<string, MarkdownMetadata>>>
  activeRelKey: string
  activeFileMeta: MarkdownMetadata | undefined
  isOnlyThisFile: boolean
  loadFileContent: (filePath: string) => Promise<string>
  handleFileSelect: (filePath: string) => Promise<void>
  handleTabSelect: (filePath: string) => void
  handleTabClose: (filePath: string) => void
  handleSaveActiveFile: () => Promise<void>
  handleSetFileIcon: (relKey: string, icon: string | null) => void
  handleSetFileBanner: (relKey: string, banner: string | null) => void
  handleRenameActiveFile: (newTitle: string) => void
  handleCreateFileAtRoot: () => Promise<void>
  handleDuplicateFile: () => Promise<void>
  handleDeleteFile: () => Promise<void>
  resetAllFileStates: () => void
  unsavedFiles: Record<string, boolean>
}

export function useFileStorage(
  workspacePath: string | null,
  initialActiveFilePath: string | null,
  initialOpenFiles: OpenFileItem[],
  autoSaveEnabled: boolean
): UseFileStorageReturn {
  const [activeFilePath, setActiveFilePath] = useState<string | null>(initialActiveFilePath)
  const [openFiles, setOpenFiles] = useState<OpenFileItem[]>(initialOpenFiles)
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [originalFileContents, setOriginalFileContents] = useState<Record<string, string>>({})
  const [fileIcons, setFileIcons] = useState<Record<string, string>>({})
  const [fileBanners, setFileBanners] = useState<Record<string, string>>({})
  const [fileMetadataMap, setFileMetadataMap] = useState<Record<string, MarkdownMetadata>>({})
  const [, setLastEditedMap] = useState<Record<string, number>>({})

  const fileContentsRef = useRef(fileContents)
  useEffect(() => {
    fileContentsRef.current = fileContents
  }, [fileContents])

  const activeRelKey = useMemo(() => {
    if (!activeFilePath || !workspacePath) return ''
    return getRelativePath(activeFilePath, workspacePath).toLowerCase()
  }, [activeFilePath, workspacePath])

  const activeFileMeta = fileMetadataMap[activeRelKey]

  const isOnlyThisFile = useMemo(() => {
    if (!activeFileMeta) return false
    return (
      activeFileMeta.showCover !== undefined ||
      activeFileMeta.showIcon !== undefined ||
      activeFileMeta.showFileName !== undefined
    )
  }, [activeFileMeta])

  // Load workspace metadata from .oink/metadata.json on workspace change
  useEffect(() => {
    if (!workspacePath) return
    void metadataEngine.loadWorkspaceMetadataAsync(workspacePath).then((store) => {
      if (store.icons && Object.keys(store.icons).length > 0) {
        setFileIcons((prev) => ({ ...store.icons, ...prev }))
      }
      if (store.banners && Object.keys(store.banners).length > 0) {
        setFileBanners((prev) => ({ ...store.banners, ...prev }))
      }
      if (
        (store.showCover && Object.keys(store.showCover).length > 0) ||
        (store.showIcon && Object.keys(store.showIcon).length > 0) ||
        (store.showFileName && Object.keys(store.showFileName).length > 0)
      ) {
        setFileMetadataMap((prev) => {
          const next = { ...prev }
          const allKeys = new Set([
            ...Object.keys(store.showCover || {}),
            ...Object.keys(store.showIcon || {}),
            ...Object.keys(store.showFileName || {})
          ])
          allKeys.forEach((k) => {
            next[k] = {
              ...next[k],
              showCover: store.showCover[k],
              showIcon: store.showIcon[k],
              showFileName: store.showFileName[k]
            }
          })
          return next
        })
      }
    })
  }, [workspacePath])

  const loadFileContent = useCallback(
    async (filePath: string): Promise<string> => {
      const normPath = normalizePath(filePath)
      if (!normPath) return ''

      const cached = fileContentsRef.current[normPath]
      if (cached !== undefined) {
        const clean = stripFrontmatter(cached)
        if (clean !== cached) {
          setFileContents((prev) => ({ ...prev, [normPath]: clean }))
        }
        return clean
      }
      try {
        const rawContent = await window.api.fs.readFile(normPath)
        let bodyContent = rawContent

        if (normPath.endsWith('.md')) {
          const rel = getRelativePath(normPath, workspacePath)
          const parsed = await metadataEngine.parseDocumentAsync(rawContent, rel)
          bodyContent = parsed.cleanContent
          const relKey = rel.toLowerCase()
          if (parsed.metadata.icon) {
            setFileIcons((prev) => ({ ...prev, [relKey]: parsed.metadata.icon! }))
          }
          if (parsed.metadata.banner) {
            setFileBanners((prev) => ({ ...prev, [relKey]: parsed.metadata.banner! }))
          }
          setFileMetadataMap((prev) => ({
            ...prev,
            [relKey]: { ...parsed.metadata }
          }))
        }

        setFileContents((prev) => ({ ...prev, [normPath]: bodyContent }))
        setOriginalFileContents((prev) => ({ ...prev, [normPath]: bodyContent }))
        setLastEditedMap((prev) => (prev[normPath] ? prev : { ...prev, [normPath]: Date.now() }))
        return bodyContent
      } catch (err) {
        console.error(`Failed to read file ${normPath}:`, err)
        return ''
      }
    },
    [workspacePath]
  )

  // Re-hydrate contents for open files that are not loaded yet
  useEffect(() => {
    openFiles.forEach((file) => {
      const norm = normalizePath(file.path)
      if (fileContentsRef.current[norm] === undefined) {
        void loadFileContent(file.path)
      }
    })
  }, [openFiles, loadFileContent])

  const handleFileSelect = useCallback(
    async (filePath: string): Promise<void> => {
      const normPath = normalizePath(filePath)
      if (!normPath) return

      const fileName = normPath.split(/[\\/]/).pop() || ''
      setActiveFilePath(normPath)

      setOpenFiles((prev) => {
        if (prev.some((f) => f.path === normPath)) return prev
        return [...prev, { path: normPath, name: fileName }]
      })

      await loadFileContent(normPath)
    },
    [loadFileContent]
  )

  const handleTabSelect = useCallback((filePath: string): void => {
    setActiveFilePath(normalizePath(filePath))
  }, [])

  const handleTabClose = useCallback(
    (filePath: string): void => {
      const normPath = normalizePath(filePath)
      if (!normPath) return

      setOpenFiles((prev) => {
        const updated = prev.filter((f) => f.path !== normPath)
        if (activeFilePath === normPath) {
          if (updated.length > 0) {
            setActiveFilePath(updated[updated.length - 1].path)
          } else {
            setActiveFilePath(null)
          }
        }
        return updated
      })
    },
    [activeFilePath]
  )

  const handleSaveActiveFile = useCallback(async (): Promise<void> => {
    if (!activeFilePath) return
    const normPath = normalizePath(activeFilePath)
    if (!normPath) return

    let contentToSave = fileContents[normPath] ?? ''
    if (normPath.endsWith('.md')) {
      const rel = getRelativePath(normPath, workspacePath)
      const relKey = rel.toLowerCase()
      const meta = fileMetadataMap[relKey] || {}
      if (fileIcons[relKey]) metadataEngine.setIcon(rel, fileIcons[relKey])
      if (fileBanners[relKey]) metadataEngine.setBanner(rel, fileBanners[relKey])
      metadataEngine.setShowCover(rel, meta.showCover)
      metadataEngine.setShowIcon(rel, meta.showIcon)
      metadataEngine.setShowFileName(rel, meta.showFileName)

      const words = contentToSave.trim().split(/\s+/).filter(Boolean).length
      const chars = contentToSave.length
      const readingTime = Math.max(1, Math.ceil(words / 200))
      metadataEngine.setFileDetails(rel, {
        wordCount: words,
        charCount: chars,
        readingTimeMinutes: readingTime,
        lastEditedTime: Date.now()
      })

      contentToSave = await metadataEngine.prepareForSaveAsync(contentToSave, rel, {
        icon: fileIcons[relKey],
        banner: fileBanners[relKey],
        showCover: meta.showCover,
        showIcon: meta.showIcon,
        showFileName: meta.showFileName
      })
    }

    try {
      await window.api.fs.writeFile(normPath, contentToSave)
      setOriginalFileContents((prev) => ({ ...prev, [normPath]: fileContents[normPath] ?? '' }))
      setLastEditedMap((prev) => ({ ...prev, [normPath]: Date.now() }))
    } catch (err) {
      alert(`Error saving file: ${err}`)
    }
  }, [activeFilePath, fileContents, fileIcons, fileBanners, fileMetadataMap, workspacePath])

  // Autosave effect
  useEffect(() => {
    if (!autoSaveEnabled || !activeFilePath) return

    const normPath = normalizePath(activeFilePath)
    if (!normPath) return

    const current = fileContents[normPath]
    const original = originalFileContents[normPath]
    if (current === undefined || current === original) return

    const timer = setTimeout(() => {
      void handleSaveActiveFile()
    }, 1500)

    return (): void => clearTimeout(timer)
  }, [fileContents, originalFileContents, activeFilePath, autoSaveEnabled, handleSaveActiveFile])

  const handleSetFileIcon = useCallback((relKey: string, icon: string | null) => {
    setFileIcons((prev) => {
      const updated = { ...prev }
      if (!icon) {
        delete updated[relKey]
      } else {
        updated[relKey] = icon
      }
      return updated
    })
  }, [])

  const handleSetFileBanner = useCallback((relKey: string, banner: string | null) => {
    setFileBanners((prev) => {
      const updated = { ...prev }
      if (!banner) {
        delete updated[relKey]
      } else {
        updated[relKey] = banner
      }
      return updated
    })
  }, [])

  const handleRenameActiveFile = useCallback(
    (newTitle: string) => {
      if (!activeFilePath || !workspacePath) return
      const dir = activeFilePath.substring(
        0,
        Math.max(activeFilePath.lastIndexOf('/'), activeFilePath.lastIndexOf('\\'))
      )
      const newPath = normalizePath(`${dir}/${newTitle}.md`)
      if (newPath && newPath !== activeFilePath) {
        void window.api.fs
          .renamePath(activeFilePath, newPath)
          .then(() => {
            setActiveFilePath(newPath)
            setOpenFiles((prev) =>
              prev.map((f) =>
                f.path === activeFilePath ? { path: newPath, name: `${newTitle}.md` } : f
              )
            )
          })
          .catch((err) => alert(`Rename error: ${err}`))
      }
    },
    [activeFilePath, workspacePath]
  )

  const handleCreateFileAtRoot = useCallback(async (): Promise<void> => {
    if (!workspacePath) {
      alert('Please open a workspace folder first.')
      return
    }
    const name = prompt('Enter new file name:')
    if (!name || !name.trim()) return

    const fileName = name.trim().endsWith('.md') ? name.trim() : `${name.trim()}.md`
    try {
      const newPath = await window.api.fs.createFile(workspacePath, fileName)
      await handleFileSelect(newPath)
    } catch (err) {
      alert(`Error creating file: ${err}`)
    }
  }, [workspacePath, handleFileSelect])

  const handleDuplicateFile = useCallback(async (): Promise<void> => {
    if (!activeFilePath || !workspacePath) return
    const lastSlash = Math.max(activeFilePath.lastIndexOf('/'), activeFilePath.lastIndexOf('\\'))
    const dir = lastSlash > 0 ? activeFilePath.substring(0, lastSlash) : workspacePath
    const baseName = activeFilePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') || 'document'
    const newFileName = `${baseName} (copy).md`
    const newPath = normalizePath(`${dir}/${newFileName}`)
    const content = fileContents[normalizePath(activeFilePath)] || ''
    try {
      await window.api.fs.createFile(dir, newFileName)
      await window.api.fs.writeFile(newPath, content)
      await handleFileSelect(newPath)
    } catch (err) {
      alert(`Failed to duplicate: ${err}`)
    }
  }, [activeFilePath, workspacePath, fileContents, handleFileSelect])

  const handleDeleteFile = useCallback(async (): Promise<void> => {
    if (!activeFilePath) return
    const name = activeFilePath.split(/[\\/]/).pop() || 'file'
    const confirmed = confirm(`Are you sure you want to move "${name}" to trash?`)
    if (!confirmed) return
    try {
      await window.api.fs.deletePath(activeFilePath)
      handleTabClose(activeFilePath)
    } catch (err) {
      alert(`Failed to delete: ${err}`)
    }
  }, [activeFilePath, handleTabClose])

  const resetAllFileStates = useCallback(() => {
    setActiveFilePath(null)
    setOpenFiles([])
    setFileContents({})
    setOriginalFileContents({})
    setFileIcons({})
    setFileBanners({})
    setFileMetadataMap({})
  }, [])

  // Track unsaved files
  const unsavedFiles = useMemo(() => {
    const unsaved: Record<string, boolean> = {}
    for (const [filePath, current] of Object.entries(fileContents)) {
      const original = originalFileContents[filePath]
      if (original !== undefined && current !== original) {
        unsaved[filePath] = true
        const norm = normalizePath(filePath)
        unsaved[norm] = true
        unsaved[getPathKey(filePath)] = true
      }
    }
    return unsaved
  }, [fileContents, originalFileContents])

  return {
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
    fileMetadataMap,
    setFileMetadataMap,
    activeRelKey,
    activeFileMeta,
    isOnlyThisFile,
    loadFileContent,
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
  }
}
