export interface ChecklistItemData {
  text: string
  checked: boolean
}

export interface ChecklistBlockData {
  items: ChecklistItemData[]
}

export class ChecklistTool {
  static get toolbox(): { icon: string; title: string } {
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>',
      title: 'To-do'
    }
  }

  static get isReadOnlySupported(): boolean {
    return true
  }

  static get enableLineBreaks(): boolean {
    return true
  }

  static get sanitize(): Record<string, unknown> {
    return {
      items: {
        text: {
          a: {
            class: 'wikilink',
            'data-path': true,
            href: true
          },
          b: true,
          strong: true,
          i: true,
          em: true,
          s: true,
          strike: true,
          del: true,
          u: true,
          code: true,
          mark: true
        },
        checked: false
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected api: any
  protected readOnly: boolean
  private data: ChecklistBlockData
  private wrapper: HTMLElement | null = null

  constructor({
    data,
    api,
    readOnly
  }: {
    data: ChecklistBlockData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api?: any
    readOnly?: boolean
  }) {
    this.api = api
    this.readOnly = readOnly || false
    const items =
      data && Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : [{ text: '', checked: false }]
    this.data = { items }
  }

  render(): HTMLElement {
    this.wrapper = document.createElement('div')
    this.wrapper.classList.add('cdx-checklist')

    this.data.items.forEach((item, index) => {
      const itemElement = this.createItem(item, index)
      this.wrapper?.appendChild(itemElement)
    })

    return this.wrapper
  }

  private createItem(item: ChecklistItemData, index: number): HTMLElement {
    const itemEl = document.createElement('div')
    itemEl.classList.add('cdx-checklist__item')
    if (item.checked) {
      itemEl.classList.add('cdx-checklist__item--checked')
    }

    const checkWrapper = document.createElement('div')
    checkWrapper.classList.add('cdx-checklist__item-checkbox')

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = !!item.checked
    checkbox.disabled = this.readOnly

    checkbox.addEventListener('change', () => {
      item.checked = checkbox.checked
      itemEl.classList.toggle('cdx-checklist__item--checked', checkbox.checked)
    })

    checkWrapper.appendChild(checkbox)

    const textEl = document.createElement('div')
    textEl.classList.add('cdx-checklist__item-text')
    textEl.contentEditable = this.readOnly ? 'false' : 'true'
    textEl.innerHTML = item.text || ''
    textEl.setAttribute('data-placeholder', 'To-do item...')

    textEl.addEventListener('input', () => {
      item.text = textEl.innerHTML
    })

    textEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const newItem: ChecklistItemData = { text: '', checked: false }
        const newItemEl = this.createItem(newItem, index + 1)
        if (itemEl.nextSibling) {
          this.wrapper?.insertBefore(newItemEl, itemEl.nextSibling)
        } else {
          this.wrapper?.appendChild(newItemEl)
        }
        const newTextInput = newItemEl.querySelector('.cdx-checklist__item-text') as HTMLElement
        newTextInput?.focus()
      } else if (e.key === 'Backspace' && textEl.innerHTML.trim() === '') {
        const allItems = this.wrapper?.querySelectorAll('.cdx-checklist__item')
        if (allItems && allItems.length > 1) {
          e.preventDefault()
          const prevItem = itemEl.previousElementSibling as HTMLElement
          const prevText = prevItem?.querySelector('.cdx-checklist__item-text') as HTMLElement
          itemEl.remove()
          if (prevText) {
            prevText.focus()
            const range = document.createRange()
            const sel = window.getSelection()
            range.selectNodeContents(prevText)
            range.collapse(false)
            sel?.removeAllRanges()
            sel?.addRange(range)
          }
        }
      }
    })

    itemEl.appendChild(checkWrapper)
    itemEl.appendChild(textEl)

    return itemEl
  }

  save(blockContent?: HTMLElement): ChecklistBlockData {
    const items: ChecklistItemData[] = []
    if (blockContent) {
      const itemElements = blockContent.querySelectorAll('.cdx-checklist__item')
      itemElements.forEach((el) => {
        const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement
        const text = el.querySelector('.cdx-checklist__item-text') as HTMLElement
        if (text) {
          items.push({
            text: text.innerHTML,
            checked: checkbox ? checkbox.checked : false
          })
        }
      })
    }
    return {
      items: items.length > 0 ? items : this.data.items
    }
  }
}
