import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  dialog,
  nativeTheme,
  Menu,
  nativeImage
} from 'electron'
import { join, basename, dirname, extname, normalize } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import iconIco from '../../resources/logo.ico?asset'
import iconPng from '../../resources/logo.png?asset'
import * as fs from 'fs/promises'
import { watch, type FSWatcher } from 'fs'

let workspaceWatcher: FSWatcher | null = null

function validatePath(p: unknown): string {
  if (typeof p !== 'string' || !p.trim()) {
    throw new Error('Invalid path parameter')
  }
  const normalized = normalize(p.trim())
  if (normalized.includes('\0')) {
    throw new Error('Invalid null byte in path')
  }
  return normalized
}

// Performance & Hardware Acceleration Switches
app.commandLine.appendSwitch('enable-gpu-rasterization')
app.commandLine.appendSwitch('enable-zero-copy')
app.commandLine.appendSwitch('ignore-gpu-blocklist')

function createWindow(): void {
  const iconPath = process.platform === 'win32' ? iconIco : iconPng
  const appIcon = nativeImage.createFromPath(iconPath)

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    frame: false, // Frameless window — custom title bar in renderer
    titleBarStyle: 'hidden',
    backgroundColor: '#0f0f0f', // Matches our theme background color to avoid flashing
    icon: appIcon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      backgroundThrottling: false
    }
  })

  // Remove default menu bar entirely
  Menu.setApplicationMenu(null)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Asynchronously collect all markdown files in the workspace directory tree
async function getMarkdownFilesAsync(dir: string, fileList: string[] = []): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const subDirPromises: Promise<string[]>[] = []

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (
          !entry.name.startsWith('.') &&
          entry.name !== 'node_modules' &&
          entry.name !== 'out' &&
          entry.name !== 'build' &&
          entry.name !== 'dist'
        ) {
          subDirPromises.push(getMarkdownFilesAsync(fullPath, fileList))
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        fileList.push(fullPath)
      }
    }

    if (subDirPromises.length > 0) {
      await Promise.all(subDirPromises)
    }
  } catch (err) {
    console.error(`Failed reading directory for markdown files: ${dir}`, err)
  }
  return fileList
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Force dark mode for native titlebar, menus, and system dialogs to blend the separator line
  nativeTheme.themeSource = 'dark'
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.oink.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Window control IPC handlers (registered once outside createWindow)
  ipcMain.on('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
  })

  ipcMain.on('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.on('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.close()
  })

  ipcMain.on('window:toggleFullScreen', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      win.setFullScreen(!win.isFullScreen())
    }
  })

  ipcMain.handle('window:isFullScreen', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return win ? win.isFullScreen() : false
  })

  // File System IPC handlers
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

  let watchDebounceTimer: NodeJS.Timeout | null = null
  const pendingWatchEvents = new Map<
    string,
    { eventType: string; filename: string; absolutePath: string; parentPath: string }
  >()

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

  // Asynchronous and non-blocking Graph generation with O(1) wikilink lookup
  ipcMain.handle('fs:getGraphData', async (_, rootPath: string) => {
    try {
      const validRoot = validatePath(rootPath)
      const fileList = await getMarkdownFilesAsync(validRoot, [])

      // Fast O(1) mapping of lowercase note title -> node ID / file path
      const noteTitleMap = new Map<string, string>()
      const nodes = fileList.map((filePath) => {
        const name = basename(filePath).replace(/\.md$/, '')
        noteTitleMap.set(name.toLowerCase(), filePath)
        return {
          id: filePath,
          name
        }
      })

      const links: { source: string; target: string }[] = []

      // Read file contents asynchronously in parallel
      const fileReadPromises = fileList.map(async (filePath) => {
        try {
          const content = await fs.readFile(filePath, 'utf-8')
          const matches = content.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)
          for (const match of matches) {
            const targetName = match[1].trim().toLowerCase()
            const targetId = noteTitleMap.get(targetName)
            if (targetId) {
              links.push({
                source: filePath,
                target: targetId
              })
            }
          }
        } catch {
          // Ignore inaccessible files
        }
      })

      await Promise.all(fileReadPromises)

      return { nodes, links }
    } catch (error) {
      console.error('Failed to generate graph data:', error)
      return { nodes: [], links: [] }
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
