import { OinkWorkspaceConfig } from '../types'
import { normalizePath } from './pathUtils'
import { OINK_METADATA_DIR } from './metadataEngine'

export const OINK_CONFIG_FILE = 'config.ts'
export const OINK_CONFIG_JSON_FILE = 'config.json'

export const DEFAULT_WORKSPACE_CONFIG: OinkWorkspaceConfig = {
  name: 'My Workspace',
  description: 'Personal knowledge base and block notes in Oink',
  version: '1.0.0',
  theme: {
    mode: 'dark',
    accentColor: '#ffffff',
    background: '#18181b',
    surface: '#202023',
    sidebarBg: '#131316',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  editor: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 16,
    lineHeight: '1.65',
    letterSpacing: '0px',
    paragraphSpacing: '12px',
    fontWeight: 'normal',
    textAlign: 'left',
    maxUndoHistory: 50,
    autoSave: true,
    autoSaveIntervalMs: 1000
  },
  markdown: {
    wikilinks: true,
    strikethrough: true,
    autoCloseBrackets: true,
    tableOfContentsDepth: 3
  },
  excludePatterns: [
    'node_modules/**',
    '.git/**',
    '.oink/**',
    '.notie/**',
    'dist/**',
    'build/**',
    'out/**',
    'coverage/**'
  ],
  plugins: {
    graphView: true,
    outline: true,
    stats: true,
    terminal: true,
    snippets: true,
    mermaid: true,
    mathjax: true
  },
  export: {
    defaultFormat: 'markdown',
    includeFrontmatter: true,
    pageWidth: '800px'
  }
}

/**
 * Generates clean, well-commented TypeScript code for `.oink/config.ts`.
 */
export function generateConfigTsTemplate(workspaceName = 'My Workspace'): string {
  return `/**
 * ==============================================================================
 * Oink Workspace Configuration
 * File: .oink/config.ts
 * ==============================================================================
 * This file configures workspace-level behaviors, typography defaults,
 * plugins, markdown parser extensions, keybindings, and custom CSS styles.
 */

export interface OinkWorkspaceConfig {
  /** Workspace Display Name */
  name?: string
  /** Description or subtitle of the workspace */
  description?: string
  /** Configuration Schema Version */
  version?: string
  /** UI Theme & Styling settings */
  theme?: {
    mode?: 'dark' | 'light' | 'system'
    accentColor?: string
    background?: string
    surface?: string
    sidebarBg?: string
    fontFamily?: string
  }
  /** Editor & Typography preferences */
  editor?: {
    fontFamily?: string
    fontSize?: number
    lineHeight?: string
    letterSpacing?: string
    paragraphSpacing?: string
    fontWeight?: string
    textAlign?: string
    maxUndoHistory?: number
    autoSave?: boolean
    autoSaveIntervalMs?: number
  }
  /** Markdown parsing and extensions */
  markdown?: {
    wikilinks?: boolean
    strikethrough?: boolean
    autoCloseBrackets?: boolean
    tableOfContentsDepth?: number
  }
  /** Glob patterns to exclude from sidebar and search */
  excludePatterns?: string[]
  /** Enabled plugins */
  plugins?: Record<string, boolean>
  /** Custom CSS overrides injected into the workspace */
  customCSS?: string
  /** Workspace-specific custom keybindings */
  keybindings?: Record<string, string>
  /** Export preferences */
  export?: {
    defaultFormat?: 'markdown' | 'html' | 'text'
    includeFrontmatter?: boolean
    pageWidth?: string
  }
}

export const config: OinkWorkspaceConfig = {
  name: ${JSON.stringify(workspaceName)},
  description: 'Personal knowledge base and block notes in Oink',
  version: '1.0.0',
  theme: {
    mode: 'dark',
    accentColor: '#ffffff',
    background: '#18181b',
    surface: '#202023',
    sidebarBg: '#131316',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  editor: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 16,
    lineHeight: '1.65',
    letterSpacing: '0px',
    paragraphSpacing: '12px',
    fontWeight: 'normal',
    textAlign: 'left',
    maxUndoHistory: 50,
    autoSave: true,
    autoSaveIntervalMs: 1000
  },
  markdown: {
    wikilinks: true,
    strikethrough: true,
    autoCloseBrackets: true,
    tableOfContentsDepth: 3
  },
  plugins: {
    graphView: true,
    outline: true,
    stats: true,
    terminal: true,
    snippets: true,
    mermaid: true,
    mathjax: true
  },
  excludePatterns: [
    'node_modules/**',
    '.git/**',
    '.oink/**',
    '.notie/**',
    'dist/**',
    'build/**',
    'out/**',
    'coverage/**'
  ],
  export: {
    defaultFormat: 'markdown',
    includeFrontmatter: true,
    pageWidth: '800px'
  }
}

export default config
`
}

