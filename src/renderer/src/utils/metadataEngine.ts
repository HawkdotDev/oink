import {
  MarkdownMetadata,
  OinkFileMetadata,
  OinkWorkspaceInfo,
  OinkWorkspaceSession,
  StoredWorkspaceMetadataFile
} from '../types'
import { parseMarkdownMetadata, serializeMarkdownMetadata, stripFrontmatter } from './metadataUtils'
import { normalizePath } from './pathUtils'
import { ensureWorkspaceConfigAsync } from './workspaceConfig'
import { WorkerResultPayload } from '../workers/indexerWorker'

export const OINK_METADATA_DIR = '.oink'
export const OINK_METADATA_FILE = 'metadata.json'

const LEGACY_NOTIE_DIR = '.notie'
const LEGACY_METADATA_FILE = 'metadata.json'
const LEGACY_PACKAGE_FILE = 'package.json'

export interface WorkspaceMetadataStore {
  workspace: OinkWorkspaceInfo
  session: OinkWorkspaceSession
  files: Record<string, OinkFileMetadata>
  tags: Record<string, { color?: string; description?: string; count?: number }>
  icons: Record<string, string>
  banners: Record<string, string>
  showCover: Record<string, boolean | undefined>
  showIcon: Record<string, boolean | undefined>
  showFileName: Record<string, boolean | undefined>
  customProps: Record<string, Record<string, unknown>>
}

