import React, { useState, useRef, useEffect } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { StatusStatsConfig } from '../../../types'
import PageActionFontsView from './views/PageActionFontsView'
import { FontOption, DEFAULT_RECENT_FONTS } from './views/fontsData'
import PageActionCustomizeView from './views/PageActionCustomizeView'
import PageActionTypographyView from './views/PageActionTypographyView'
import PageActionExportView from './views/PageActionExportView'
import PageActionMainView from './views/PageActionMainView'

export { type FontOption }

export interface PageActionsMenuProps {
  activeFilePath?: string | null
  workspacePath?: string | null
  fileContent?: string
  editorFontFamily: string
  onChangeFontFamily: (font: string) => void
  editorFontSize: number
  onChangeFontSize: (size: number) => void
  editorLineHeight?: string
  onChangeLineHeight?: (val: string) => void
  editorLetterSpacing?: string
  onChangeLetterSpacing?: (val: string) => void
  editorParagraphSpacing?: string
  onChangeParagraphSpacing?: (val: string) => void
  editorFontWeight?: string
  onChangeFontWeight?: (val: string) => void
  editorTextAlign?: string
  onChangeTextAlign?: (val: string) => void
  isFullScreen?: boolean
  onToggleFullScreen?: () => void
  isPageLocked?: boolean
  onToggleLockPage?: () => void
  onDuplicateFile?: () => void
  onDeleteFile?: () => void
  onOpenAI?: () => void
  onUndo?: () => void
  onImport?: () => void
  onExportHTML?: () => void
  onExportText?: () => void
  onExportMarkdown?: () => void
  onCopyLink?: () => void

  // Customize page options
  statsConfig?: StatusStatsConfig
  onToggleStat?: (key: keyof StatusStatsConfig) => void
  showCover?: boolean
  showIcon?: boolean
  showFileName?: boolean
  isOnlyThisFile?: boolean
  onToggleCover?: () => void
  onToggleIcon?: () => void
  onToggleFileName?: () => void
  onToggleOnlyThisFile?: () => void
}

