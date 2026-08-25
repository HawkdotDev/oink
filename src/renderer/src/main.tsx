import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

if (!window.api) {
  const mockFiles: Record<string, { path: string; name: string; isDir: boolean }[]> = {
    '/workspace': [
      { path: '/workspace/General Knowledge', name: 'General Knowledge', isDir: true },
      { path: '/workspace/Onboarding Design', name: 'Onboarding Design', isDir: true },
      { path: '/workspace/Team Interviews', name: 'Team Interviews', isDir: true },
      { path: '/workspace/Product-Roadmap.md', name: 'Product-Roadmap.md', isDir: false },
      { path: '/workspace/Design-System.md', name: 'Design-System.md', isDir: false },
      { path: '/workspace/Meeting-Notes.md', name: 'Meeting-Notes.md', isDir: false }
    ],
    '/workspace/General Knowledge': [
      { path: '/workspace/General Knowledge/Onboarding', name: 'Onboarding', isDir: true },
      { path: '/workspace/General Knowledge/Integrations', name: 'Integrations', isDir: true },
      { path: '/workspace/General Knowledge/Documents', name: 'Documents', isDir: true },
      {
        path: '/workspace/General Knowledge/Onboarding-Guide.md',
        name: 'Onboarding-Guide.md',
        isDir: false
      },
      {
        path: '/workspace/General Knowledge/Product-Roadmap.md',
        name: 'Product-Roadmap.md',
        isDir: false
      },
      {
        path: '/workspace/General Knowledge/Tech-Architecture.md',
        name: 'Tech-Architecture.md',
        isDir: false
      }
    ],
    '/workspace/General Knowledge/Onboarding': [
      {
        path: '/workspace/General Knowledge/Onboarding/Subfolder 1',
        name: 'Subfolder 1',
        isDir: true
      },
      {
        path: '/workspace/General Knowledge/Onboarding/Subfolder 2',
        name: 'Subfolder 2',
        isDir: true
      },
      {
        path: '/workspace/General Knowledge/Onboarding/Welcome-Checklist.md',
        name: 'Welcome-Checklist.md',
        isDir: false
      },
      {
        path: '/workspace/General Knowledge/Onboarding/Company-Handbook.md',
        name: 'Company-Handbook.md',
        isDir: false
      }
    ],
    '/workspace/General Knowledge/Onboarding/Subfolder 1': [
      {
        path: '/workspace/General Knowledge/Onboarding/Subfolder 1/Getting-Started.md',
        name: 'Getting-Started.md',
        isDir: false
      },
      {
        path: '/workspace/General Knowledge/Onboarding/Subfolder 1/Security-Setup.md',
        name: 'Security-Setup.md',
        isDir: false
      }
    ],
    '/workspace/General Knowledge/Onboarding/Subfolder 2': [
      {
        path: '/workspace/General Knowledge/Onboarding/Subfolder 2/API-Keys.md',
        name: 'API-Keys.md',
        isDir: false
      }
    ],
    '/workspace/General Knowledge/Integrations': [
      {
        path: '/workspace/General Knowledge/Integrations/Slack-Webhook.md',
        name: 'Slack-Webhook.md',
        isDir: false
      },
      {
        path: '/workspace/General Knowledge/Integrations/Github-Actions.md',
        name: 'Github-Actions.md',
        isDir: false
      }
    ],
    '/workspace/General Knowledge/Documents': [
      {
        path: '/workspace/General Knowledge/Documents/RFC-001.md',
        name: 'RFC-001.md',
        isDir: false
      }
    ],
    '/workspace/Onboarding Design': [
      { path: '/workspace/Onboarding Design/Figma-Specs.md', name: 'Figma-Specs.md', isDir: false }
    ],
    '/workspace/Team Interviews': [
      {
        path: '/workspace/Team Interviews/Candidate-Evaluation.md',
        name: 'Candidate-Evaluation.md',
        isDir: false
      }
    ]
  }

  // @ts-ignore - Browser fallback mock API when running outside Electron container
  window.api = {
    fs: {
      openDirectory: () => Promise.resolve({ path: '/workspace', name: 'workspace' }),
      readDirectory: (dirPath: string) => Promise.resolve(mockFiles[dirPath] || []),
      readFile: (filePath: string) => {
        if (filePath.endsWith('.json')) {
          return Promise.resolve(
            JSON.stringify({
              workspace: { name: 'workspace', id: 'ws_mock', createdAt: Date.now() },
              session: {},
              files: {}
            })
          )
        }
        if (filePath.endsWith('config.ts')) {
          return Promise.resolve('export const config = {}')
        }
        return Promise.resolve('# Welcome to Oink\n\nThis is a sample markdown file.')
      },
      writeFile: () => Promise.resolve(),
      createFile: (dir: string, name: string) => Promise.resolve(`${dir}/${name}`),
      createFolder: (dir: string, name: string) => Promise.resolve(`${dir}/${name}`),
      deletePath: () => Promise.resolve(),
      renamePath: () => Promise.resolve(),
      showItemInFolder: () => Promise.resolve(true),
      showSaveDialog: () => Promise.resolve('/workspace/untitled.md'),
      saveAttachment: (_ws: string, name: string, dataUrl: string) =>
        Promise.resolve(dataUrl || `assets/${name}`),
      watchDirectory: () => Promise.resolve(),
      closeWatcher: () => Promise.resolve(),
      getGraphData: () => Promise.resolve({ nodes: [], links: [] }),
      onWorkspaceChanged: () => () => {}
    },
    window: {
      minimize: () => {},
      maximize: () => {},
      close: () => {},
      toggleFullScreen: () => {},
      isFullScreen: () => Promise.resolve(false),
      onFullScreenChange: () => () => {}
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
