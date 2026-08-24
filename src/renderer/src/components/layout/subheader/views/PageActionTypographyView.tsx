import React from 'react'
import { ChevronLeft, Minus, Plus, AlignLeft, AlignCenter, AlignJustify } from 'lucide-react'

interface PageActionTypographyViewProps {
  editorFontSize: number
  onChangeFontSize: (size: number) => void
  editorLineHeight?: string
  onChangeLineHeight?: (height: string) => void
  editorLetterSpacing?: string
  onChangeLetterSpacing?: (spacing: string) => void
  editorParagraphSpacing?: string
  onChangeParagraphSpacing?: (spacing: string) => void
  editorFontWeight?: string
  onChangeFontWeight?: (weight: string) => void
  editorTextAlign?: string
  onChangeTextAlign?: (align: string) => void
  onBack: () => void
}

function PageActionTypographyViewComponent({
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
  onBack
}: PageActionTypographyViewProps): React.JSX.Element {
  return (
    <div className="text-customization-view flex flex-col gap-2.5">
      <div className="font-chooser-header">
        <button
          type="button"
          className="font-chooser-back-btn"
          onClick={onBack}
          title="Back to options"
        >
          <ChevronLeft size={14} />
          <span>Text Customisation</span>
        </button>
      </div>

      {/* 1. Font Size Control */}
      <div className="custom-control-group">
        <div className="flex items-center justify-between text-xs text-zinc-300 font-medium mb-1.5">
          <span>Font Size</span>
          <span className="text-zinc-400 font-mono text-xs">{editorFontSize}px</span>
        </div>
        <div className="flex items-center gap-1.5 mb-2">
          <button
            type="button"
            className="custom-stepper-btn"
            onClick={(): void => onChangeFontSize(Math.max(10, editorFontSize - 1))}
            title="Decrease font size"
          >
            <Minus size={12} />
          </button>
          <div className="flex-1 grid grid-cols-4 gap-1">
            {[13, 15, 17, 19].map((sz) => (
              <button
                key={sz}
                type="button"
                className={`custom-pill-btn ${editorFontSize === sz ? 'active' : ''}`}
                onClick={(): void => onChangeFontSize(sz)}
              >
                {sz}px
              </button>
            ))}
          </div>
          <button
            type="button"
            className="custom-stepper-btn"
            onClick={(): void => onChangeFontSize(Math.min(36, editorFontSize + 1))}
            title="Increase font size"
          >
            <Plus size={12} />
          </button>
        </div>
        {/* Slider + Numeric input */}
        <div className="custom-slider-num-row">
          <input
            type="range"
            min="10"
            max="36"
            step="1"
            value={editorFontSize}
            onChange={(e): void => onChangeFontSize(parseInt(e.target.value, 10))}
            className="custom-range-slider flex-1"
          />
          <div className="custom-num-input-wrap">
            <input
              type="number"
              min="10"
              max="36"
              step="1"
              value={editorFontSize}
              onChange={(e): void => {
                const val = parseInt(e.target.value, 10)
                if (!isNaN(val) && val >= 10 && val <= 48) {
                  onChangeFontSize(val)
                }
              }}
              className="custom-num-input"
            />
            <span className="custom-num-unit">px</span>
          </div>
        </div>
      </div>

      {/* 2. Line Spacing (Line Height) */}
      {onChangeLineHeight && (
        <div className="custom-control-group">
          <div className="flex items-center justify-between text-xs text-zinc-300 font-medium mb-1.5">
            <span>Line Spacing</span>
            <span className="text-zinc-400 text-[11px]">
              {editorLineHeight === '1.4'
                ? 'Compact'
                : editorLineHeight === '2.0'
                  ? 'Relaxed'
                  : editorLineHeight === '1.7'
                    ? 'Normal'
                    : editorLineHeight}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 mb-2">
            {[
              { val: '1.4', label: 'Compact' },
              { val: '1.7', label: 'Normal' },
              { val: '2.0', label: 'Relaxed' }
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                className={`custom-pill-btn ${editorLineHeight === item.val ? 'active' : ''}`}
                onClick={(): void => onChangeLineHeight(item.val)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {/* Slider + Numeric input */}
          <div className="custom-slider-num-row">
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.05"
              value={parseFloat(editorLineHeight) || 1.7}
              onChange={(e): void => onChangeLineHeight(e.target.value)}
              className="custom-range-slider flex-1"
            />
            <div className="custom-num-input-wrap">
              <input
                type="number"
                min="1.0"
                max="3.0"
                step="0.05"
                value={parseFloat(editorLineHeight) || 1.7}
                onChange={(e): void => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && val >= 0.8 && val <= 4.0) {
                    onChangeLineHeight(e.target.value)
                  }
                }}
                className="custom-num-input"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Letter Spacing */}
      {onChangeLetterSpacing && (
        <div className="custom-control-group">
          <div className="flex items-center justify-between text-xs text-zinc-300 font-medium mb-1.5">
            <span>Letter Spacing</span>
            <span className="text-zinc-400 text-[11px]">
              {editorLetterSpacing === '-0.02em'
                ? 'Tight'
                : editorLetterSpacing === '0.04em'
                  ? 'Wide'
                  : editorLetterSpacing === 'normal' || editorLetterSpacing === '0em'
                    ? 'Normal'
                    : editorLetterSpacing}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 mb-2">
            {[
              { val: '-0.02em', label: 'Tight' },
              { val: 'normal', label: 'Normal' },
              { val: '0.04em', label: 'Wide' }
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                className={`custom-pill-btn ${editorLetterSpacing === item.val ? 'active' : ''}`}
                onClick={(): void => onChangeLetterSpacing(item.val)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {/* Slider + Numeric input */}
          {(() => {
            const parsedLetter =
              editorLetterSpacing === 'normal' ? 0 : parseFloat(editorLetterSpacing) || 0
            return (
              <div className="custom-slider-num-row">
                <input
                  type="range"
                  min="-0.06"
                  max="0.20"
                  step="0.005"
                  value={parsedLetter}
                  onChange={(e): void => onChangeLetterSpacing(`${e.target.value}em`)}
                  className="custom-range-slider flex-1"
                />
                <div className="custom-num-input-wrap">
                  <input
                    type="number"
                    min="-0.06"
                    max="0.20"
                    step="0.005"
                    value={parsedLetter}
                    onChange={(e): void => {
                      const val = parseFloat(e.target.value)
                      if (!isNaN(val)) {
                        onChangeLetterSpacing(`${val}em`)
                      }
                    }}
                    className="custom-num-input"
                  />
                  <span className="custom-num-unit">em</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* 4. Paragraph Spacing */}
      {onChangeParagraphSpacing && (
        <div className="custom-control-group">
          <div className="flex items-center justify-between text-xs text-zinc-300 font-medium mb-1.5">
            <span>Paragraph Spacing</span>
            <span className="text-zinc-400 text-[11px]">
              {editorParagraphSpacing === '0.8em'
                ? 'Compact'
                : editorParagraphSpacing === '1.8em'
                  ? 'Spacious'
                  : editorParagraphSpacing === '1.2em'
                    ? 'Default'
                    : editorParagraphSpacing}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 mb-2">
            {[
              { val: '0.8em', label: 'Compact' },
              { val: '1.2em', label: 'Normal' },
              { val: '1.8em', label: 'Spacious' }
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                className={`custom-pill-btn ${editorParagraphSpacing === item.val ? 'active' : ''}`}
                onClick={(): void => onChangeParagraphSpacing(item.val)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {/* Slider + Numeric input */}
          {(() => {
            const parsedPara = parseFloat(editorParagraphSpacing) || 1.2
            return (
              <div className="custom-slider-num-row">
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={parsedPara}
                  onChange={(e): void => onChangeParagraphSpacing(`${e.target.value}em`)}
                  className="custom-range-slider flex-1"
                />
                <div className="custom-num-input-wrap">
                  <input
                    type="number"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={parsedPara}
                    onChange={(e): void => {
                      const val = parseFloat(e.target.value)
                      if (!isNaN(val)) {
                        onChangeParagraphSpacing(`${val}em`)
                      }
                    }}
                    className="custom-num-input"
                  />
                  <span className="custom-num-unit">em</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* 5. Font Weight */}
      {onChangeFontWeight && (
        <div className="custom-control-group">
          <div className="flex items-center justify-between text-xs text-zinc-300 font-medium mb-1.5">
            <span>Font Weight</span>
            <span className="text-zinc-400 text-[11px]">
              {editorFontWeight === '300'
                ? 'Light'
                : editorFontWeight === '500'
                  ? 'Medium'
                  : editorFontWeight === '600'
                    ? 'Semi-Bold'
                    : editorFontWeight === '700'
                      ? 'Bold'
                      : 'Regular'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1 mb-2">
            {[
              { val: '300', label: 'Light' },
              { val: '400', label: 'Regular' },
              { val: '500', label: 'Medium' },
              { val: '600', label: 'Bold' }
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                className={`custom-pill-btn ${editorFontWeight === item.val ? 'active' : ''}`}
                onClick={(): void => onChangeFontWeight(item.val)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {/* Slider + Numeric input */}
          <div className="custom-slider-num-row">
            <input
              type="range"
              min="200"
              max="900"
              step="100"
              value={parseInt(editorFontWeight, 10) || 400}
              onChange={(e): void => onChangeFontWeight(e.target.value)}
              className="custom-range-slider flex-1"
            />
            <div className="custom-num-input-wrap">
              <input
                type="number"
                min="200"
                max="900"
                step="100"
                value={parseInt(editorFontWeight, 10) || 400}
                onChange={(e): void => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val) && val >= 100 && val <= 900) {
                    onChangeFontWeight(val.toString())
                  }
                }}
                className="custom-num-input"
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. Text Alignment */}
      {onChangeTextAlign && (
        <div className="custom-control-group">
          <div className="flex items-center justify-between text-xs text-zinc-300 font-medium mb-1.5">
            <span>Alignment</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[
              { val: 'left', icon: <AlignLeft size={13} />, label: 'Left' },
              { val: 'center', icon: <AlignCenter size={13} />, label: 'Center' },
              { val: 'justify', icon: <AlignJustify size={13} />, label: 'Justify' }
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                className={`custom-pill-btn flex items-center justify-center gap-1.5 ${
                  editorTextAlign === item.val ? 'active' : ''
                }`}
                onClick={(): void => onChangeTextAlign(item.val)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(PageActionTypographyViewComponent)
