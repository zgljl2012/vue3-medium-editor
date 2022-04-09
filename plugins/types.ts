
export interface Extension {
  name: string
  label: string
  elementClassName: string
  handleClick(e: Event)
}

export interface ExtensionsHtmlRenderOptions {
}

export interface IExtensionsHtmlRender {
  add(extension: Extension): IExtensionsHtmlRender
  render(): HTMLElement
}

export interface IExtensionsManager {
  addExtension(extension: any): void
  render()
}

