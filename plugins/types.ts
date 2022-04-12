import * as utils from './utils'

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
  destroy()
  render()
}

// 自定义编辑器接口，用于替代 medium-editor
// 需为 medium-editor 编写一个与此接口的适配器
export interface Editor {
  getEditorElements(): any
  selectElement(el: HTMLElement): void
  getSelectedParentElement(): HTMLElement
  on(dom: HTMLElement | Document, event: string, callback: (e: Event) => {})
}

// Medium-editor 适配器
export class MediumEditorAdaptor implements Editor {
  _plugin: any
  _editor: any

  constructor(plugin: any) {
    this._plugin = plugin
    this._editor = plugin.base
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

  on(dom: HTMLElement | Document, event: string, callback: (e: Event) => {}) {
    this._plugin.on(dom, event, callback)
  }
}

export abstract class AbstractExtension {
  abstract name: string
  abstract label: string
  abstract elementClassName: string
  abstract activeClassName: string

  protected editor: Editor

  constructor(editor: Editor) {
    this.editor = editor
    // bind events
    this.bindEvents()
  }

  private bindEvents() {
    this.editor.on(document, 'click', this.unselect.bind(this))
    this.editor.getEditorElements().forEach((editor: any) => {
      this.editor.on(editor, 'click', this.select.bind(this))
    })
  }

  protected getCurrentNode(): HTMLElement {
    let el = this.editor.getSelectedParentElement();
    // 需 el 的父元素是 div[class="medium-editor-element"]，el 本身为 <p>，即一级段落
    if (el) {
      while (!(<HTMLElement>el.parentNode).classList.contains('medium-editor-element')) {
        const current = el
        el = <HTMLElement>el.parentNode
        el.removeChild(current)
      }
      // 删除 el 中的 <br>
      const children = el.childNodes
      for (const i in children) {
        const child = children[i]
        if (child.nodeName === 'BR') {
          el.removeChild(child)
        }
      }
    }
    return el
  }

  private select (e: Event) {
    const el = <HTMLElement>e.target
    if (el.classList.contains(this.elementClassName) ||
      el.previousSibling === null &&
      (<HTMLElement>el.parentNode).classList.contains(this.elementClassName)) {
      el.classList.add(this.activeClassName)
      this.editor.selectElement(el)
    }
  }

  private unselect (e: Event) {
    // Unselect all selected nodes. If a node is clicked, unselect all except this one.
    const current: HTMLElement = <HTMLElement>e.target
    const el = current.classList.contains(this.activeClassName) ? current : null
    const nodes = utils.getElementsByClassName(
      this.editor.getEditorElements(),
      this.activeClassName
    )
    Array.prototype.forEach.call(nodes, node => {
      if (node !== el) {
        node.classList.remove(this.activeClassName)
      }
    })
  }

  public abstract handleClick(e: Event)
  protected abstract render(options: any): HTMLElement
}
