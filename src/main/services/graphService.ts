import { ipcMain } from 'electron'
import { join, basename } from 'path'
import * as fs from 'fs/promises'
import { validatePath } from './pathValidator'

/**
 * Asynchronously collects all markdown files in the workspace directory tree.
 */
export async function getMarkdownFilesAsync(
  dir: string,
  fileList: string[] = []
): Promise<string[]> {
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

/**
 * Registers graph data generation IPC handler with O(1) wikilink title lookup.
 */
export function registerGraphHandlers(): void {
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
}
