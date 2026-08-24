// @ts-ignore: ImageTool does not provide official TypeScript typings
import ImageTool from '@editorjs/image'

// Custom Image Tool with modern Lucide icon
export class CustomImageTool extends ImageTool {
  static get toolbox(): { icon: string; title: string } {
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/><path d="m14 14 3-3 4 4"/></svg>',
      title: 'Image'
    }
  }
}
