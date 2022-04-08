
export interface Extension {
  name: string
  label: string
  handleClick(e: Event)
}

export interface IExtensionsManager {
  addExtension(extension: any): void
  render()
}

