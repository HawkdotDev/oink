import { ipcMain, BrowserWindow } from 'electron'
import { join, dirname } from 'path'
import { watch, type FSWatcher } from 'fs'
import { validatePath } from './pathValidator'

let workspaceWatcher: FSWatcher | null = null
let watchDebounceTimer: NodeJS.Timeout | null = null
const pendingWatchEvents = new Map<
  string,
  { eventType: string; filename: string; absolutePath: string; parentPath: string }
>()

/**
 * Registers directory watcher IPC handlers.
 */
export function registerWorkspaceWatcherHandlers(): void {
  ipcMain.handle('fs:watchDirectory', async (event, dirPath: string) => {
    if (workspaceWatcher) {
      workspaceWatcher.close()
      workspaceWatcher = null
    }

    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return

    try {
      const validDir = validatePath(dirPath)
      workspaceWatcher = watch(validDir, { recursive: true }, (eventType, filename) => {
        if (!filename) return

        // Filter out typical ignored directories/files to optimize performance
        if (
          filename.includes('node_modules') ||
          filename.includes('.git') ||
          filename.includes('.eslintcache') ||
          filename.includes('.DS_Store')
        ) {
          return
        }

        const absolutePath = join(validDir, filename)
        const parentPath = dirname(absolutePath)

        pendingWatchEvents.set(absolutePath, {
          eventType,
          filename,
          absolutePath,
          parentPath
        })

        if (watchDebounceTimer) {
          clearTimeout(watchDebounceTimer)
        }

        watchDebounceTimer = setTimeout(() => {
          if (!window.isDestroyed()) {
            pendingWatchEvents.forEach((data) => {
              window.webContents.send('workspace:changed', data)
            })
            pendingWatchEvents.clear()
          }
        }, 60)
      })
    } catch (error) {
      console.error('Failed to start directory watcher:', error)
    }
  })

  ipcMain.handle('fs:closeWatcher', async () => {
    if (watchDebounceTimer) {
      clearTimeout(watchDebounceTimer)
      watchDebounceTimer = null
    }
    pendingWatchEvents.clear()
    if (workspaceWatcher) {
      workspaceWatcher.close()
      workspaceWatcher = null
    }
  })
}
