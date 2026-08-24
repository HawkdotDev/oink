// Inline Strikethrough Tool
export class StrikethroughInlineTool {
  static get isInline(): boolean {
    return true
  }

  static get title(): string {
    return 'Strikethrough'
  }

  static get sanitize(): Record<string, unknown> {
    return {
      s: {},
      strike: {},
      del: {}
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private api: any
  private button: HTMLButtonElement | null = null
  private tag = 'S'
  private icon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" x2="20" y1="12" y2="12"/></svg>'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ api }: { api: any }) {
    this.api = api
  }

  render(): HTMLElement {
    this.button = document.createElement('button')
    this.button.type = 'button'
    this.button.innerHTML = this.icon
    this.button.classList.add(this.api.styles.inlineToolButton)
    this.button.title = 'Strikethrough'
    return this.button
  }

  surround(range: Range): void {
    if (!range) return
    const termWrapper = this.api.selection.findParentTag(this.tag)
    if (termWrapper) {
      this.unwrap(termWrapper)
    } else {
      this.wrap(range)
    }
  }

  wrap(range: Range): void {
    const selectedText = range.extractContents()
    const elem = document.createElement(this.tag)
    elem.appendChild(selectedText)
    range.insertNode(elem)
    this.api.selection.expandToTag(elem)
  }

  unwrap(termWrapper: HTMLElement): void {
    this.api.selection.expandToTag(termWrapper)
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    const unwrappedContent = range.extractContents()
    termWrapper.parentNode?.removeChild(termWrapper)
    range.insertNode(unwrappedContent)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  checkState(): boolean {
    const termWrapper = this.api.selection.findParentTag(this.tag)
    if (this.button) {
      this.button.classList.toggle(this.api.styles.inlineToolButtonActive, !!termWrapper)
    }
    return !!termWrapper
  }
}
