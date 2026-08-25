import React, { useState } from 'react'
import { ChevronLeft, FileCode, Code2, FileText, Link, Upload, Check } from 'lucide-react'

interface PageActionExportViewProps {
  onExportMarkdown?: () => void
  onExportHTML?: () => void
  onExportText?: () => void
  onCopyLink?: () => void
  onClose: () => void
  onBack: () => void
}

function PageActionExportViewComponent({
  onExportMarkdown,
  onExportHTML,
  onExportText,
  onCopyLink,
  onClose,
  onBack
}: PageActionExportViewProps): React.JSX.Element {
  const [copiedLink, setCopiedLink] = useState<boolean>(false)

  return (
    <div className="export-view flex flex-col gap-2">
      <div className="font-chooser-header">
        <button
          type="button"
          className="font-chooser-back-btn"
          onClick={onBack}
          title="Back to options"
        >
          <ChevronLeft size={14} />
          <span>Export</span>
        </button>
      </div>

      <div className="options-card-section">
        <div className="p-1 flex flex-col gap-1">
          {onExportMarkdown && (
            <div
              className="page-action-row"
              onClick={(): void => {
                onExportMarkdown()
                onClose()
              }}
            >
              <div className="page-action-left">
                <FileCode size={14} className="text-zinc-300 shrink-0" />
                <div className="flex flex-col">
                  <span className="page-action-title">Markdown</span>
                  <span className="text-[10px] text-zinc-500">Export as .md file</span>
                </div>
              </div>
              <Upload size={13} className="text-zinc-500 shrink-0" />
            </div>
          )}

          {onExportHTML && (
            <div
              className="page-action-row"
              onClick={(): void => {
                onExportHTML()
                onClose()
              }}
            >
              <div className="page-action-left">
                <Code2 size={14} className="text-amber-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="page-action-title">HTML Webpage</span>
                  <span className="text-[10px] text-zinc-500">Standalone styled .html</span>
                </div>
              </div>
              <Upload size={13} className="text-zinc-500 shrink-0" />
            </div>
          )}

          {onExportText && (
            <div
              className="page-action-row"
              onClick={(): void => {
                onExportText()
                onClose()
              }}
            >
              <div className="page-action-left">
                <FileText size={14} className="text-emerald-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="page-action-title">Plain Text</span>
                  <span className="text-[10px] text-zinc-500">Unformatted .txt file</span>
                </div>
              </div>
              <Upload size={13} className="text-zinc-500 shrink-0" />
            </div>
          )}

          {onCopyLink && (
            <div
              className="page-action-row"
              onClick={(): void => {
                onCopyLink()
                setCopiedLink(true)
                setTimeout(() => {
                  setCopiedLink(false)
                  onClose()
                }, 1200)
              }}
            >
              <div className="page-action-left">
                <Link size={14} className="text-purple-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="page-action-title">
                    {copiedLink ? 'Copied [[Link]]!' : 'Copy Reference Link'}
                  </span>
                  <span className="text-[10px] text-zinc-500">Internal [[Wikilink]]</span>
                </div>
              </div>
              {copiedLink && <Check size={13} className="text-emerald-400 shrink-0" />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default React.memo(PageActionExportViewComponent)
