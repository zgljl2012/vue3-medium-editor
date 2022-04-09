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
          const imageID = el.getAttribute('image-id')
          caption.setAttribute('image-id', imageID)
          caption.innerHTML = `<span image-id='${imageID}' class="${captionClassName}">请输入图片描述</span>`
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
