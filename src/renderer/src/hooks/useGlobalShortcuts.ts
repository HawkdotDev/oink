import { useEffect } from 'react'

interface UseGlobalShortcutsOptions {
  isFullScreen: boolean
  activeFilePath: string | null
  onSaveActiveFile: () => void
  onOpenWorkspace: () => void
  onCreateFileAtRoot: () => void
  onCloseActiveTab: (filePath: string) => void
  onToggleFullScreen: () => void
  onToggleSearch: () => void
  onToggleSettings: () => void
}

export function useGlobalShortcuts({
  isFullScreen,
  activeFilePath,
  onSaveActiveFile,
  onOpenWorkspace,
  onCreateFileAtRoot,
  onCloseActiveTab,
  onToggleFullScreen,
  onToggleSearch,
  onToggleSettings
}: UseGlobalShortcutsOptions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Escape exit fullscreen
      if (e.key === 'Escape' && isFullScreen) {
        onToggleFullScreen()
        return
      }

      // F11 toggle fullscreen
      if (e.key === 'F11') {
        e.preventDefault()
        onToggleFullScreen()
        return
      }

      // Ctrl / Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase()

        if (key === 's') {
          e.preventDefault()
          onSaveActiveFile()
        } else if (key === 'o') {
          e.preventDefault()
          onOpenWorkspace()
        } else if (key === 'n') {
          e.preventDefault()
          onCreateFileAtRoot()
        } else if (key === 'w') {
          e.preventDefault()
          if (activeFilePath) {
            onCloseActiveTab(activeFilePath)
          }
        } else if (key === 'p') {
          e.preventDefault()
          onToggleSearch()
        } else if (key === ',') {
          e.preventDefault()
          onToggleSettings()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [
    isFullScreen,
    activeFilePath,
    onSaveActiveFile,
    onOpenWorkspace,
    onCreateFileAtRoot,
    onCloseActiveTab,
    onToggleFullScreen,
    onToggleSearch,
    onToggleSettings
  ])
}
