import * as utils from './utils'

// Button of the selection's toolbar
export interface SelectionToolbarButton {
  name: string
  label: string
  onClick(e: Event): void
}

// Toolbar of selection
export interface SelectionToolbar {
  addButton(button: SelectionToolbarButton): SelectionToolbar
  addButtons(buttons: SelectionToolbarButton[]): SelectionToolbar
}

// 自定义编辑器接口，用于替代 medium-editor
// 需为 medium-editor 编写一个与此接口的适配器
export interface Editor {
  window: Window
  document: Document
  /**
   * @deprecated 仅用于当前兼容 medium-editor 的 toolbar，未来会删除
   */
  base: any
  getEditorElements(): any
  selectElement(el: HTMLElement): void
  getSelectedParentElement(): HTMLElement
  setDefaultSelectionToolbar(toolbar: SelectionToolbar): Editor
  getDefaultSelectionToolbar(): SelectionToolbar
  registerSelectionToolbar(toolbar: SelectionToolbar): Editor
  on(dom: HTMLElement | Document, event: string, callback: (e: Event) => {}): Editor
}

export interface ToolbarOptions {
  editor?: Editor,
  type: string,
  activeClassName: string,
  buttons: {
    name: string
    action: string
    label: string
  }[]
}

export interface Extension {
  name: string
  label: string
  elementClassName: string
  handleClick(e: Event)
  toolbar(): ToolbarOptions | null
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
  destroy()
  render()
}

// Medium-editor 适配器
export class MediumEditorAdaptor implements Editor {
  _plugin: any
  _editor: any
  // 此默认工具栏暂时没用，只是用于抽象编辑器设计，目前只有扩展的工具栏有用
  defaultSelectionToolbar: SelectionToolbar
  window: Window
  document: Document
  /**
   * @deprecated 仅用于当前兼容 medium-editor 的 toolbar，未来会删除
   */
  base: any

  constructor(plugin: any) {
    this._plugin = plugin
    this._editor = plugin.base
    this.window = plugin.window
    this.document = plugin.document
    this.base = plugin.base
  }

  getEditorElements(): HTMLElement {
    return this._plugin.getEditorElements()
  }

  selectElement(el: HTMLElement): void {
    this._editor.selectElement(el)
  }

  getSelectedParentElement(): HTMLElement {
    return this._editor.getSelectedParentElement()
  }

  on(dom: HTMLElement | Document, event: string, callback: (e: Event) => {}): Editor {
    this._plugin.on(dom, event, callback)
    return this
  }

  setDefaultSelectionToolbar(toolbar: SelectionToolbar): Editor {
    this.defaultSelectionToolbar = toolbar
    return this
  }

  getDefaultSelectionToolbar(): SelectionToolbar {
    return this.defaultSelectionToolbar
  }

  registerSelectionToolbar(toolbar: SelectionToolbar): Editor {
    this._editor.extensions.push(toolbar)
    return this
  }
}
