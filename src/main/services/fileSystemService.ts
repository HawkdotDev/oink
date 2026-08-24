import { ipcMain, dialog, BrowserWindow, shell } from 'electron'
import { join, basename, extname, dirname } from 'path'
import * as fs from 'fs/promises'
import { validatePath } from './pathValidator'

/**
 * Automatically migrates any legacy .notie directory to .oink and package.json to metadata.json
 */
async function migrateLegacyNotieFolder(dirPath: string): Promise<void> {
  try {
    const notieDir = join(dirPath, '.notie')
    const oinkDir = join(dirPath, '.oink')

    let notieExists = false
    try {
      const stat = await fs.stat(notieDir)
      notieExists = stat.isDirectory()
    } catch {
      notieExists = false
    }

    if (!notieExists) return

    let oinkExists = false
    try {
      const stat = await fs.stat(oinkDir)
      oinkExists = stat.isDirectory()
    } catch {
      oinkExists = false
    }

    if (!oinkExists) {
      // Direct rename .notie -> .oink
      await fs.rename(notieDir, oinkDir)

      // Inside .oink, if package.json exists and metadata.json doesn't, rename it
      const oldMeta = join(oinkDir, 'package.json')
      const newMeta = join(oinkDir, 'metadata.json')
      try {
        await fs.access(oldMeta)
        try {
          await fs.access(newMeta)
        } catch {
          await fs.rename(oldMeta, newMeta)
        }
      } catch {
        // ignore
      }
    } else {
      // Both exist: copy metadata file if target doesn't exist, then clean up .notie
      const oldMeta1 = join(notieDir, 'metadata.json')
      const oldMeta2 = join(notieDir, 'package.json')
      const newMeta = join(oinkDir, 'metadata.json')

      let sourceContent = ''
      try {
        sourceContent = await fs.readFile(oldMeta1, 'utf-8')
      } catch {
        try {
          sourceContent = await fs.readFile(oldMeta2, 'utf-8')
        } catch {
          // ignore
        }
      }

      if (sourceContent) {
        try {
          await fs.access(newMeta)
        } catch {
          await fs.writeFile(newMeta, sourceContent, 'utf-8')
        }
      }

      await fs.rm(notieDir, { recursive: true, force: true })
    }
  } catch (err) {
    console.error('Error during .notie -> .oink migration:', err)
  }
}

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
    await migrateLegacyNotieFolder(dirPath)
    return {
      path: dirPath,
      name: basename(dirPath)
    }
  })

  ipcMain.handle('fs:readDirectory', async (_, dirPath: string) => {
    const validDir = validatePath(dirPath)
    await migrateLegacyNotieFolder(validDir)
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

  ipcMain.handle(
    'fs:saveAttachment',
    async (_, workspacePath: string, fileName: string, dataUrl: string) => {
      const validWorkspace = validatePath(workspacePath)
      const assetsDir = join(validWorkspace, 'assets')
      await fs.mkdir(assetsDir, { recursive: true })

      const ext = extname(fileName) || '.png'
      const base = basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_')
      const finalName = `${base}_${Date.now()}${ext}`
      const fullPath = join(assetsDir, finalName)

      const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '')
      await fs.writeFile(fullPath, Buffer.from(base64Data, 'base64'))

      return `assets/${finalName}`
    }
  )
}
