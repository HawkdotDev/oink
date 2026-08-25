import { app, BrowserWindow, nativeTheme } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow, registerWindowControlHandlers } from './services/windowManager'
import { registerFileSystemHandlers } from './services/fileSystemService'
import { registerWorkspaceWatcherHandlers } from './services/workspaceWatcher'
import { registerGraphHandlers } from './services/graphService'


// Initialization and lifecycle orchestration
app.whenReady().then(() => {
  // Force dark mode for native titlebar, menus, and system dialogs
  nativeTheme.themeSource = 'dark'
  electronApp.setAppUserModelId('com.oink.app')

  // Watch window shortcuts for devtools & refresh control
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register domain services
  registerWindowControlHandlers()
  registerFileSystemHandlers()
  registerWorkspaceWatcherHandlers()
  registerGraphHandlers()

  // Initialize main application window
  createMainWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
