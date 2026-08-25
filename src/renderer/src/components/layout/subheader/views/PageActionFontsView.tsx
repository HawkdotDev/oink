import React, { useRef, useEffect } from 'react'
import { ChevronLeft, Search, Check } from 'lucide-react'
import { FontOption, AVAILABLE_FONTS } from './fontsData'

export type { FontOption }

interface PageActionFontsViewProps {
  editorFontFamily: string
  fontSearchQuery: string
  onFontSearchChange: (val: string) => void
  onSelectFont: (font: FontOption) => void
  onBack: () => void
}

function PageActionFontsViewComponent({
  editorFontFamily,
  fontSearchQuery,
  onFontSearchChange,
  onSelectFont,
  onBack
}: PageActionFontsViewProps): React.JSX.Element {
  const fontSearchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => {
      fontSearchInputRef.current?.focus()
    }, 50)
  }, [])

  const fontQ = fontSearchQuery.toLowerCase().trim()
  const filteredFonts = AVAILABLE_FONTS.filter(
    (f) => !fontQ || f.name.toLowerCase().includes(fontQ) || f.category.includes(fontQ)
  )

  return (
    <div className="font-chooser-view">
      <div className="font-chooser-header">
        <button
          type="button"
          className="font-chooser-back-btn"
          onClick={onBack}
          title="Back to options"
        >
          <ChevronLeft size={14} />
          <span>Fonts</span>
        </button>
      </div>

      <div className="page-actions-search-wrapper my-1">
        <Search size={13} className="text-zinc-400 shrink-0" />
        <input
          ref={fontSearchInputRef}
          type="text"
          className="page-actions-search-input"
          placeholder="Filter fonts..."
          value={fontSearchQuery}
          onChange={(e): void => onFontSearchChange(e.target.value)}
        />
      </div>

      <div className="font-chooser-list">
        {filteredFonts.map((f) => {
          const isSelected =
            editorFontFamily.toLowerCase().includes(f.id) ||
            editorFontFamily.toLowerCase().includes(f.name.toLowerCase().split(' ')[0])
          return (
            <div
              key={f.id}
              className={`font-chooser-item ${isSelected ? 'active' : ''}`}
              style={{ fontFamily: f.family }}
              onClick={(): void => onSelectFont(f)}
            >
              <div className="flex items-center gap-2">
                <span className="font-chooser-preview text-sm font-medium">Ag</span>
                <span className="font-chooser-name text-xs">{f.name}</span>
              </div>
              {isSelected && <Check size={12} className="text-white shrink-0" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default React.memo(PageActionFontsViewComponent)
