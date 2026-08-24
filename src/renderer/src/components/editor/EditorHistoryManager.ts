export interface EditorJSBlock {
  type: string
  data: {
    text?: string
    code?: string
    language?: string
    level?: number
    style?: string
    items?: (string | { text?: string; checked?: boolean })[]
    alignment?: string
    file?: {
      url?: string
    }
    url?: string
    source?: string
    embed?: string
    service?: string
    caption?: string
    withBorder?: boolean
    withBackground?: boolean
    stretched?: boolean
  }
}

export interface EditorJSData {
  blocks: EditorJSBlock[]
}

export class EditorHistoryManager {
  private history: EditorJSData[] = []
  private historyIndex: number = -1
  private maxHistoryLength: number = 50
  public isExecutingUndoRedo: boolean = false

  constructor(maxHistoryLength: number = 50) {
    this.maxHistoryLength = Math.max(5, maxHistoryLength)
  }

  public setMaxHistoryLength(max: number): void {
    this.maxHistoryLength = Math.max(5, max)
    if (this.history.length > this.maxHistoryLength) {
      const overflow = this.history.length - this.maxHistoryLength
      this.history.splice(0, overflow)
      this.historyIndex = Math.max(0, this.historyIndex - overflow)
    }
  }

  public initialize(initialData: EditorJSData): void {
    const clone = JSON.parse(JSON.stringify(initialData)) as EditorJSData
    this.history = [clone]
    this.historyIndex = 0
    this.isExecutingUndoRedo = false
  }

  public record(newData: EditorJSData): boolean {
    if (this.isExecutingUndoRedo) return false
    if (!newData || !newData.blocks) return false

    const current = this.history[this.historyIndex]
    const currentJson = current ? JSON.stringify(current.blocks) : ''
    const newJson = JSON.stringify(newData.blocks)

    if (currentJson === newJson) {
      return false
    }

    // Drop redo states forward
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1)
    }

    const clone = JSON.parse(newJson)
    this.history.push({ blocks: clone })

    if (this.history.length > this.maxHistoryLength) {
      this.history.shift()
      this.historyIndex = this.history.length - 1
    } else {
      this.historyIndex = this.history.length - 1
    }

    return true
  }

  public async undo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editor: any,
    onApply?: (data: EditorJSData) => void
  ): Promise<boolean> {
    if (!this.canUndo()) return false

    try {
      this.isExecutingUndoRedo = true
      this.historyIndex--
      const targetData = this.history[this.historyIndex]
      const clone = JSON.parse(JSON.stringify(targetData)) as EditorJSData

      await editor.render(clone)
      if (onApply) {
        onApply(clone)
      }
      return true
    } catch (err) {
      console.error('Error executing editor undo:', err)
      return false
    } finally {
      // Ensure small delay so render onChange doesn't capture duplicate snapshot
      setTimeout(() => {
        this.isExecutingUndoRedo = false
      }, 100)
    }
  }

  public async redo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editor: any,
    onApply?: (data: EditorJSData) => void
  ): Promise<boolean> {
    if (!this.canRedo()) return false

    try {
      this.isExecutingUndoRedo = true
      this.historyIndex++
      const targetData = this.history[this.historyIndex]
      const clone = JSON.parse(JSON.stringify(targetData)) as EditorJSData

      await editor.render(clone)
      if (onApply) {
        onApply(clone)
      }
      return true
    } catch (err) {
      console.error('Error executing editor redo:', err)
      return false
    } finally {
      setTimeout(() => {
        this.isExecutingUndoRedo = false
      }, 100)
    }
  }

  public canUndo(): boolean {
    return this.historyIndex > 0
  }

  public canRedo(): boolean {
    return this.historyIndex < this.history.length - 1
  }

  public clear(): void {
    this.history = []
    this.historyIndex = -1
    this.isExecutingUndoRedo = false
  }
}
