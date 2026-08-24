export interface EmbedBlockData {
  service?: string
  source?: string
  embed?: string
  caption?: string
}

export function parseEmbedUrl(url: string): { embedUrl: string; service: string } {
  const clean = url.trim()
  const ytMatch = clean.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  )
  if (ytMatch) {
    return { embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`, service: 'youtube' }
  }
  const vimeoMatch = clean.match(
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/
  )
  if (vimeoMatch) {
    return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}`, service: 'vimeo' }
  }
  const codepenMatch = clean.match(/codepen\.io\/([^/\s]+)\/pen\/([^/\s]+)/)
  if (codepenMatch) {
    return {
      embedUrl: `https://codepen.io/${codepenMatch[1]}/embed/${codepenMatch[2]}`,
      service: 'codepen'
    }
  }
  return { embedUrl: clean, service: 'generic' }
}

export class EmbedTool {
  static get toolbox(): { icon: string; title: string } {
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
      title: 'Embed'
    }
  }

  static get isReadOnlySupported(): boolean {
    return true
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected api: any
  private data: EmbedBlockData
  private wrapper: HTMLElement | null = null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ data, api }: { data: EmbedBlockData; api?: any }) {
    this.api = api
    this.data = data || {}
  }

  render(): HTMLElement {
    this.wrapper = document.createElement('div')
    this.wrapper.classList.add('oink-embed-block')

    if (this.data && (this.data.embed || this.data.source)) {
      const url = this.data.embed || this.data.source || ''
      this.renderEmbed(url, this.data.caption || '')
    } else {
      this.renderInput()
    }

    return this.wrapper
  }

  renderInput(): void {
    if (!this.wrapper) return
    this.wrapper.innerHTML = `
      <div class="oink-media-input-box">
        <div class="flex items-center gap-2 mb-2 text-xs text-zinc-300 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          <span>Embed Web Link (YouTube, Vimeo, CodePen, etc.)</span>
        </div>
        <div class="flex gap-2">
          <input type="text" class="oink-media-url-input" placeholder="Paste link to embed..." />
          <button type="button" class="oink-media-submit-btn">Embed</button>
        </div>
      </div>
    `
    const input = this.wrapper.querySelector('.oink-media-url-input') as HTMLInputElement
    const btn = this.wrapper.querySelector('.oink-media-submit-btn') as HTMLButtonElement

    const handleSubmit = (): void => {
      const raw = input?.value?.trim()
      if (raw) {
        const { embedUrl, service } = parseEmbedUrl(raw)
        this.data.source = raw
        this.data.embed = embedUrl
        this.data.service = service
        this.renderEmbed(embedUrl, '')
      }
    }

    btn?.addEventListener('click', handleSubmit)
    input?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit()
    })
  }

  renderEmbed(url: string, caption: string): void {
    if (!this.wrapper) return
    this.wrapper.innerHTML = `
      <div class="oink-embed-container group">
        <iframe src="${url}" class="oink-embed-iframe" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
        <input type="text" class="oink-media-caption-input" placeholder="Add a caption..." value="${caption || ''}" />
      </div>
    `
    const captionInput = this.wrapper.querySelector('.oink-media-caption-input') as HTMLInputElement
    captionInput?.addEventListener('input', () => {
      this.data.caption = captionInput.value
    })
  }

  save(blockContent?: HTMLElement): EmbedBlockData {
    if (blockContent) {
      const input = blockContent.querySelector('.oink-media-url-input') as HTMLInputElement
      const captionInput = blockContent.querySelector(
        '.oink-media-caption-input'
      ) as HTMLInputElement
      if (input && input.value) {
        const raw = input.value.trim()
        const { embedUrl, service } = parseEmbedUrl(raw)
        this.data.source = raw
        this.data.embed = embedUrl
        this.data.service = service
      }
      if (captionInput) {
        this.data.caption = captionInput.value.trim()
      }
    }
    return {
      service: this.data.service || 'generic',
      source: this.data.source || '',
      embed: this.data.embed || '',
      caption: this.data.caption || ''
    }
  }
}
