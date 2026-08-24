export interface VideoBlockData {
  url?: string
  caption?: string
}

export class VideoTool {
  static get toolbox(): { icon: string; title: string } {
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>',
      title: 'Video'
    }
  }

  static get isReadOnlySupported(): boolean {
    return true
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected api: any
  private data: VideoBlockData
  private wrapper: HTMLElement | null = null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ data, api }: { data: VideoBlockData; api?: any }) {
    this.api = api
    this.data = data || {}
  }

  render(): HTMLElement {
    this.wrapper = document.createElement('div')
    this.wrapper.classList.add('oink-video-block')

    if (this.data && this.data.url) {
      this.renderVideo(this.data.url, this.data.caption || '')
    } else {
      this.renderInput()
    }

    return this.wrapper
  }

  renderInput(): void {
    if (!this.wrapper) return
    this.wrapper.innerHTML = `
      <div class="oink-media-input-box">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2 text-xs text-zinc-300 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>
            <span>Embed or Upload Video</span>
          </div>
          <label class="oink-media-upload-label">
            <span>Upload file</span>
            <input type="file" accept="video/*" class="oink-media-file-input" style="display: none;" />
          </label>
        </div>
        <div class="flex gap-2">
          <input type="text" class="oink-media-url-input" placeholder="Paste video URL (.mp4, .webm, direct link)..." />
          <button type="button" class="oink-media-submit-btn">Embed</button>
        </div>
      </div>
    `
    const input = this.wrapper.querySelector('.oink-media-url-input') as HTMLInputElement
    const fileInput = this.wrapper.querySelector('.oink-media-file-input') as HTMLInputElement
    const btn = this.wrapper.querySelector('.oink-media-submit-btn') as HTMLButtonElement

    const handleSubmit = (): void => {
      const url = input?.value?.trim()
      if (url) {
        this.data.url = url
        this.renderVideo(url, '')
      }
    }

    btn?.addEventListener('click', handleSubmit)
    input?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit()
    })

    fileInput?.addEventListener('change', () => {
      const file = fileInput.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          if (result) {
            this.data.url = result
            this.renderVideo(result, file.name)
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  renderVideo(url: string, caption: string): void {
    if (!this.wrapper) return
    this.wrapper.innerHTML = `
      <div class="oink-video-container group">
        <video controls src="${url}" class="oink-video-player"></video>
        <input type="text" class="oink-media-caption-input" placeholder="Add a caption..." value="${caption || ''}" />
      </div>
    `
    const captionInput = this.wrapper.querySelector('.oink-media-caption-input') as HTMLInputElement
    captionInput?.addEventListener('input', () => {
      this.data.caption = captionInput.value
    })
  }

  save(blockContent?: HTMLElement): VideoBlockData {
    if (blockContent) {
      const input = blockContent.querySelector('.oink-media-url-input') as HTMLInputElement
      const captionInput = blockContent.querySelector(
        '.oink-media-caption-input'
      ) as HTMLInputElement
      if (input && input.value) {
        this.data.url = input.value.trim()
      }
      if (captionInput) {
        this.data.caption = captionInput.value.trim()
      }
    }
    return {
      url: this.data.url || '',
      caption: this.data.caption || ''
    }
  }
}
