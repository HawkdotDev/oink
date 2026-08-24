import { useState, useCallback } from 'react'
import { normalizePath } from '../utils/pathUtils'

export interface RecentWorkspaceItem {
  path: string
  name: string
}

export interface UseWorkspaceReturn {
  workspacePath: string | null
  setWorkspacePath: React.Dispatch<React.SetStateAction<string | null>>
  workspaceName: string
  setWorkspaceName: React.Dispatch<React.SetStateAction<string>>
  recentWorkspaces: RecentWorkspaceItem[]
  updateRecentWorkspaces: (path: string, name?: string) => void
  handleOpenWorkspace: () => Promise<string | null>
  handleSwitchWorkspace: (path: string, name?: string) => string
  handleRemoveRecentWorkspace: (path: string) => void
  handleCloseWorkspace: () => void
  handleRenameWorkspace: (newName?: string) => Promise<string | null>
}

export function useWorkspace(
  initialWorkspacePath: string | null,
  initialWorkspaceName: string
): UseWorkspaceReturn {
  const [workspacePath, setWorkspacePath] = useState<string | null>(initialWorkspacePath)
  const [workspaceName, setWorkspaceName] = useState<string>(initialWorkspaceName)

  const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspaceItem[]>(() => {
    try {
      const saved = localStorage.getItem('recentWorkspaces')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return [
      { path: 'c:\\Users\\dwaip\\OneDrive\\Documents\\Application', name: 'Application' },
      { path: '/workspace', name: 'workspace' }
    ]
  })

  const updateRecentWorkspaces = useCallback((path: string, name?: string) => {
    const norm = normalizePath(path)
    if (!norm) return
    const folderName = name || norm.split(/[\\/]/).pop() || 'Workspace'
    setRecentWorkspaces((prev) => {
      const filtered = prev.filter((item) => normalizePath(item.path) !== norm)
      const updated = [{ path: norm, name: folderName }, ...filtered].slice(0, 10)
      try {
        localStorage.setItem('recentWorkspaces', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }, [])

  const handleOpenWorkspace = useCallback(async (): Promise<string | null> => {
    try {
      const selected = await window.api.fs.openDirectory()
      if (selected && selected.path) {
        const norm = normalizePath(selected.path)
        const folderName = selected.name || norm.split(/[\\/]/).pop() || 'Workspace'
        setWorkspacePath(norm)
        setWorkspaceName(folderName)
        updateRecentWorkspaces(norm, folderName)
        return norm
      }
    } catch (err) {
      console.error('Error opening folder:', err)
    }
    return null
  }, [updateRecentWorkspaces])

  const handleSwitchWorkspace = useCallback(
    (path: string, name?: string): string => {
      const norm = normalizePath(path)
      if (!norm) return ''
      const folderName = name || norm.split(/[\\/]/).pop() || 'Workspace'
      setWorkspacePath(norm)
      setWorkspaceName(folderName)
      updateRecentWorkspaces(norm, folderName)
      return norm
    },
    [updateRecentWorkspaces]
  )

  const handleRemoveRecentWorkspace = useCallback((path: string): void => {
    const norm = normalizePath(path)
    setRecentWorkspaces((prev) => {
      const updated = prev.filter((item) => normalizePath(item.path) !== norm)
      try {
        localStorage.setItem('recentWorkspaces', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }, [])

  const handleCloseWorkspace = useCallback((): void => {
    setWorkspacePath(null)
    setWorkspaceName('')
  }, [])

  const handleRenameWorkspace = useCallback(
    async (newName?: string): Promise<string | null> => {
      if (!workspacePath) return null
      const currentName = workspaceName || workspacePath.split(/[\\/]/).pop() || 'Workspace'
      const targetName =
        newName !== undefined
          ? newName.trim()
          : prompt('Enter new workspace folder name:', currentName)?.trim()
      if (!targetName || targetName === currentName) return null

      const parentDir = workspacePath.substring(
        0,
        Math.max(workspacePath.lastIndexOf('/'), workspacePath.lastIndexOf('\\'))
      )
      const newPath = normalizePath(`${parentDir}/${targetName}`)
      try {
        await window.api.fs.renamePath(workspacePath, newPath)
        setWorkspacePath(newPath)
        setWorkspaceName(targetName)
        updateRecentWorkspaces(newPath, targetName)
        return newPath
      } catch (err) {
        alert(`Error renaming workspace folder: ${err}`)
        return null
      }
    },
    [workspacePath, workspaceName, updateRecentWorkspaces]
  )

  return {
    workspacePath,
    setWorkspacePath,
    workspaceName,
    setWorkspaceName,
    recentWorkspaces,
    updateRecentWorkspaces,
    handleOpenWorkspace,
    handleSwitchWorkspace,
    handleRemoveRecentWorkspace,
    handleCloseWorkspace,
    handleRenameWorkspace
  }
}
