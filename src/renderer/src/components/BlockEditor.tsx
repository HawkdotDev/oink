import React, { useEffect, useRef, useCallback } from 'react'
import EditorJS, {
  BlockToolConstructable,
  InlineToolConstructable,
  type LogLevels
} from '@editorjs/editorjs'
// @ts-ignore: Header does not provide official TypeScript typings
import Header from '@editorjs/header'
// @ts-ignore: List does not provide official TypeScript typings
import List from '@editorjs/list'
// @ts-ignore: Underline does not provide official TypeScript typings
import Underline from '@editorjs/underline'
// @ts-ignore: InlineCode does not provide official TypeScript typings
import InlineCode from '@editorjs/inline-code'
// @ts-ignore: Marker does not provide official TypeScript typings
import Marker from '@editorjs/marker'
// @ts-ignore: Quote does not provide official TypeScript typings
import Quote from '@editorjs/quote'
// @ts-ignore: Delimiter does not provide official TypeScript typings
import Delimiter from '@editorjs/delimiter'
// @ts-ignore: DragDrop does not provide official TypeScript typings
import DragDrop from 'editorjs-drag-drop'
import { parseMarkdownToBlocks, htmlToMarkdown } from '../utils/markdownConverter'
import {
  CustomImageTool,
  StrikethroughInlineTool,
  VideoTool,
  EmbedTool,
  ChecklistTool
} from './editor/tools'
import { EditorHistoryManager, EditorJSData, EditorJSBlock } from './editor/EditorHistoryManager'

// Simple Markdown parser to Editor.js JSON data
function parseMarkdownToEditorJS(text: string): EditorJSData {
  const blocks = parseMarkdownToBlocks(text) as EditorJSBlock[]
  return { blocks }
}

// Convert Editor.js JSON data back to Markdown
function serializeEditorJSToMarkdown(data: EditorJSData): string {
  if (!data || !data.blocks) return ''

  return data.blocks
    .map((b: EditorJSBlock) => {
      switch (b.type) {
        case 'heading1': {
          return `# ${htmlToMarkdown(b.data.text || '')}`
        }
        case 'heading2': {
          return `## ${htmlToMarkdown(b.data.text || '')}`
        }
        case 'heading3': {
          return `### ${htmlToMarkdown(b.data.text || '')}`
        }
        case 'header': {
          const level = b.data.level || 2
          const hashes = '#'.repeat(level)
          return `${hashes} ${htmlToMarkdown(b.data.text || '')}`
        }
        case 'code': {
          const codeText = b.data.code || b.data.text || ''
          const lang = b.data.language || ''
          return `\`\`\`${lang}\n${codeText}\n\`\`\``
        }
        case 'list': {
          const items = (b.data.items || []) as string[]
          const isOrdered = b.data.style === 'ordered'
          return items
            .map((item: string, idx: number) => {
              const prefix = isOrdered ? `${idx + 1}. ` : '- '
              return `${prefix}${htmlToMarkdown(item)}`
            })
            .join('\n')
        }
        case 'checklist': {
          const items = b.data.items || []
          return items
            .map((item) => {
              if (typeof item === 'string') {
                return `- [ ] ${htmlToMarkdown(item)}`
              }
              const mark = item.checked ? '[x]' : '[ ]'
              return `- ${mark} ${htmlToMarkdown(item.text || '')}`
            })
            .join('\n')
        }
        case 'quote': {
          const text = b.data.text || ''
          const lines = text.replace(/<br\s*\/?>/gi, '\n').split('\n')
          return lines.map((line) => `> ${htmlToMarkdown(line)}`).join('\n')
        }
        case 'image': {
          const url = b.data.file?.url || ''
          const caption = b.data.caption || ''
          return `![${caption}](${url})`
        }
        case 'video': {
          const url = b.data.url || ''
          return `<video src="${url}" controls></video>`
        }
        case 'embed': {
          const url = b.data.embed || b.data.source || ''
          return `<iframe src="${url}" allowfullscreen></iframe>`
        }
        case 'delimiter': {
          return '---'
        }
        case 'paragraph':
        default: {
          const cleanText = b.data.text ? b.data.text.replace(/<br\s*\/?>/gi, '\n') : ''
          return htmlToMarkdown(cleanText)
        }
      }
    })
    .join('\n\n')
}

