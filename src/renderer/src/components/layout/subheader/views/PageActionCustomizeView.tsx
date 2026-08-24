import React from 'react'
import { ChevronLeft, Image as ImageIcon, FileCode, Smile, FileText, BarChart2 } from 'lucide-react'
import { StatusStatsConfig } from '../../../../types'

interface PageActionCustomizeViewProps {
  activeFilePath?: string | null
  showCover?: boolean
  showIcon?: boolean
  showFileName?: boolean
  isOnlyThisFile?: boolean
  statsConfig?: StatusStatsConfig
  onToggleCover?: () => void
  onToggleIcon?: () => void
  onToggleFileName?: () => void
  onToggleOnlyThisFile?: () => void
  onToggleStat?: (key: keyof StatusStatsConfig) => void
  onBack: () => void
}

function PageActionCustomizeViewComponent({
  activeFilePath,
  showCover = true,
  showIcon = true,
  showFileName = true,
  isOnlyThisFile = false,
  statsConfig,
  onToggleCover,
  onToggleIcon,
  onToggleFileName,
  onToggleOnlyThisFile,
  onToggleStat,
  onBack
}: PageActionCustomizeViewProps): React.JSX.Element {
  return (
    <div className="customize-page-view flex flex-col gap-2">
      <div className="font-chooser-header">
        <button
          type="button"
          className="font-chooser-back-btn"
          onClick={onBack}
          title="Back to options"
        >
          <ChevronLeft size={14} />
          <span>Customize page</span>
        </button>
      </div>

      {/* 1. Icon & Cover Section */}
      <div className="options-card-section">
        <div className="options-submenu-header px-2.5 py-1.5 flex items-center gap-2 border-b border-white/5">
          <ImageIcon size={13} strokeWidth={1.75} className="text-amber-400 shrink-0" />
          <span className="font-semibold text-xs text-zinc-200">Icon & Cover</span>
        </div>

        <div className="p-1 flex flex-col gap-1">
          {/* Only this file Toggle */}
          {activeFilePath && onToggleOnlyThisFile && (
            <>
              <div
                className="page-action-row"
                onClick={onToggleOnlyThisFile}
                title="When enabled, display overrides are saved to this file's frontmatter"
              >
                <div className="page-action-left">
                  <FileCode size={13} className="text-purple-400 shrink-0" />
                  <span className="page-action-title font-medium">Only this file</span>
                </div>
                <div className={`page-action-switch ${isOnlyThisFile ? 'active' : ''}`}>
                  <div className="switch-knob" />
                </div>
              </div>
              <div className="page-actions-divider" />
            </>
          )}

          {/* Cover Banner Toggle */}
          {onToggleCover && (
            <div className="page-action-row" onClick={onToggleCover}>
              <div className="page-action-left">
                <ImageIcon size={13} strokeWidth={1.75} className="text-zinc-400 shrink-0" />
                <span className="page-action-title">Cover Banner</span>
              </div>
              <div className={`page-action-switch ${showCover ? 'active' : ''}`}>
                <div className="switch-knob" />
              </div>
            </div>
          )}

          {/* Page Icon Toggle */}
          {onToggleIcon && (
            <div className="page-action-row" onClick={onToggleIcon}>
              <div className="page-action-left">
                <Smile size={13} className="text-zinc-400 shrink-0" />
                <span className="page-action-title">Page Icon</span>
              </div>
              <div className={`page-action-switch ${showIcon ? 'active' : ''}`}>
                <div className="switch-knob" />
              </div>
            </div>
          )}

          {/* File Name Toggle */}
          {onToggleFileName && (
            <div className="page-action-row" onClick={onToggleFileName}>
              <div className="page-action-left">
                <FileText size={13} className="text-zinc-400 shrink-0" />
                <span className="page-action-title">File Name</span>
              </div>
              <div className={`page-action-switch ${showFileName ? 'active' : ''}`}>
                <div className="switch-knob" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Metrics Section */}
      {statsConfig && onToggleStat && (
        <div className="options-card-section">
          <div className="options-submenu-header px-2.5 py-1.5 flex items-center gap-2 border-b border-white/5">
            <BarChart2 size={13} className="text-emerald-400 shrink-0" />
            <span className="font-semibold text-xs text-zinc-200">Metrics</span>
          </div>

          <div className="p-1 flex flex-col gap-1">
            <div className="page-action-row" onClick={(): void => onToggleStat('showWords')}>
              <div className="page-action-left">
                <span className="page-action-title">Word Count</span>
              </div>
              <div className={`page-action-switch ${statsConfig.showWords ? 'active' : ''}`}>
                <div className="switch-knob" />
              </div>
            </div>

            <div className="page-action-row" onClick={(): void => onToggleStat('showLines')}>
              <div className="page-action-left">
                <span className="page-action-title">Line Count</span>
              </div>
              <div className={`page-action-switch ${statsConfig.showLines ? 'active' : ''}`}>
                <div className="switch-knob" />
              </div>
            </div>

            <div className="page-action-row" onClick={(): void => onToggleStat('showSpaces')}>
              <div className="page-action-left">
                <span className="page-action-title">Number of Spaces</span>
              </div>
              <div className={`page-action-switch ${statsConfig.showSpaces ? 'active' : ''}`}>
                <div className="switch-knob" />
              </div>
            </div>

            <div className="page-action-row" onClick={(): void => onToggleStat('showChars')}>
              <div className="page-action-left">
                <span className="page-action-title">Character Count</span>
              </div>
              <div className={`page-action-switch ${statsConfig.showChars ? 'active' : ''}`}>
                <div className="switch-knob" />
              </div>
            </div>

            <div className="page-action-row" onClick={(): void => onToggleStat('showReadingTime')}>
              <div className="page-action-left">
                <span className="page-action-title">Reading Time</span>
              </div>
              <div className={`page-action-switch ${statsConfig.showReadingTime ? 'active' : ''}`}>
                <div className="switch-knob" />
              </div>
            </div>

            <div className="page-action-row" onClick={(): void => onToggleStat('showSavedBadge')}>
              <div className="page-action-left">
                <span className="page-action-title">Floating Saved Badge</span>
              </div>
              <div className={`page-action-switch ${statsConfig.showSavedBadge ? 'active' : ''}`}>
                <div className="switch-knob" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(PageActionCustomizeViewComponent)
