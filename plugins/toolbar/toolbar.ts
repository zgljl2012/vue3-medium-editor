import * as MediumEditor from "medium-editor-x"
import * as utils from '../utils'
import { Editor, SelectionToolbar, ToolbarOptions, ToolbarButton } from '../types'

const activeClassName = 'medium-editor-insert-image-active'

const captionClassName = 'medium-editor-insert-image-caption'

export const getToolbarButton = (MediumEditor: any) => {
  const ToolbarButton = MediumEditor.extensions.button.extend({
    init: function () {
      this.button = this.document.createElement('button')
      this.button.classList.add('medium-editor-action')
      this.button.innerHTML = `<b>${this.label}</b>`

      this.on(this.button, 'click', this.handleClick.bind(this))
    },

    getButton: function () {
      return this.button
    },

    handleClick: function () {
      const el = this.document.querySelector('.medium-editor-insert-image-active')
      if (this.name === 'align-center') {
        el.parentNode.style['text-align'] = 'center'
      }
      if (this.name === 'align-left') {
        el.parentNode.style['text-align'] = 'left'
      }
      if (this.name === 'align-right') {
        el.parentNode.style['text-align'] = 'right'
      }
      if (this.name === 'caption') {
        // 判断是否已存在 caption
        const caption = el.nextSibling
        if (!caption) {
          const caption = this.document.createElement('figcaption')
          const imageID = el.getAttribute('data-image-id')
          caption.setAttribute('data-image-id', imageID)
          caption.innerHTML = `<span data-image-id='${imageID}' class="${captionClassName}">请输入图片描述</span>`
          el.parentNode.appendChild(caption)
        } else {
          // move cursor
          let child = caption.firstChild
          if (child.tagName.toLowerCase() === 'font') {
            child = child.firstChild
          }
          MediumEditor.selection.moveCursor(this.document, child, child.childNodes.length)
        }
      }
      el.classList.remove('medium-editor-insert-image-active')
      this.base.checkContentChanged()
    }
  })

  return ToolbarButton
}

export class MediumEditorToolbar extends MediumEditor.extensions.toolbar {
  name: string
  editor: Editor
  window: any
  document: any
  base: any
  type: string = 'image'
  constructor (options: ToolbarOptions) {
    super(options)
    this.window = options.editor.window
    this.document = options.editor.document
    this.base = options.editor.base
    this.name = `${options.type}Toolbar`

    options.buttons.forEach((buttonOptions: any) => {
      const ToolbarButton = getToolbarButton(MediumEditor)
      const button = new ToolbarButton(
        Object.assign(
          {},
          {
            window: this.window,
            document: this.document,
            base: this.base
          },
          buttonOptions
        )
      )

      button.init()
      this.editor.base.extensions.push(button)
    })

    this.init()
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
      activeElements = utils.getElementsByClassName(
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
    const container = utils.getElementsByClassName(
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

export class MediumEditorToolbarAdaptor extends MediumEditorToolbar implements SelectionToolbar {
  addButton(button: ToolbarButton): SelectionToolbar {
    throw new Error("Method not implemented.")
  }
  addButtons(buttons: ToolbarButton[]): SelectionToolbar {
    throw new Error("Method not implemented.")
  }

}
