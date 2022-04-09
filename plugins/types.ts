
export interface Extension {
  name: string
  label: string
  elementClassName: string
  handleClick(e: Event)
}

export interface ExtensionsHtmlRenderOptions {
  editorId: string
}

export interface IExtensionsHtmlRender {
  add(extension: Extension): IExtensionsHtmlRender
  reset(): IExtensionsHtmlRender
  mount(elem: HTMLElement): IExtensionsHtmlRender
  render(): HTMLElement
}

export interface IExtensionsManager {
  addExtension(extension: any): void
  render()
}

