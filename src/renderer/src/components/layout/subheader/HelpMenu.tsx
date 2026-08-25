import React, { useState, useRef, useEffect } from 'react'
import {
  HelpCircle,
  ChevronDown,
  Keyboard,
  FileCode,
  ExternalLink,
  BookOpen,
  Bug,
  Sparkles,
  X
} from 'lucide-react'
import { APP_VERSION } from '../../../utils/version'

interface HelpMenuProps {
  onOpenSettings?: () => void
}

function HelpMenuComponent({ onOpenSettings }: HelpMenuProps): React.JSX.Element {
  const [showHelpMenu, setShowHelpMenu] = useState(false)
  const [activeModal, setActiveModal] = useState<'shortcuts' | 'markdown' | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowHelpMenu(false)
      }
    }
    if (showHelpMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showHelpMenu])

  const openExternal = (url: string): void => {
    window.open(url, '_blank')
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className={`action-pill-btn ${showHelpMenu ? 'active' : ''}`}
          onClick={(e): void => {
            e.stopPropagation()
            setShowHelpMenu((prev) => !prev)
          }}
          title="Help & Documentation"
        >
          <HelpCircle size={13} className={showHelpMenu ? 'text-zinc-200' : 'text-zinc-400'} />
          <span>Help</span>
          <ChevronDown
            size={11}
            className={`transition-transform duration-150 ${showHelpMenu ? 'rotate-180' : ''}`}
          />
        </button>

        {/* HELP DROPDOWN MENU */}
        {showHelpMenu && (
          <div className="widgets-dropdown-menu view-dropdown-menu help-dropdown-menu">
            <div className="widgets-dropdown-header">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <BookOpen size={12} className="text-zinc-400" />
                Help & Resources
              </span>
              <span className="text-[10px] text-zinc-400 font-mono bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/50">
                v{APP_VERSION}
              </span>
            </div>

            <div className="widgets-dropdown-list">
              {/* Keyboard Shortcuts */}
              <div
                className="widget-menu-item"
                onClick={(): void => {
                  setActiveModal('shortcuts')
                  setShowHelpMenu(false)
                }}
              >
                <div className="flex items-center gap-2">
                  <Keyboard size={14} className="text-zinc-300 shrink-0" />
                  <div className="flex flex-col">
                    <span className="widget-title">Keyboard Shortcuts</span>
                    <span className="widget-desc">View all hotkeys & quick navigation</span>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800/50 px-1 py-0.5 rounded border border-zinc-700/40">
                  Ctrl+/
                </span>
              </div>

              {/* Markdown Syntax Guide */}
              <div
                className="widget-menu-item"
                onClick={(): void => {
                  setActiveModal('markdown')
                  setShowHelpMenu(false)
                }}
              >
                <div className="flex items-center gap-2">
                  <FileCode size={14} className="text-zinc-300 shrink-0" />
                  <div className="flex flex-col">
                    <span className="widget-title">Markdown Guide</span>
                    <span className="widget-desc">Formatting, code blocks & callouts</span>
                  </div>
                </div>
              </div>

              {/* What's New */}
              <div
                className="widget-menu-item"
                onClick={(): void => {
                  onOpenSettings?.()
                  setShowHelpMenu(false)
                }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-zinc-300 shrink-0" />
                  <div className="flex flex-col">
                    <span className="widget-title">What&apos;s New in v{APP_VERSION}</span>
                    <span className="widget-desc">Release notes & recent improvements</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5 my-1" />

              {/* GitHub Repository */}
              <div
                className="widget-menu-item"
                onClick={(): void => {
                  openExternal('https://github.com/Dwaipayan-Ghoshal/Oink')
                  setShowHelpMenu(false)
                }}
              >
                <div className="flex items-center gap-2">
                  <ExternalLink size={14} className="text-zinc-300 shrink-0" />
                  <div className="flex flex-col">
                    <span className="widget-title">GitHub Repository</span>
                    <span className="widget-desc">Source code & documentation</span>
                  </div>
                </div>
              </div>

              {/* Report Issue */}
              <div
                className="widget-menu-item"
                onClick={(): void => {
                  openExternal('https://github.com/Dwaipayan-Ghoshal/Oink/issues')
                  setShowHelpMenu(false)
                }}
              >
                <div className="flex items-center gap-2">
                  <Bug size={14} className="text-zinc-300 shrink-0" />
                  <div className="flex flex-col">
                    <span className="widget-title">Report an Issue</span>
                    <span className="widget-desc">Send feedback or bug reports</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 mt-1 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 px-1">
              <span>Oink Knowledge Engine</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Latest Build
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SHORTCUTS MODAL */}
      {activeModal === 'shortcuts' && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={(): void => setActiveModal(null)}
        >
          <div
            className="bg-[#18181e] border border-zinc-700/60 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4"
            onClick={(e): void => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Keyboard size={16} className="text-zinc-300" />
                <h3 className="font-semibold text-zinc-100 text-sm">Keyboard Shortcuts</h3>
              </div>
              <button
                type="button"
                className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
                onClick={(): void => setActiveModal(null)}
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between">
                <span className="text-zinc-400">Quick Switcher / Search</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono rounded text-[10px]">
                  Ctrl+P
                </kbd>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between">
                <span className="text-zinc-400">Toggle Sidebar</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono rounded text-[10px]">
                  Ctrl+B
                </kbd>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between">
                <span className="text-zinc-400">Save Document</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono rounded text-[10px]">
                  Ctrl+S
                </kbd>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between">
                <span className="text-zinc-400">Find in Document</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono rounded text-[10px]">
                  Ctrl+F
                </kbd>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between">
                <span className="text-zinc-400">Toggle Fullscreen</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono rounded text-[10px]">
                  F11
                </kbd>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between">
                <span className="text-zinc-400">Slash Menu Commands</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono rounded text-[10px]">
                  /
                </kbd>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                className="px-3 py-1.5 bg-zinc-200 text-zinc-900 hover:bg-white font-medium text-xs rounded-lg transition-colors"
                onClick={(): void => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MARKDOWN GUIDE MODAL */}
      {activeModal === 'markdown' && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={(): void => setActiveModal(null)}
        >
          <div
            className="bg-[#18181e] border border-zinc-700/60 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4"
            onClick={(e): void => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode size={16} className="text-zinc-300" />
                <h3 className="font-semibold text-zinc-100 text-sm">Markdown Syntax Guide</h3>
              </div>
              <button
                type="button"
                className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
                onClick={(): void => setActiveModal(null)}
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono text-zinc-300">
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg flex justify-between">
                <span className="text-zinc-400"># Heading 1</span>
                <span className="text-zinc-500 font-sans">Title size</span>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg flex justify-between">
                <span className="text-zinc-400">**bold text**</span>
                <span className="text-zinc-500 font-sans">Bold text</span>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg flex justify-between">
                <span className="text-zinc-400">*italic text*</span>
                <span className="text-zinc-500 font-sans">Italics</span>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg flex justify-between">
                <span className="text-zinc-400">- [ ] Checklist task</span>
                <span className="text-zinc-500 font-sans">Interactive checkbox</span>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg flex justify-between">
                <span className="text-zinc-400">&gt; [!NOTE] callout</span>
                <span className="text-zinc-500 font-sans">Alert callout box</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                className="px-3 py-1.5 bg-zinc-200 text-zinc-900 hover:bg-white font-medium text-xs rounded-lg transition-colors"
                onClick={(): void => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default React.memo(HelpMenuComponent)
