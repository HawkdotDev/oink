import React from 'react'
import {
  Search,
  Type,
  Copy,
  Files,
  Trash2,
  Maximize2,
  Sliders,
  Lock,
  Unlock,
  Sparkles,
  MessageSquareQuote,
  Languages,
  Download,
  Upload,
  RotateCcw,
  ChevronRight,
  Check
} from 'lucide-react'
import { FontOption } from './fontsData'

interface PageActionMainViewProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  searchInputRef: React.RefObject<HTMLInputElement | null>
  recentFonts: FontOption[]
  editorFontFamily: string
  onSelectFont: (font: FontOption) => void
  onNavigateSubView: (view: 'fonts' | 'customize' | 'textCustomization' | 'export') => void
  copiedContent: boolean
  onCopyPageContent: () => void
  onDuplicateFile?: () => void
  onDeleteFile?: () => void
  isFullScreen?: boolean
  onToggleFullScreen?: () => void
  isPageLocked?: boolean
  onToggleLockPage?: () => void
  onOpenAI?: () => void
  onImport?: () => void
  onUndo?: () => void
  onClose: () => void
}

function PageActionMainViewComponent({
  searchQuery,
  onSearchChange,
  searchInputRef,
  recentFonts,
  editorFontFamily,
  onSelectFont,
  onNavigateSubView,
  copiedContent,
  onCopyPageContent,
  onDuplicateFile,
  onDeleteFile,
  isFullScreen = false,
  onToggleFullScreen,
  isPageLocked = false,
  onToggleLockPage,
  onOpenAI,
  onImport,
  onUndo,
  onClose
}: PageActionMainViewProps): React.JSX.Element {
  const q = searchQuery.toLowerCase().trim()
  const match = (text: string): boolean => {
    if (!q) return true
    return text.toLowerCase().includes(q)
  }

  return (
    <>
      {/* 1. Search Actions Input */}
      <div className="page-actions-search-wrapper">
        <Search size={13} className="text-zinc-400 shrink-0" />
        <input
          ref={searchInputRef}
          type="text"
          className="page-actions-search-input"
          placeholder="Search actions..."
          value={searchQuery}
          onChange={(e): void => onSearchChange(e.target.value)}
        />
      </div>

      {/* 2. Top 3 Recent Font Selector Cards */}
      {!q && (
        <div className="page-actions-font-selector">
          {recentFonts.map((f, idx) => {
            const isActive =
              editorFontFamily.toLowerCase().includes(f.id) ||
              editorFontFamily.toLowerCase().includes(f.name.toLowerCase().split(' ')[0]) ||
              (idx === 0 &&
                !recentFonts.some((rf) => editorFontFamily.toLowerCase().includes(rf.id)))
            return (
              <button
                key={f.id || idx}
                type="button"
                className={`font-choice-card ${isActive ? 'active' : ''}`}
                onClick={(): void => onSelectFont(f)}
                title={`Select font: ${f.name}`}
              >
                <span className="font-preview" style={{ fontFamily: f.family }}>
                  Ag
                </span>
                <span className="font-label truncate max-w-16">{f.name}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="page-actions-list">
        {/* 'Choose other fonts' dropdown trigger */}
        {match('fonts more fonts typography choose font') && (
          <div className="page-action-row" onClick={(): void => onNavigateSubView('fonts')}>
            <div className="page-action-left">
              <Type size={14} className="text-zinc-400 shrink-0" />
              <span className="page-action-title">Choose other fonts</span>
            </div>
            <ChevronRight size={13} className="text-zinc-500 shrink-0" />
          </div>
        )}

        {/* Action Item: Copy Page Contents */}
        {match('copy page contents markdown') && (
          <div
            className="page-action-row"
            onClick={(): void => {
              onCopyPageContent()
              onClose()
            }}
          >
            <div className="page-action-left">
              {copiedContent ? (
                <Check size={14} className="text-emerald-400 shrink-0" />
              ) : (
                <Copy size={14} className="text-zinc-400 shrink-0" />
              )}
              <span className="page-action-title">
                {copiedContent ? 'Copied contents!' : 'Copy page contents'}
              </span>
            </div>
          </div>
        )}

        {/* Action Item: Duplicate */}
        {match('duplicate clone copy') && onDuplicateFile && (
          <div
            className="page-action-row"
            onClick={(): void => {
              onDuplicateFile()
              onClose()
            }}
          >
            <div className="page-action-left">
              <Files size={14} className="text-zinc-400 shrink-0" />
              <span className="page-action-title">Duplicate</span>
            </div>
            <span className="page-action-shortcut">Ctrl+D</span>
          </div>
        )}

        {/* Action Item: Move to Trash */}
        {match('move to trash delete remove') && onDeleteFile && (
          <div
            className="page-action-row danger"
            onClick={(): void => {
              onDeleteFile()
              onClose()
            }}
          >
            <div className="page-action-left">
              <Trash2 size={14} className="text-red-400 shrink-0" />
              <span className="page-action-title text-red-400">Move to Trash</span>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="page-actions-divider" />

        {/* Text Customisation */}
        {match('text customisation customization font size line height spacing weight') && (
          <div
            className="page-action-row"
            onClick={(): void => onNavigateSubView('textCustomization')}
          >
            <div className="page-action-left">
              <Type size={14} className="text-zinc-400 shrink-0" />
              <span className="page-action-title">Text Customisation</span>
            </div>
            <ChevronRight size={13} className="text-zinc-500 shrink-0" />
          </div>
        )}

        {/* Toggle: Full screen */}
        {match('full screen distraction free zen mode') && onToggleFullScreen && (
          <div
            className="page-action-row"
            onClick={(): void => {
              onToggleFullScreen()
              onClose()
            }}
          >
            <div className="page-action-left">
              <Maximize2 size={14} className="text-zinc-400 shrink-0" />
              <span className="page-action-title">Full screen</span>
            </div>
            <div className={`page-action-switch ${isFullScreen ? 'active' : ''}`}>
              <div className="switch-knob" />
            </div>
          </div>
        )}

        {/* Customize page */}
        {match('customize page options metrics icon cover elements') && (
          <div className="page-action-row" onClick={(): void => onNavigateSubView('customize')}>
            <div className="page-action-left">
              <Sliders size={14} className="text-zinc-400 shrink-0" />
              <span className="page-action-title">Customize page</span>
            </div>
            <ChevronRight size={13} className="text-zinc-500 shrink-0" />
          </div>
        )}

        {/* Divider */}
        <div className="page-actions-divider" />

        {/* Toggle: Lock page */}
        {match('lock page read only') && onToggleLockPage && (
          <div className="page-action-row" onClick={onToggleLockPage}>
            <div className="page-action-left">
              {isPageLocked ? (
                <Lock size={14} className="text-amber-400 shrink-0" />
              ) : (
                <Unlock size={14} className="text-zinc-400 shrink-0" />
              )}
              <span className="page-action-title">Lock page</span>
            </div>
            <div className={`page-action-switch ${isPageLocked ? 'active' : ''}`}>
              <div className="switch-knob" />
            </div>
          </div>
        )}

        {/* Action Item: Use with AI */}
        {match('use with ai assistant') && (
          <div
            className="page-action-row"
            onClick={(): void => {
              if (onOpenAI) onOpenAI()
              onClose()
            }}
          >
            <div className="page-action-left">
              <Sparkles size={14} className="text-purple-400 shrink-0" />
              <span className="page-action-title">Use with AI</span>
            </div>
            <ChevronRight size={13} className="text-zinc-500" />
          </div>
        )}

        {/* Divider */}
        <div className="page-actions-divider" />

        {/* Action Item: Suggest edits */}
        {match('suggest edits feedback') && (
          <div
            className="page-action-row"
            onClick={(): void => {
              if (onOpenAI) onOpenAI()
              onClose()
            }}
          >
            <div className="page-action-left">
              <MessageSquareQuote size={14} className="text-zinc-400 shrink-0" />
              <span className="page-action-title">Suggest edits</span>
            </div>
          </div>
        )}

        {/* Action Item: Translate */}
        {match('translate language') && (
          <div
            className="page-action-row"
            onClick={(): void => {
              if (onOpenAI) onOpenAI()
              onClose()
            }}
          >
            <div className="page-action-left">
              <Languages size={14} className="text-zinc-400 shrink-0" />
              <span className="page-action-title">Translate</span>
            </div>
            <ChevronRight size={13} className="text-zinc-500" />
          </div>
        )}

        {/* Divider */}
        <div className="page-actions-divider" />

        {/* Action Item: Import */}
        {match('import open file upload') && onImport && (
          <div
            className="page-action-row"
            onClick={(): void => {
              onImport()
              onClose()
            }}
          >
            <div className="page-action-left">
              <Download size={14} className="text-zinc-400 shrink-0" />
              <span className="page-action-title">Import</span>
            </div>
          </div>
        )}

        {/* Action Item: Export */}
        {match('export download html markdown text save as') && (
          <div className="page-action-row" onClick={(): void => onNavigateSubView('export')}>
            <div className="page-action-left">
              <Upload size={14} className="text-zinc-400 shrink-0" />
              <span className="page-action-title">Export</span>
            </div>
            <ChevronRight size={13} className="text-zinc-500 shrink-0" />
          </div>
        )}

        {/* Action Item: Undo */}
        {match('undo revert') && (
          <div
            className="page-action-row"
            onClick={(): void => {
              if (onUndo) onUndo()
              else document.execCommand('undo')
              onClose()
            }}
          >
            <div className="page-action-left">
              <RotateCcw size={14} className="text-zinc-400 shrink-0" />
              <span className="page-action-title">Undo</span>
            </div>
            <span className="page-action-shortcut">Ctrl+Z</span>
          </div>
        )}
      </div>
    </>
  )
}

export default React.memo(PageActionMainViewComponent)