// Helper to extend sanitization rules of a tool to allow wikilink elements
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function allowWikilinksInSanitizer(toolClass: any): void {
  if (!toolClass) return
  const originalSanitize = toolClass.sanitize
  Object.defineProperty(toolClass, 'sanitize', {
    get() {
      const base =
        typeof originalSanitize === 'function' ? originalSanitize() : originalSanitize || {}
      return {
        ...base,
        a: {
          ...(base.a || {}),
          class: true,
          'data-path': true,
          href: true
        }
      }
    },
    configurable: true
  })
}

allowWikilinksInSanitizer(Header)
allowWikilinksInSanitizer(List)
allowWikilinksInSanitizer(Quote)
allowWikilinksInSanitizer(Underline)
allowWikilinksInSanitizer(StrikethroughInlineTool)
allowWikilinksInSanitizer(Marker)

interface BlockEditorProps {
  value: string
  onChange: (value: string) => void
  activeFilePath?: string | null
  workspacePath?: string | null
  onWikilinkClick?: (targetName: string) => void
  readOnly?: boolean
  maxUndoHistory?: number
}

function BlockEditorComponent({
  value,
  onChange,
  activeFilePath,
  workspacePath,
  onWikilinkClick,
  readOnly = false,
  maxUndoHistory = 50
}: BlockEditorProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<EditorJS | null>(null)
  const lastSerializedRef = useRef<string>('')
  const isLocalChangeRef = useRef<boolean>(false)
  const destroyingPromiseRef = useRef<Promise<void> | null>(null)

  const historyManagerRef = useRef<EditorHistoryManager>(new EditorHistoryManager(maxUndoHistory))

  useEffect(() => {
    historyManagerRef.current.setMaxHistoryLength(maxUndoHistory)
  }, [maxUndoHistory])

  const workspacePathRef = useRef(workspacePath)
  useEffect(() => {
    workspacePathRef.current = workspacePath
  }, [workspacePath])

  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])

  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const onWikilinkClickRef = useRef(onWikilinkClick)
  useEffect(() => {
    onWikilinkClickRef.current = onWikilinkClick
  }, [onWikilinkClick])

  // Safe helper to destroy an EditorJS instance
  const destroyInstance = async (instance: EditorJS): Promise<void> => {
    try {
      await instance.isReady
      if (typeof instance.destroy === 'function') {
        await instance.destroy()
      }
    } catch {
      // Instance may have unmounted or already been destroyed
    }
  }

  const changeDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingApiRef = useRef<any>(null)

  const flushPendingChanges = useCallback(async (): Promise<void> => {
    if (changeDebounceTimerRef.current) {
      clearTimeout(changeDebounceTimerRef.current)
      changeDebounceTimerRef.current = null
    }
    const api = pendingApiRef.current || editorInstanceRef.current
    if (!api) return
    try {
      const savedData = (await api.saver.save()) as EditorJSData
      const markdown = serializeEditorJSToMarkdown(savedData)

      // Record snapshot to history stack if content changed and not in undo/redo execution
      if (!historyManagerRef.current.isExecutingUndoRedo) {
        historyManagerRef.current.record(savedData)
      }

      if (markdown !== lastSerializedRef.current) {
        isLocalChangeRef.current = true
        lastSerializedRef.current = markdown
        onChangeRef.current(markdown)
      }
    } catch (err) {
      console.error('Error saving EditorJS data on change:', err)
    }
  }, [])

  const handleUndo = useCallback(async (): Promise<void> => {
    const editor = editorInstanceRef.current
    if (!editor) return

    // Flush any typing change first so the current state is recorded
    if (changeDebounceTimerRef.current) {
      clearTimeout(changeDebounceTimerRef.current)
      changeDebounceTimerRef.current = null
      try {
        const currentData = (await editor.saver.save()) as EditorJSData
        historyManagerRef.current.record(currentData)
      } catch {
        // ignore
      }
    }

    await historyManagerRef.current.undo(editor, (targetData) => {
      const markdown = serializeEditorJSToMarkdown(targetData)
      isLocalChangeRef.current = true
      lastSerializedRef.current = markdown
      onChangeRef.current(markdown)
    })
  }, [])

  const handleRedo = useCallback(async (): Promise<void> => {
    const editor = editorInstanceRef.current
    if (!editor) return

    await historyManagerRef.current.redo(editor, (targetData) => {
      const markdown = serializeEditorJSToMarkdown(targetData)
      isLocalChangeRef.current = true
      lastSerializedRef.current = markdown
      onChangeRef.current(markdown)
    })
  }, [])

  // Listen for external undo/redo dispatch events
  useEffect(() => {
    const handleOinkUndo = (): void => {
      void handleUndo()
    }
    const handleOinkRedo = (): void => {
      void handleRedo()
    }

    window.addEventListener('oink:undo', handleOinkUndo)
    window.addEventListener('oink:redo', handleOinkRedo)
    return (): void => {
      window.removeEventListener('oink:undo', handleOinkUndo)
      window.removeEventListener('oink:redo', handleOinkRedo)
    }
  }, [handleUndo, handleRedo])

  // Initialize/reinitialize editor when file changes
  useEffect(() => {
    if (!containerRef.current) return

    let isDestroyed = false
    let editor: EditorJS | null = null

    const init = async (): Promise<void> => {
      if (destroyingPromiseRef.current) {
        try {
          await destroyingPromiseRef.current
        } catch {
          // Ignore cleanup race condition
        }
        destroyingPromiseRef.current = null
      }

      if (editorInstanceRef.current) {
        const previousInstance = editorInstanceRef.current
        editorInstanceRef.current = null
        destroyingPromiseRef.current = destroyInstance(previousInstance)
        try {
          await destroyingPromiseRef.current
        } catch {
          // Ignore cleanup race condition
        }
        destroyingPromiseRef.current = null
      }

      if (isDestroyed) return

      const parsedData = parseMarkdownToEditorJS(valueRef.current)
      historyManagerRef.current.initialize(parsedData)

      editor = new EditorJS({
        holder: containerRef.current || 'editorjs-container',
        logLevel: 'ERROR' as unknown as LogLevels,
        data: parsedData,
        sanitizer: {
          a: {
            class: 'wikilink',
            'data-path': true,
            href: true
          }
        },
        tools: {
          heading1: {
            class: Header as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Heading 1',
              levels: [1],
              defaultLevel: 1
            },
            toolbox: {
              title: 'Heading 1'
            }
          },
          heading2: {
            class: Header as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Heading 2',
              levels: [2],
              defaultLevel: 2
            },
            toolbox: {
              title: 'Heading 2'
            }
          },
          heading3: {
            class: Header as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Heading 3',
              levels: [3],
              defaultLevel: 3
            },
            toolbox: {
              title: 'Heading 3'
            }
          },
          list: {
            class: List as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered'
            }
          },
          checklist: {
            class: ChecklistTool as unknown as BlockToolConstructable,
            inlineToolbar: true
          },
          quote: {
            class: Quote as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Enter a quote'
            }
          },
          delimiter: Delimiter as unknown as BlockToolConstructable,
          image: {
            class: CustomImageTool as unknown as BlockToolConstructable,
            config: {
              uploader: {
                uploadByFile(file: File) {
                  return new Promise((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = async (e) => {
                      const dataUrl = e.target?.result as string
                      if (workspacePathRef.current && window.api?.fs?.saveAttachment) {
                        try {
                          const relPath = await window.api.fs.saveAttachment(
                            workspacePathRef.current,
                            file.name || 'attachment.png',
                            dataUrl
                          )
                          resolve({
                            success: 1,
                            file: {
                              url: relPath
                            }
                          })
                          return
                        } catch (err) {
                          console.error(
                            'Failed saving attachment locally, falling back to dataUrl:',
                            err
                          )
                        }
                      }
                      resolve({
                        success: 1,
                        file: {
                          url: dataUrl
                        }
                      })
                    }
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                  })
                },
                uploadByUrl(url: string) {
                  return new Promise((resolve) => {
                    resolve({
                      success: 1,
                      file: {
                        url: url
                      }
                    })
                  })
                }
              }
            }
          },
          video: {
            class: VideoTool as unknown as BlockToolConstructable,
            toolbox: {
              title: 'Video',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>'
            }
          },
          embed: {
            class: EmbedTool as unknown as BlockToolConstructable,
            toolbox: {
              title: 'Embed',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
            }
          },
          underline: Underline as unknown as InlineToolConstructable,
          strikethrough: StrikethroughInlineTool as unknown as InlineToolConstructable,
          inlineCode: InlineCode as unknown as InlineToolConstructable,
          marker: Marker as unknown as InlineToolConstructable
        },
        readOnly: Boolean(readOnly),
        placeholder: "Press 'Tab' or click '+' to write...",
        onReady: () => {
          const inst = editorInstanceRef.current || editor
          if (inst) {
            new DragDrop(inst)
          }
        },
        onChange: (api) => {
          if (historyManagerRef.current.isExecutingUndoRedo) return
          pendingApiRef.current = api
          if (changeDebounceTimerRef.current) {
            clearTimeout(changeDebounceTimerRef.current)
          }
          changeDebounceTimerRef.current = setTimeout(() => {
            void flushPendingChanges()
          }, 150)
        }
      })

      editorInstanceRef.current = editor
      lastSerializedRef.current = valueRef.current
    }

    init()

    return () => {
      isDestroyed = true
      void flushPendingChanges()
      if (editor) {
        const instanceToDestroy = editor
        editorInstanceRef.current = null
        destroyingPromiseRef.current = destroyInstance(instanceToDestroy)
      }
    }
  }, [activeFilePath, readOnly, flushPendingChanges])

  // Handle value updates from parent (e.g. external edits, reload, etc.)
  useEffect(() => {
    if (isLocalChangeRef.current) {
      isLocalChangeRef.current = false
      return
    }

    if (value !== lastSerializedRef.current && editorInstanceRef.current) {
      const parsedData = parseMarkdownToEditorJS(value)
      editorInstanceRef.current.isReady
        .then(() => {
          editorInstanceRef.current?.blocks.render(parsedData)
          lastSerializedRef.current = value
          historyManagerRef.current.initialize(parsedData)
        })
        .catch(() => {
          // Ignore if editor instance was unmounted
        })
    }
  }, [value])

  // Key Event Remap Listener:
  // - Ctrl + Z -> Undo
  // - Ctrl + Y / Ctrl + Shift + Z -> Redo
  // - Enter -> Line Break inside block
  // - Ctrl + Enter -> New paragraph block below
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      // 1. Ctrl / Cmd + Z (Undo) and Ctrl + Y / Ctrl + Shift + Z (Redo)
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase()
        if (key === 'z' && !e.shiftKey) {
          e.preventDefault()
          e.stopPropagation()
          void handleUndo()
          return
        } else if (key === 'y' || (e.shiftKey && key === 'z')) {
          e.preventDefault()
          e.stopPropagation()
          void handleRedo()
          return
        }
      }

      // 2. Enter behavior
      if (e.key === 'Enter') {
        if (!e.ctrlKey && !e.shiftKey) {
          // Normal Enter -> insert line break inside current block using Selection/Range
          e.preventDefault()
          e.stopPropagation()
          const sel = window.getSelection()
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0)
            range.deleteContents()
            const br = document.createElement('br')
            range.insertNode(br)
            range.setStartAfter(br)
            range.setEndAfter(br)
            sel.removeAllRanges()
            sel.addRange(range)

            // Trigger change notification on line break
            if (changeDebounceTimerRef.current) {
              clearTimeout(changeDebounceTimerRef.current)
            }
            changeDebounceTimerRef.current = setTimeout(() => {
              void flushPendingChanges()
            }, 150)
          }
        } else if (e.ctrlKey) {
          // Ctrl + Enter -> create and focus a new paragraph block below
          e.preventDefault()
          e.stopPropagation()

          const editorInstance = editorInstanceRef.current
          if (editorInstance) {
            try {
              const index = editorInstance.blocks.getCurrentBlockIndex()
              editorInstance.blocks.insert('paragraph', { text: '' }, {}, index + 1, true)
              setTimeout(() => {
                try {
                  editorInstance.caret.setToBlock(index + 1, 'start')
                } catch (err) {
                  console.error('Failed to set caret to new block:', err)
                }
              }, 20)
            } catch (err) {
              console.error('Failed to programmatically insert block:', err)
            }
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown, true)
    return () => {
      container.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [activeFilePath, handleUndo, handleRedo, flushPendingChanges])

  // Delegated click listener to catch wikilink clicks (both HTML anchors and raw [[Link]] text)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseClick = (e: MouseEvent): void => {
      const target = e.target as HTMLElement
      const wikilinkEl = target.closest('.wikilink')
      if (wikilinkEl) {
        e.preventDefault()
        e.stopPropagation()
        const path = wikilinkEl.getAttribute('data-path')
        if (path && onWikilinkClickRef.current) {
          onWikilinkClickRef.current(path)
        }
        return
      }

      let range: Range | null = null
      // @ts-ignore: document.caretPositionFromPoint is standard in modern browsers but may lack TS DOM types
      if (typeof document.caretPositionFromPoint === 'function') {
        // @ts-ignore: document.caretPositionFromPoint return object
        const pos = document.caretPositionFromPoint(e.clientX, e.clientY)
        if (pos && pos.offsetNode) {
          range = document.createRange()
          range.setStart(pos.offsetNode, pos.offset)
          range.setEnd(pos.offsetNode, pos.offset)
        }
      } else if (typeof document.caretRangeFromPoint === 'function') {
        range = document.caretRangeFromPoint(e.clientX, e.clientY)
      } else {
        const firefoxEvent = e as MouseEvent & { rangeParent?: Node; rangeOffset?: number }
        if (firefoxEvent.rangeParent !== undefined && firefoxEvent.rangeOffset !== undefined) {
          range = document.createRange()
          range.setStart(firefoxEvent.rangeParent, firefoxEvent.rangeOffset)
        }
      }

      if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
        const textNode = range.startContainer as Text
        const offset = range.startOffset
        const text = textNode.textContent || ''

        let startIdx = -1
        for (let i = offset; i >= 0; i--) {
          if (text[i] === '[' && text[i - 1] === '[') {
            startIdx = i - 1
            break
          }
          if (text[i] === '\n' || text[i] === '\r') break
        }

        if (startIdx !== -1) {
          let endIdx = -1
          for (let i = offset; i < text.length; i++) {
            if (text[i] === ']' && text[i + 1] === ']') {
              endIdx = i + 1
              break
            }
            if (text[i] === '\n' || text[i] === '\r') break
          }

          if (endIdx !== -1 && endIdx > startIdx + 3) {
            const rawTarget = text.substring(startIdx + 2, endIdx - 1).trim()
            if (rawTarget && onWikilinkClickRef.current) {
              e.preventDefault()
              e.stopPropagation()
              onWikilinkClickRef.current(rawTarget)
            }
          }
        }
      }
    }

    container.addEventListener('click', handleMouseClick)
    return () => {
      container.removeEventListener('click', handleMouseClick)
    }
  }, [])

  return <div ref={containerRef} className="block-editor-wrapper" id="editorjs-container" />
}

export default React.memo(BlockEditorComponent)