/**
 * Safely parses the configuration content from `.oink/config.ts` or `.oink/config.json`.
 */
export function parseWorkspaceConfigText(rawContent: string): Partial<OinkWorkspaceConfig> {
  const trimmed = rawContent.trim()
  if (!trimmed) return {}

  // 1. Try standard JSON parse
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed) as Partial<OinkWorkspaceConfig>
    } catch {
      // ignore
    }
  }

  // 2. Extract `export const config = { ... }` or `export default { ... }` from TypeScript
  try {
    const configMatch =
      trimmed.match(
        /export\s+const\s+config\s*(?::\s*OinkWorkspaceConfig)?\s*=\s*({[\s\S]*?})\s*(?:export\s+default|;\s*$|$)/m
      ) || trimmed.match(/export\s+default\s*({[\s\S]*?})\s*(?:;\s*$|$)/m)

    if (configMatch && configMatch[1]) {
      // Transform TypeScript/JS object literals into valid JSON
      const jsonCandidate = configMatch[1]
        .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1') // remove comments
        .replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":') // quote unquoted keys
        .replace(/,\s*([}\]])/g, '$1') // remove trailing commas
        .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"') // replace single quotes with double quotes

      return JSON.parse(jsonCandidate) as Partial<OinkWorkspaceConfig>
    }
  } catch (err) {
    console.warn('Failed to parse .oink/config.ts object directly, falling back to default:', err)
  }

  return {}
}

/**
 * Loads workspace configuration from `.oink/config.ts` (or `.oink/config.json`).
 */
export async function loadWorkspaceConfigAsync(
  workspacePath: string
): Promise<OinkWorkspaceConfig> {
  const norm = normalizePath(workspacePath)
  if (!norm) return DEFAULT_WORKSPACE_CONFIG

  const tsPath = `${norm}/${OINK_METADATA_DIR}/${OINK_CONFIG_FILE}`
  const jsonPath = `${norm}/${OINK_METADATA_DIR}/${OINK_CONFIG_JSON_FILE}`

  let raw = ''
  try {
    raw = await window.api.fs.readFile(tsPath)
  } catch {
    try {
      raw = await window.api.fs.readFile(jsonPath)
    } catch {
      raw = ''
    }
  }

  if (!raw) return DEFAULT_WORKSPACE_CONFIG

  const parsed = parseWorkspaceConfigText(raw)
  return {
    ...DEFAULT_WORKSPACE_CONFIG,
    ...parsed,
    theme: { ...DEFAULT_WORKSPACE_CONFIG.theme, ...parsed.theme },
    editor: { ...DEFAULT_WORKSPACE_CONFIG.editor, ...parsed.editor },
    markdown: { ...DEFAULT_WORKSPACE_CONFIG.markdown, ...parsed.markdown },
    plugins: { ...DEFAULT_WORKSPACE_CONFIG.plugins, ...parsed.plugins },
    export: { ...DEFAULT_WORKSPACE_CONFIG.export, ...parsed.export }
  }
}

/**
 * Ensures `.oink/config.ts` exists inside the workspace. If not, generates it.
 */
export async function ensureWorkspaceConfigAsync(
  workspacePath: string,
  workspaceName = 'My Workspace'
): Promise<void> {
  const norm = normalizePath(workspacePath)
  if (!norm) return

  const tsPath = `${norm}/${OINK_METADATA_DIR}/${OINK_CONFIG_FILE}`
  try {
    const existing = await window.api.fs.readFile(tsPath)
    if (!existing || existing.trim().length === 0) {
      const template = generateConfigTsTemplate(workspaceName)
      await window.api.fs.writeFile(tsPath, template)
    }
  } catch {
    const template = generateConfigTsTemplate(workspaceName)
    await window.api.fs.writeFile(tsPath, template)
  }
}

/**
 * Saves workspace configuration to `.oink/config.ts`.
 */
export async function saveWorkspaceConfigAsync(
  workspacePath: string,
  config: OinkWorkspaceConfig
): Promise<void> {
  const norm = normalizePath(workspacePath)
  if (!norm) return

  const tsPath = `${norm}/${OINK_METADATA_DIR}/${OINK_CONFIG_FILE}`
  const content = `/**
 * Oink Workspace Configuration
 * File: .oink/config.ts
 */

import { OinkWorkspaceConfig } from '../types'

export const config: OinkWorkspaceConfig = ${JSON.stringify(config, null, 2)}

export default config
`
  await window.api.fs.writeFile(tsPath, content)
}
