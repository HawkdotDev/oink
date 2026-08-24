import { useState, useCallback } from 'react'

export interface UseEditorTypographyReturn {
  editorFontFamily: string
  editorFontSize: number
  editorLineHeight: string
  editorLetterSpacing: string
  editorParagraphSpacing: string
  editorFontWeight: string
  editorTextAlign: string
  handleFontFamilyChange: (font: string) => void
  handleFontSizeChange: (size: number) => void
  handleLineHeightChange: (val: string) => void
  handleLetterSpacingChange: (val: string) => void
  handleParagraphSpacingChange: (val: string) => void
  handleFontWeightChange: (val: string) => void
  handleTextAlignChange: (val: string) => void
}

export function useEditorTypography(): UseEditorTypographyReturn {
  const [editorFontFamily, setEditorFontFamily] = useState<string>(
    () => localStorage.getItem('oink_editor_font_family') || "'Inter', sans-serif"
  )

  const [editorFontSize, setEditorFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('oink_editor_font_size')
    return saved ? parseInt(saved, 10) : 15
  })

  const [editorLineHeight, setEditorLineHeight] = useState<string>(
    () => localStorage.getItem('oink_editor_line_height') || '1.7'
  )

  const [editorLetterSpacing, setEditorLetterSpacing] = useState<string>(
    () => localStorage.getItem('oink_editor_letter_spacing') || 'normal'
  )

  const [editorParagraphSpacing, setEditorParagraphSpacing] = useState<string>(
    () => localStorage.getItem('oink_editor_paragraph_spacing') || '1.2em'
  )

  const [editorFontWeight, setEditorFontWeight] = useState<string>(
    () => localStorage.getItem('oink_editor_font_weight') || '400'
  )

  const [editorTextAlign, setEditorTextAlign] = useState<string>(
    () => localStorage.getItem('oink_editor_text_align') || 'left'
  )

  const handleFontFamilyChange = useCallback((font: string) => {
    setEditorFontFamily(font)
    try {
      localStorage.setItem('oink_editor_font_family', font)
    } catch {
      // ignore
    }
  }, [])

  const handleFontSizeChange = useCallback((size: number) => {
    setEditorFontSize(size)
    try {
      localStorage.setItem('oink_editor_font_size', size.toString())
    } catch {
      // ignore
    }
  }, [])

  const handleLineHeightChange = useCallback((val: string) => {
    setEditorLineHeight(val)
    try {
      localStorage.setItem('oink_editor_line_height', val)
    } catch {
      // ignore
    }
  }, [])

  const handleLetterSpacingChange = useCallback((val: string) => {
    setEditorLetterSpacing(val)
    try {
      localStorage.setItem('oink_editor_letter_spacing', val)
    } catch {
      // ignore
    }
  }, [])

  const handleParagraphSpacingChange = useCallback((val: string) => {
    setEditorParagraphSpacing(val)
    try {
      localStorage.setItem('oink_editor_paragraph_spacing', val)
    } catch {
      // ignore
    }
  }, [])

  const handleFontWeightChange = useCallback((val: string) => {
    setEditorFontWeight(val)
    try {
      localStorage.setItem('oink_editor_font_weight', val)
    } catch {
      // ignore
    }
  }, [])

  const handleTextAlignChange = useCallback((val: string) => {
    setEditorTextAlign(val)
    try {
      localStorage.setItem('oink_editor_text_align', val)
    } catch {
      // ignore
    }
  }, [])

  return {
    editorFontFamily,
    editorFontSize,
    editorLineHeight,
    editorLetterSpacing,
    editorParagraphSpacing,
    editorFontWeight,
    editorTextAlign,
    handleFontFamilyChange,
    handleFontSizeChange,
    handleLineHeightChange,
    handleLetterSpacingChange,
    handleParagraphSpacingChange,
    handleFontWeightChange,
    handleTextAlignChange
  }
}