class AsyncOinkMetadataEngine {
  private worker: Worker | null = null
  private pendingCallbacks = new Map<string, (result: unknown) => void>()
  private store: WorkspaceMetadataStore = {
    workspace: {
      name: 'Workspace',
      id: `ws_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    session: {},
    files: {},
    tags: {},
    icons: {},
    banners: {},
    showCover: {},
    showIcon: {},
    showFileName: {},
    customProps: {}
  }
  private currentWorkspacePath: string | null = null
  private saveDebounceTimer: NodeJS.Timeout | null = null

  constructor() {
    this.initWorker()
  }

  private initWorker(): void {
    if (typeof window !== 'undefined' && window.Worker) {
      try {
        this.worker = new Worker(new URL('../workers/indexerWorker.ts', import.meta.url), {
          type: 'module'
        })
        this.worker.onmessage = (event: MessageEvent<WorkerResultPayload>): void => {
          const { id, result } = event.data
          const callback = this.pendingCallbacks.get(id)
          if (callback) {
            callback(result)
            this.pendingCallbacks.delete(id)
          }
        }
      } catch {
        this.worker = null
      }
    }
  }

  public getMetadataFilePath(workspacePath: string): string {
    const norm = normalizePath(workspacePath)
    return `${norm}/${OINK_METADATA_DIR}/${OINK_METADATA_FILE}`
  }

  /**
   * Load rich workspace metadata from .oink/metadata.json (with automatic fallback and migration from legacy .notie)
   */
  public async loadWorkspaceMetadataAsync(workspacePath: string): Promise<WorkspaceMetadataStore> {
    const norm = normalizePath(workspacePath)
    if (!norm) return this.store
    this.currentWorkspacePath = norm

    // Also ensure .oink/config.ts is initialized for the workspace
    void ensureWorkspaceConfigAsync(norm, this.store.workspace.name)

    const primaryPath = `${norm}/${OINK_METADATA_DIR}/${OINK_METADATA_FILE}`
    const legacyPath1 = `${norm}/${LEGACY_NOTIE_DIR}/${LEGACY_METADATA_FILE}`
    const legacyPath2 = `${norm}/${LEGACY_NOTIE_DIR}/${LEGACY_PACKAGE_FILE}`

    let rawData: string | null = null
    let isLegacy = false

    try {
      rawData = await window.api.fs.readFile(primaryPath)
    } catch {
      rawData = null
    }

    if (!rawData) {
      try {
        rawData = await window.api.fs.readFile(legacyPath1)
        if (rawData) isLegacy = true
      } catch {
        // ignore
      }
    }

    if (!rawData) {
      try {
        rawData = await window.api.fs.readFile(legacyPath2)
        if (rawData) isLegacy = true
      } catch {
        // ignore
      }
    }

    if (rawData && rawData.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(rawData) as StoredWorkspaceMetadataFile
        const filesMap: Record<string, OinkFileMetadata> = parsed.files || {}

        // Hydrate backwards-compatible maps if files map is empty
        const icons: Record<string, string> = { ...(parsed.icons || {}) }
        const banners: Record<string, string> = { ...(parsed.banners || {}) }
        const showCover: Record<string, boolean | undefined> = { ...(parsed.showCover || {}) }
        const showIcon: Record<string, boolean | undefined> = { ...(parsed.showIcon || {}) }
        const showFileName: Record<string, boolean | undefined> = { ...(parsed.showFileName || {}) }
        const customProps: Record<string, Record<string, unknown>> = {
          ...(parsed.customProps || {})
        }

        Object.entries(filesMap).forEach(([k, fileMeta]) => {
          const key = k.toLowerCase()
          if (fileMeta.icon) icons[key] = fileMeta.icon
          if (fileMeta.banner) banners[key] = fileMeta.banner
          if (fileMeta.showCover !== undefined) showCover[key] = fileMeta.showCover
          if (fileMeta.showIcon !== undefined) showIcon[key] = fileMeta.showIcon
          if (fileMeta.showFileName !== undefined) showFileName[key] = fileMeta.showFileName
          if (fileMeta.customProps) customProps[key] = fileMeta.customProps
        })

        this.store = {
          workspace: parsed.workspace || {
            name: 'Workspace',
            id: `ws_${Date.now()}`,
            createdAt: Date.now(),
            updatedAt: Date.now()
          },
          session: parsed.session || {},
          files: filesMap,
          tags: parsed.tags || {},
          icons,
          banners,
          showCover,
          showIcon,
          showFileName,
          customProps
        }

        // Automatically migrate legacy .notie data to .oink/metadata.json
        if (isLegacy) {
          void this.saveWorkspaceMetadataAsync(norm)
        }
      } catch (err) {
        console.error('Error parsing workspace metadata JSON:', err)
      }
    }

    return this.store
  }

  /**
   * Save workspace metadata to .oink/metadata.json
   */
  public async saveWorkspaceMetadataAsync(workspacePath?: string): Promise<void> {
    const targetWs = workspacePath ? normalizePath(workspacePath) : this.currentWorkspacePath
    if (!targetWs) return

    const filePath = `${targetWs}/${OINK_METADATA_DIR}/${OINK_METADATA_FILE}`

    // Synchronize files map with flat store
    const consolidatedFiles: Record<string, OinkFileMetadata> = { ...this.store.files }
    const allKeys = new Set([
      ...Object.keys(this.store.icons),
      ...Object.keys(this.store.banners),
      ...Object.keys(this.store.showCover),
      ...Object.keys(this.store.showIcon),
      ...Object.keys(this.store.showFileName),
      ...Object.keys(this.store.customProps),
      ...Object.keys(consolidatedFiles)
    ])

    allKeys.forEach((key) => {
      consolidatedFiles[key] = {
        ...(consolidatedFiles[key] || {}),
        icon: this.store.icons[key] || consolidatedFiles[key]?.icon,
        banner: this.store.banners[key] || consolidatedFiles[key]?.banner,
        showCover:
          this.store.showCover[key] !== undefined
            ? this.store.showCover[key]
            : consolidatedFiles[key]?.showCover,
        showIcon:
          this.store.showIcon[key] !== undefined
            ? this.store.showIcon[key]
            : consolidatedFiles[key]?.showIcon,
        showFileName:
          this.store.showFileName[key] !== undefined
            ? this.store.showFileName[key]
            : consolidatedFiles[key]?.showFileName,
        customProps: this.store.customProps[key] || consolidatedFiles[key]?.customProps
      }
    })

    const payload: StoredWorkspaceMetadataFile = {
      version: 1,
      appVersion: '0.1.0',
      updatedAt: Date.now(),
      workspace: {
        ...this.store.workspace,
        updatedAt: Date.now()
      },
      session: this.store.session,
      files: consolidatedFiles,
      tags: this.store.tags,
      icons: this.store.icons,
      banners: this.store.banners,
      showCover: this.store.showCover,
      showIcon: this.store.showIcon,
      showFileName: this.store.showFileName,
      customProps: this.store.customProps
    }

    try {
      await window.api.fs.writeFile(filePath, JSON.stringify(payload, null, 2))
    } catch (err) {
      console.error(`Failed to save metadata to ${filePath}:`, err)
    }
  }

  /**
   * Schedules a debounced disk save of workspace metadata to .oink/metadata.json
   */
  public scheduleSave(workspacePath?: string): void {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer)
    }
    this.saveDebounceTimer = setTimeout(() => {
      void this.saveWorkspaceMetadataAsync(workspacePath)
    }, 400)
  }

  /**
   * Multithreaded Async Parse Document Metadata
   */
  public async parseDocumentAsync(
    rawContent: string,
    relPath: string
  ): Promise<{ cleanContent: string; metadata: MarkdownMetadata }> {
    const key = relPath.toLowerCase()

    if (!this.worker) {
      const parsed = parseMarkdownMetadata(rawContent)
      if (parsed.metadata.icon) this.store.icons[key] = parsed.metadata.icon
      if (parsed.metadata.banner) this.store.banners[key] = parsed.metadata.banner
      if (parsed.metadata.showCover !== undefined)
        this.store.showCover[key] = parsed.metadata.showCover
      if (parsed.metadata.showIcon !== undefined)
        this.store.showIcon[key] = parsed.metadata.showIcon
      if (parsed.metadata.showFileName !== undefined)
        this.store.showFileName[key] = parsed.metadata.showFileName
      return { cleanContent: parsed.content, metadata: parsed.metadata }
    }

    return new Promise((resolve) => {
      const taskId = `meta_parse_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      this.pendingCallbacks.set(taskId, (result: unknown) => {
        const res = result as { cleanContent: string; metadata: MarkdownMetadata }
        if (res.metadata.icon) this.store.icons[key] = res.metadata.icon
        if (res.metadata.banner) this.store.banners[key] = res.metadata.banner
        if (res.metadata.showCover !== undefined) this.store.showCover[key] = res.metadata.showCover
        if (res.metadata.showIcon !== undefined) this.store.showIcon[key] = res.metadata.showIcon
        if (res.metadata.showFileName !== undefined)
          this.store.showFileName[key] = res.metadata.showFileName
        resolve(res)
      })

      this.worker!.postMessage({
        id: taskId,
        type: 'PARSE_METADATA',
        content: rawContent
      })
    })
  }

  /**
   * Multithreaded Async Serialize Document Metadata for Disk Save
   */
  public async prepareForSaveAsync(
    bodyContent: string,
    relPath: string,
    overrideMeta?: MarkdownMetadata
  ): Promise<string> {
    const key = relPath.toLowerCase()
    const metadata: MarkdownMetadata = {
      icon: overrideMeta?.icon !== undefined ? overrideMeta.icon : this.store.icons[key],
      banner: overrideMeta?.banner !== undefined ? overrideMeta.banner : this.store.banners[key],
      showCover:
        overrideMeta?.showCover !== undefined ? overrideMeta.showCover : this.store.showCover[key],
      showIcon:
        overrideMeta?.showIcon !== undefined ? overrideMeta.showIcon : this.store.showIcon[key],
      showFileName:
        overrideMeta?.showFileName !== undefined
          ? overrideMeta.showFileName
          : this.store.showFileName[key]
    }

    if (!this.worker) {
      return serializeMarkdownMetadata(bodyContent, metadata)
    }

    return new Promise((resolve) => {
      const taskId = `meta_serialize_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      this.pendingCallbacks.set(taskId, (result: unknown) => {
        resolve(result as string)
      })

      this.worker!.postMessage({
        id: taskId,
        type: 'SERIALIZE_METADATA',
        content: bodyContent,
        metadata
      })
    })
  }

  /**
   * Sync document parse fallback
   */
  public parseDocument(
    rawContent: string,
    relPath: string
  ): { cleanContent: string; metadata: MarkdownMetadata } {
    const key = relPath.toLowerCase()
    const parsed = parseMarkdownMetadata(rawContent)
    if (parsed.metadata.icon) this.store.icons[key] = parsed.metadata.icon
    if (parsed.metadata.banner) this.store.banners[key] = parsed.metadata.banner
    if (parsed.metadata.showCover !== undefined)
      this.store.showCover[key] = parsed.metadata.showCover
    if (parsed.metadata.showIcon !== undefined) this.store.showIcon[key] = parsed.metadata.showIcon
    if (parsed.metadata.showFileName !== undefined)
      this.store.showFileName[key] = parsed.metadata.showFileName
    return { cleanContent: parsed.content, metadata: parsed.metadata }
  }

  public getIcon(relPath: string): string | undefined {
    return this.store.icons[relPath.toLowerCase()]
  }

  public setIcon(relPath: string, icon: string | undefined): void {
    const key = relPath.toLowerCase()
    if (icon) {
      this.store.icons[key] = icon
    } else {
      delete this.store.icons[key]
    }
    this.scheduleSave()
  }

  public getBanner(relPath: string): string | undefined {
    return this.store.banners[relPath.toLowerCase()]
  }

  public setBanner(relPath: string, banner: string | undefined): void {
    const key = relPath.toLowerCase()
    if (banner) {
      this.store.banners[key] = banner
    } else {
      delete this.store.banners[key]
    }
    this.scheduleSave()
  }

  public setShowCover(relPath: string, val: boolean | undefined): void {
    const key = relPath.toLowerCase()
    if (val === undefined) {
      delete this.store.showCover[key]
    } else {
      this.store.showCover[key] = val
    }
    this.scheduleSave()
  }

  public setShowIcon(relPath: string, val: boolean | undefined): void {
    const key = relPath.toLowerCase()
    if (val === undefined) {
      delete this.store.showIcon[key]
    } else {
      this.store.showIcon[key] = val
    }
    this.scheduleSave()
  }

  public setShowFileName(relPath: string, val: boolean | undefined): void {
    const key = relPath.toLowerCase()
    if (val === undefined) {
      delete this.store.showFileName[key]
    } else {
      this.store.showFileName[key] = val
    }
    this.scheduleSave()
  }

  public clearFileOverrides(relPath: string): void {
    const key = relPath.toLowerCase()
    delete this.store.showCover[key]
    delete this.store.showIcon[key]
    delete this.store.showFileName[key]
    this.scheduleSave()
  }

  public setFileDetails(relPath: string, details: Partial<OinkFileMetadata>): void {
    const key = relPath.toLowerCase()
    this.store.files[key] = {
      ...(this.store.files[key] || {}),
      ...details
    }
    if (details.icon !== undefined) this.store.icons[key] = details.icon
    if (details.banner !== undefined) this.store.banners[key] = details.banner
    if (details.showCover !== undefined) this.store.showCover[key] = details.showCover
    if (details.showIcon !== undefined) this.store.showIcon[key] = details.showIcon
    if (details.showFileName !== undefined) this.store.showFileName[key] = details.showFileName
    this.scheduleSave()
  }

  public getFileDetails(relPath: string): OinkFileMetadata {
    const key = relPath.toLowerCase()
    return (
      this.store.files[key] || {
        icon: this.store.icons[key],
        banner: this.store.banners[key],
        showCover: this.store.showCover[key],
        showIcon: this.store.showIcon[key],
        showFileName: this.store.showFileName[key]
      }
    )
  }

  public setSessionState(session: Partial<OinkWorkspaceSession>): void {
    this.store.session = {
      ...this.store.session,
      ...session
    }
    this.scheduleSave()
  }

  public getSessionState(): OinkWorkspaceSession {
    return this.store.session
  }

  public setWorkspaceInfo(info: Partial<OinkWorkspaceInfo>): void {
    this.store.workspace = {
      ...this.store.workspace,
      ...info,
      updatedAt: Date.now()
    }
    this.scheduleSave()
  }

  public getWorkspaceInfo(): OinkWorkspaceInfo {
    return this.store.workspace
  }

  public setTag(tagName: string, meta: { color?: string; description?: string }): void {
    this.store.tags[tagName] = {
      ...(this.store.tags[tagName] || {}),
      ...meta
    }
    this.scheduleSave()
  }

  public getTags(): Record<string, { color?: string; description?: string; count?: number }> {
    return this.store.tags
  }

  public getFileMetadata(relPath: string): MarkdownMetadata {
    const key = relPath.toLowerCase()
    return {
      icon: this.store.icons[key],
      banner: this.store.banners[key],
      showCover: this.store.showCover[key],
      showIcon: this.store.showIcon[key],
      showFileName: this.store.showFileName[key]
    }
  }

  public cleanContent(text: string): string {
    return stripFrontmatter(text)
  }

  public getStore(): WorkspaceMetadataStore {
    return this.store
  }
}

export const metadataEngine = new AsyncOinkMetadataEngine()
