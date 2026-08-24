import { ipcMain, dialog, BrowserWindow, shell } from 'electron'
import { join, basename, extname, dirname } from 'path'
import * as fs from 'fs/promises'
import { validatePath } from './pathValidator'

/**
 * Registers all File System and Storage IPC handlers.
 */
export function registerFileSystemHandlers(): void {
  ipcMain.handle('fs:openDirectory', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return null
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    const dirPath = validatePath(result.filePaths[0])
    return {
      path: dirPath,
      name: basename(dirPath)
    }
  })

  ipcMain.handle('fs:readDirectory', async (_, dirPath: string) => {
    const validDir = validatePath(dirPath)
    try {
      const entries = await fs.readdir(validDir, { withFileTypes: true })
      return entries
        .filter((entry) => !entry.name.startsWith('.'))
        .map((entry) => ({
          name: entry.name,
          path: join(validDir, entry.name),
          isDir: entry.isDirectory()
        }))
        .sort((a, b) => {
          if (a.isDir && !b.isDir) return -1
          if (!a.isDir && b.isDir) return 1
          return a.name.localeCompare(b.name)
        })
    } catch (error) {
      console.error(`Failed to read directory: ${validDir}`, error)
      throw error
    }
  })

  ipcMain.handle('fs:readFile', async (_, filePath: string) => {
    const validPath = validatePath(filePath)
    try {
      return await fs.readFile(validPath, 'utf-8')
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException
      if (err?.code === 'ENOENT') {
        return ''
      }
      console.error(`Failed to read file ${validPath}:`, error)
      throw error
    }
  })

  ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
    const validPath = validatePath(filePath)
    const parentDir = dirname(validPath)
    await fs.mkdir(parentDir, { recursive: true })
    await fs.writeFile(validPath, content, 'utf-8')
  })

  ipcMain.handle('fs:createFile', async (_, parentPath: string, name: string) => {
    const validParent = validatePath(parentPath)
    const sanitizedName = name.replace(/[\\/:*?"<>|]/g, '_').trim()
    const filePath = join(validParent, sanitizedName)
    await fs.writeFile(filePath, '', 'utf-8')
    return filePath
  })

  ipcMain.handle('fs:createFolder', async (_, parentPath: string, name: string) => {
    const validParent = validatePath(parentPath)
    const sanitizedName = name.replace(/[\\/:*?"<>|]/g, '_').trim()
    const folderPath = join(validParent, sanitizedName)
    await fs.mkdir(folderPath, { recursive: true })
    return folderPath
  })

  ipcMain.handle('fs:deletePath', async (_, itemPath: string) => {
    const validPath = validatePath(itemPath)
    await fs.rm(validPath, { recursive: true, force: true })
  })

  ipcMain.handle('fs:renamePath', async (_, oldPath: string, newPath: string) => {
    const validOld = validatePath(oldPath)
    const validNew = validatePath(newPath)
    await fs.rename(validOld, validNew)
  })

  ipcMain.handle('fs:showItemInFolder', async (_, fullPath: string) => {
    const validPath = validatePath(fullPath)
    try {
      shell.showItemInFolder(validPath)
      return true
    } catch (error) {
      console.error('Failed to show item in folder:', error)
      try {
        await shell.openPath(validPath)
        return true
      } catch {
        return false
      }
    }
  })

  ipcMain.handle('fs:showSaveDialog', async (event, defaultName: string) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return null
    const result = await dialog.showSaveDialog(window, {
      defaultPath: defaultName
    })
    if (result.canceled || !result.filePath) {
      return null
    }
    return validatePath(result.filePath)
  })

  // Save image or media attachment into <workspace>/assets/ directory
  ipcMain.handle(
    'fs:saveAttachment',
    async (_, workspacePath: string, fileName: string, dataUrl: string) => {
      const validWorkspace = validatePath(workspacePath)
      const assetsDir = join(validWorkspace, 'assets')
      await fs.mkdir(assetsDir, { recursive: true })

      const ext = extname(fileName) || '.png'
      const baseClean = basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_')
      const finalFileName = `${Date.now()}_${baseClean}${ext}`
      const targetFilePath = join(assetsDir, finalFileName)

      // Decode base64 data URL
      const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      await fs.writeFile(targetFilePath, buffer)
      return `assets/${finalFileName}`
    }
  )
}
