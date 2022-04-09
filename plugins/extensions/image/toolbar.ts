import { getToolbarButton } from "./tool-buttons"
import * as MediumEditor from "medium-editor-x"

const activeClassName = 'medium-editor-insert-image-active'

export class Toolbar extends MediumEditor.extensions.toolbar {
  name: string
  plugin: any
  window: any
  document: any
  base: any
  type: string = 'image'
  constructor (options: any) {
    super(options)

    this.name = `${options.type}Toolbar`

    options.buttons.forEach((buttonOptions: any) => {
      const ToolbarButton = getToolbarButton(MediumEditor)
      const button = new ToolbarButton(
        Object.assign(
          {},
          {
            window: this.plugin.window,
            document: this.plugin.document,
            base: this.plugin.base
          },
          buttonOptions
        )
      )

      button.init()
      this.plugin.base.extensions.push(button)
    })

    this.window = options.plugin.window
    this.document = options.plugin.document
    this.base = options.plugin.base

    this.init()
  }

  getElementsByClassName (parents: any, className: any) {
    const results: any = []

    Array.prototype.forEach.call(parents, editor => {
      const elements = editor.getElementsByClassName(className)

      Array.prototype.forEach.call(elements, element => {
        results.push(element)
      })
    })

    return results
  }

  createToolbar () {
    const toolbar = this.document.createElement('div')

    toolbar.id = `medium-editor-insert-${
      this.type
    }-toolbar-${this.getEditorId()}`
    toolbar.className = 'medium-editor-toolbar'

    if (this.static) {
      toolbar.className += ' static-toolbar'
    } else if (this.relativeContainer) {
      toolbar.className += ' medium-editor-relative-toolbar'
    } else {
      toolbar.className += ' medium-editor-stalker-toolbar'
    }

    toolbar.appendChild(this.createToolbarButtons())

    // Add any forms that extensions may have
    this.forEachExtension((extension: any) => {
      if (extension.hasForm) {
        toolbar.appendChild(extension.getForm())
      }
    }, this)

    this.attachEventHandlers()

    return toolbar
  }

  createToolbarButtons () {
    const ul = this.document.createElement('ul')
    let li, btn, extension, buttonName, buttonOpts

    ul.id = `medium-editor-insert-${
      this.type
    }-toolbar-actions${this.getEditorId()}`
    ul.className = 'medium-editor-toolbar-actions'
    ul.style.display = 'block'

    this.buttons.forEach((button: any) => {
      if (typeof button === 'string') {
        buttonName = button
        buttonOpts = null
      } else {
        buttonName = button.name
        buttonOpts = button
      }

      // If the button already exists as an extension, it'll be returned
      // othwerise it'll create the default built-in button
      extension = this.base.addBuiltInExtension(buttonName, buttonOpts)

      if (extension && typeof extension.getButton === 'function') {
        btn = extension.getButton(this.base)
        li = this.document.createElement('li')
        if (MediumEditor.util.isElement(btn)) {
          li.appendChild(btn)
        } else {
          li.innerHTML = btn
        }
        ul.appendChild(li)
      }
    }, this)

    const buttons = ul.querySelectorAll('button')
    if (buttons.length > 0) {
      buttons[0].classList.add(this.firstButtonClass)
      buttons[buttons.length - 1].classList.add(this.lastButtonClass)
    }

    return ul
  }

  checkState () {
    let activeElements

    if (this.base.preventSelectionUpdates) {
      return
    }

    // Wait for elements to be selected
    setTimeout(() => {
      activeElements = this.getElementsByClassName(
        this.getEditorElements(),
        activeClassName
      )

      // Hide toolbar when no elements are selected
      if (activeElements.length === 0) {
        return this.hideToolbar()
      }

      // Now we know there's a focused editable with a selection
      this.showAndUpdateToolbar()
    }, 10)
  }

  setToolbarPosition () {
    const container = this.getElementsByClassName(
      this.getEditorElements(),
      activeClassName
    )[0]

    // If there isn't a valid selection, bail
    if (!container) {
      return this
    }

    this.showToolbar()
    this.positionStaticToolbar(container)

    const anchorPreview = this.base.getExtensionByName('anchor-preview')

    if (anchorPreview && typeof anchorPreview.hidePreview === 'function') {
      anchorPreview.hidePreview()
    }
  }
}
