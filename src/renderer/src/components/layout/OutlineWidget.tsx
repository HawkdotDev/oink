import React, { useState, useMemo, useCallback } from 'react'
import { Search, X, ListTree } from 'lucide-react'

export interface OutlineHeadingItem {
  id?: string
  idx?: number
  level: number
  text: string
  rawText?: string
  line?: number
}

interface OutlineWidgetProps {
  content?: string
  headings?: OutlineHeadingItem[]
}

function cleanMarkdownHeading(text: string): string {
  if (!text) return ''
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(^|[^*])\*(?!\*)(.*?)\*(?!\*)/g, '$1$2')
    .replace(/(^|[^_])_(?!_)(.*?)_(?!_)/g, '$1$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label || target)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

function OutlineWidgetComponent({
  content = '',
  headings: propHeadings
}: OutlineWidgetProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeHeadingText, setActiveHeadingText] = useState<string | null>(null)

  const parsedHeadings: OutlineHeadingItem[] = useMemo(() => {
    if (propHeadings && propHeadings.length > 0) {
      return propHeadings.map((h, i) => ({
        id: h.id || `heading-${i}-${h.level}`,
        idx: h.idx ?? i,
        level: h.level,
        text: cleanMarkdownHeading(h.text),
        rawText: h.rawText || h.text,
        line: h.line
      }))
    }

    if (!content) return []
    return content
      .split('\n')
      .map((line, idx) => {
        const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
        if (!headingMatch) return null
        const level = headingMatch[1].length
        const rawText = headingMatch[2]
        const text = cleanMarkdownHeading(rawText)
        return {
          id: `heading-${idx}-${level}`,
          idx,
          level,
          text,
          rawText,
          line: idx + 1
        }
      })
      .filter(Boolean) as OutlineHeadingItem[]
  }, [propHeadings, content])

  const filteredHeadings = useMemo(() => {
    if (!searchQuery.trim()) return parsedHeadings
    const q = searchQuery.toLowerCase().trim()
    return parsedHeadings.filter((h) => h.text.toLowerCase().includes(q))
  }, [parsedHeadings, searchQuery])

  const scrollToHeading = useCallback((item: OutlineHeadingItem): void => {
    setActiveHeadingText(item.text)
    const editorElem =
      document.querySelector('.editor-container') ||
      document.querySelector('.codex-editor') ||
      document.querySelector('.editor-wrapper')

    if (!editorElem) return

    const headers = editorElem.querySelectorAll('h1, h2, h3, h4, h5, h6, .ce-header')
    const search = item.text.trim().toLowerCase()

    for (const h of Array.from(headers)) {
      const cleanHText = (h.textContent || '').trim().toLowerCase()
      if (cleanHText === search || cleanHText.includes(search) || search.includes(cleanHText)) {
        h.scrollIntoView({ behavior: 'smooth', block: 'center' })
        h.classList.add('outline-target-highlight')
        setTimeout(() => {
          h.classList.remove('outline-target-highlight')
        }, 1200)
        break
      }
    }
  }, [])

  return (
    <div className="outline-widget-root">
      {/* Search / Filter bar if more than 3 headings */}
      {parsedHeadings.length > 3 && (
        <div className="outline-search-box">
          <Search size={12} strokeWidth={1.75} className="text-zinc-500 shrink-0" />
          <input
            type="text"
            className="outline-search-input"
            placeholder="Filter outline..."
            value={searchQuery}
            onChange={(e): void => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="outline-search-clear"
              onClick={(): void => setSearchQuery('')}
              title="Clear filter"
            >
              <X size={11} />
            </button>
          )}
        </div>
      )}

      {/* Headings List */}
      <div className="outline-list-container">
        {filteredHeadings.length === 0 ? (
          <div className="outline-empty">
            <ListTree size={20} strokeWidth={1.25} className="text-zinc-600 mb-1" />
            <span className="text-xs text-zinc-500">
              {searchQuery ? 'No matching headings' : 'No headings in document'}
            </span>
            <span className="text-[11px] text-zinc-600 mt-0.5">
              {searchQuery ? 'Try a different filter term' : 'Add # Heading 1 to structure note'}
            </span>
          </div>
        ) : (
          filteredHeadings.map((item) => {
            const indentLevel = Math.max(0, item.level - 1)
            const isActive = activeHeadingText === item.text

            return (
              <button
                key={item.id}
                type="button"
                className={`outline-item-row outline-level-${item.level} ${isActive ? 'is-active' : ''}`}
                style={{ paddingLeft: `${indentLevel * 12 + 10}px` }}
                onClick={(): void => scrollToHeading(item)}
                title={`Jump to: ${item.text}`}
              >
                <span className="outline-level-badge">{`H${item.level}`}</span>
                <span className="outline-item-text">{item.text}</span>
              </button>
            )
          })
        )}
      </div>

      {/* Footer info stats */}
      {parsedHeadings.length > 0 && (
        <div className="outline-widget-footer">
          <span>
            {parsedHeadings.length} {parsedHeadings.length === 1 ? 'heading' : 'headings'}
          </span>
          {searchQuery && (
            <span>
              {filteredHeadings.length} of {parsedHeadings.length} matching
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default React.memo(OutlineWidgetComponent)
