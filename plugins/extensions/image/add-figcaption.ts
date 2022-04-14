import { ToolbarButton } from '../../types'
import * as MediumEditor from 'medium-editor-x'

export class AddFigcaptionButton implements ToolbarButton {
  name: string = 'app-figcaption'
  label: string = 'Add Figcaption'
  private document: Document
  private captionClassName: string

  constructor(options: {
    document: Document,
    captionClassName: string
  }) {
    this.document = options.document
    this.captionClassName = options.captionClassName
  }

  onClick(extensionElem: HTMLElement) {
    // 判断是否已存在 caption
    const caption = extensionElem.nextSibling
    if (!caption) {
      const caption = this.document.createElement('figcaption')
      const imageID = extensionElem.getAttribute('data-image-id')
      caption.setAttribute('data-image-id', imageID)
      caption.innerHTML = `<span data-image-id='${imageID}' class="${this.captionClassName}">请输入图片描述</span>`
      extensionElem.parentNode.appendChild(caption)
    } else {
      // move cursor
      let child = <HTMLElement>caption.firstChild
      if (child.tagName.toLowerCase() === 'font') {
        child = <HTMLElement>child.firstChild
      }
      MediumEditor.selection.moveCursor(this.document, child, child.childNodes.length)
    }
  }
}
