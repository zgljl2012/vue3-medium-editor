import { Editor, ToolbarOptions } from "./types"
import * as utils from './utils'
import { MediumEditorToolbarAdaptor } from "./toolbar"

// AbstractExtension is the abstract extension class that all extensions should inherit from
export abstract class AbstractExtension {
  abstract name: string
  abstract label: string
  abstract elementClassName: string
  abstract activeClassName: string

  protected editor: Editor

  constructor(editor: Editor) {
    this.editor = editor
  }

  /**
   * @Deprecated 因为 typescript 强制要求 super 在构造函数前面，但某些函数，如 initToolbar 需用到子类的属性
   * 调用时，子类尚未初始化，故无法调用子类的属性
   * 故提供 init 函数，交由子类调用，未来有更好的方法后，此模式会删除
   */
  protected init() {
    // bind events
    this.bindEvents()
    // init toolbar
    this.initToolbar()
  }

  private bindEvents() {
    this.editor.on(document, 'click', this.unselect.bind(this))
    this.editor.getEditorElements().forEach((editor: any) => {
      this.editor.on(editor, 'click', this.select.bind(this))
    })
  }

  private initToolbar() {
    const toolbar = this.toolbar()
    if (toolbar) {
      toolbar.editor = this.editor
      this.editor.registerSelectionToolbar(new MediumEditorToolbarAdaptor(toolbar))
    }
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

  // Return the toolbar of this extension
  public abstract toolbar(): ToolbarOptions | null
  // Handle click on the extension
  public abstract handleClick(e: Event)
  // Render the extension
  protected abstract render(options: any): HTMLElement
}