function PageActionsMenu({
  activeFilePath,
  fileContent = '',
  editorFontFamily,
  onChangeFontFamily,
  editorFontSize,
  onChangeFontSize,
  editorLineHeight = '1.7',
  onChangeLineHeight,
  editorLetterSpacing = 'normal',
  onChangeLetterSpacing,
  editorParagraphSpacing = '1.2em',
  onChangeParagraphSpacing,
  editorFontWeight = '400',
  onChangeFontWeight,
  editorTextAlign = 'left',
  onChangeTextAlign,
  isFullScreen = false,
  onToggleFullScreen,
  isPageLocked = false,
  onToggleLockPage,
  onDuplicateFile,
  onDeleteFile,
  onOpenAI,
  onUndo,
  onImport,
  onExportHTML,
  onExportText,
  onExportMarkdown,
  onCopyLink,
  statsConfig,
  onToggleStat,
  showCover = true,
  showIcon = true,
  showFileName = true,
  isOnlyThisFile = false,
  onToggleCover,
  onToggleIcon,
  onToggleFileName,
  onToggleOnlyThisFile
}: PageActionsMenuProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [activeSubView, setActiveSubView] = useState<
    'main' | 'fonts' | 'customize' | 'textCustomization' | 'export'
  >('main')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [fontSearchQuery, setFontSearchQuery] = useState<string>('')
  const [copiedContent, setCopiedContent] = useState<boolean>(false)
  const [recentFonts, setRecentFonts] = useState<FontOption[]>(() => {
    try {
      const saved = localStorage.getItem('oink_recent_fonts')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 3)
      }
    } catch {
      // ignore
    }
    return DEFAULT_RECENT_FONTS
  })

  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setActiveSubView('main')
        setSearchQuery('')
        setFontSearchQuery('')
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      if (activeSubView === 'main') {
        setTimeout(() => {
          searchInputRef.current?.focus()
        }, 50)
      }
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, activeSubView])

  const selectFont = (font: FontOption): void => {
    onChangeFontFamily(font.family)
    setRecentFonts((prev) => {
      const filtered = prev.filter((f) => f.id !== font.id)
      const updated = [font, ...filtered].slice(0, 3)
      try {
        localStorage.setItem('oink_recent_fonts', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }

  const handleCopyPageContent = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(fileContent)
      setCopiedContent(true)
      setTimeout(() => setCopiedContent(false), 1500)
    } catch (err) {
      console.error('Failed to copy content:', err)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className={`action-pill-btn more-options-btn ${isOpen ? 'active' : ''}`}
        onClick={(e): void => {
          e.stopPropagation()
          setIsOpen((prev) => !prev)
          setActiveSubView('main')
        }}
        title="More Actions (Page Options)"
      >
        <MoreHorizontal size={14} className={isOpen ? 'text-zinc-200' : 'text-zinc-300'} />
      </button>

      {isOpen && (
        <div className="page-actions-dropdown-menu" onClick={(e): void => e.stopPropagation()}>
          {activeSubView === 'fonts' && (
            <PageActionFontsView
              editorFontFamily={editorFontFamily}
              fontSearchQuery={fontSearchQuery}
              onFontSearchChange={setFontSearchQuery}
              onSelectFont={selectFont}
              onBack={(): void => setActiveSubView('main')}
            />
          )}

          {activeSubView === 'customize' && (
            <PageActionCustomizeView
              activeFilePath={activeFilePath}
              showCover={showCover}
              showIcon={showIcon}
              showFileName={showFileName}
              isOnlyThisFile={isOnlyThisFile}
              statsConfig={statsConfig}
              onToggleCover={onToggleCover}
              onToggleIcon={onToggleIcon}
              onToggleFileName={onToggleFileName}
              onToggleOnlyThisFile={onToggleOnlyThisFile}
              onToggleStat={onToggleStat}
              onBack={(): void => setActiveSubView('main')}
            />
          )}

          {activeSubView === 'textCustomization' && (
            <PageActionTypographyView
              editorFontSize={editorFontSize}
              onChangeFontSize={onChangeFontSize}
              editorLineHeight={editorLineHeight}
              onChangeLineHeight={onChangeLineHeight}
              editorLetterSpacing={editorLetterSpacing}
              onChangeLetterSpacing={onChangeLetterSpacing}
              editorParagraphSpacing={editorParagraphSpacing}
              onChangeParagraphSpacing={onChangeParagraphSpacing}
              editorFontWeight={editorFontWeight}
              onChangeFontWeight={onChangeFontWeight}
              editorTextAlign={editorTextAlign}
              onChangeTextAlign={onChangeTextAlign}
              onBack={(): void => setActiveSubView('main')}
            />
          )}

          {activeSubView === 'export' && (
            <PageActionExportView
              onExportMarkdown={onExportMarkdown}
              onExportHTML={onExportHTML}
              onExportText={onExportText}
              onCopyLink={onCopyLink}
              onClose={(): void => setIsOpen(false)}
              onBack={(): void => setActiveSubView('main')}
            />
          )}

          {activeSubView === 'main' && (
            <PageActionMainView
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchInputRef={searchInputRef}
              recentFonts={recentFonts}
              editorFontFamily={editorFontFamily}
              onSelectFont={selectFont}
              onNavigateSubView={setActiveSubView}
              copiedContent={copiedContent}
              onCopyPageContent={handleCopyPageContent}
              onDuplicateFile={onDuplicateFile}
              onDeleteFile={onDeleteFile}
              isFullScreen={isFullScreen}
              onToggleFullScreen={onToggleFullScreen}
              isPageLocked={isPageLocked}
              onToggleLockPage={onToggleLockPage}
              onOpenAI={onOpenAI}
              onImport={onImport}
              onUndo={onUndo}
              onClose={(): void => setIsOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default React.memo(PageActionsMenu)
