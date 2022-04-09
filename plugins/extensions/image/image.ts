import { Extension } from '../../types'
import utils from '../../utils'
import { Toolbar } from './toolbar'
import * as MediumEditor from 'medium-editor-x'

const captionClassName = 'medium-editor-insert-image-caption'

export interface ImageOptions {
  onClick(cb: (url: string) => void)
}

export class ImageExtension implements Extension {
  // options: ImageOptions
  name: string = 'image'
  // label: string = '<span class="fa fa-camera"></span>'
  // elementClassName: string = 'medium-editor-extensions-image'

  MediumEditor: any
  // eslint-disable-next-line camelcase
  cache_el: any
  options: any
  _plugin: any
  _editor: any
  elementClassName: any
  activeClassName: any
  label: any
  toolbar: any
  _input: any
  captionClassName: string
  captionListener: any
  imageID: number
  cacheImages: any

  constructor(plugin: any, options: ImageOptions) {
    this.MediumEditor = MediumEditor
    this.imageID = 0
    this.cache_el = null
    this.cacheImages = {}
    this.options = {
      label: '<span class="fa fa-camera"></span>',
      preview: true,
      uploadUrl: 'upload.php',
      deleteUrl: 'delete.php',
      onClick: null, // 如果 click 不为空且为一个函数，则点击时将调用 click(cb)，cb 为一个回调函数，需传入图片地址
      deleteMethod: 'DELETE',
      deleteData: {}
    }

    Object.assign(this.options, options)

    this._plugin = plugin
    this._editor = this._plugin.base
    // 上层用于辨识此插件的标识
    this.elementClassName = 'medium-editor-insert-images'
    this.activeClassName = 'medium-editor-insert-image-active'
    this.captionClassName = captionClassName
    this.label = this.options.label

    this.initToolbar()
    this.events()

    // listen for editing figcaptions
    this.captionListener = (event: any) => {
      if (event.keyCode === 13) {
        const elem = this.MediumEditor.selection.getSelectionStart(this._editor.options.ownerDocument)
        // 判断当前是否为 img，即处理整个 figcaption 被删除的问题
        if (elem.previousSibling && elem.previousSibling.classList.contains(this.elementClassName)) {
          // 清除 elem 的 style，因为这个 style 是从 image 上复制过来的
          elem.style = ''
          // 如果 elem 中包含 figcaption，则将 figcaption 移回 img 中
          if (elem.childNodes[1] && elem.childNodes[1].tagName.toLowerCase() === 'figcaption') {
            elem.previousSibling.appendChild(elem.childNodes[1])
            elem.removeChild(elem.childNodes[1])
          }
          return
        }
        // 判断当前是否为 figcaption，即处理 span 被删除的问题
        if (elem.tagName.toLowerCase() === 'figcaption') {
          // 表明 figcaption 的内容被删除，需要删除此 figcaption
          // 删除生成的兄弟节点，然后跳转到下一行（如果没有下一行就新增一行）
          const el = elem.parentNode
          el.removeChild(elem.previousSibling)
          el.removeChild(elem)

          let next = el.nextSibling
          if (!next) {
            next = document.createElement('p')
            next.innerHTML ='<br>'
            el.parentNode.appendChild(next)
          }
          // move cursor
          this.MediumEditor.selection.moveCursor(document, next, next.childNodes.length)
          return
        }
        // TODO 处理给 caption 做了加粗等处理的情况
        // 如果是 span，同时 parent 是 font，parent.parent 是 figcaption，则是说明是先删除完 span 再重新输入的情况
        if (elem.parentNode.tagName.toLowerCase() === 'font' && elem.parentNode.parentNode.tagName.toLowerCase() === 'figcaption') {
          const imageID = elem.parentNode.parentNode.getAttribute('image-id')
          let el = this.cacheImages[parseInt(imageID, 10)]
          if (!el) {
            return
          }
          if (el.classList.contains(this.elementClassName)) {
            // 删除 el 的最后一个，移到下一行，如果没有的话，给 el 的父节点添加新行
            if (el.lastChild.nodeName.toLowerCase() === 'p') {
              el.removeChild(el.lastChild)
            }
            utils.moveToNext(el)
          }
          return
        }
        // 判断当前是否为 figcaption -> span
        if (!elem || !elem.classList.contains(this.captionClassName)) {
          return
        }
        // get the image ID
        const imageID = elem.getAttribute('image-id')
        if (!imageID) {
          return
        }
        let el = this.cacheImages[parseInt(imageID, 10)]
        if (!el) {
          return
        }
        if (el.classList.contains(this.elementClassName)) {
          // 删除 el 的最后一个，移到下一行，如果没有的话，给 el 的父节点添加新行
          if (el.lastChild.nodeName.toLowerCase() === 'p') {
            el.removeChild(el.lastChild)
          }
          utils.moveToNext(el)
        }
      }
      return true
    }
    window.removeEventListener('keyup', this.captionListener)
    window.addEventListener('keyup', this.captionListener)
    // end.
  }

  moveToNext (el: any) {
    let nextChild = el.nextSibling
    if (nextChild === null) {
      const p = document.createElement('p')
      p.innerHTML = '<br>'
      el.parentNode.appendChild(p)
      nextChild = p
    }
    // move cursor
    this.MediumEditor.selection.moveCursor(document, nextChild, nextChild.childNodes.length)
  }

  nextImageID () {
    return this.imageID++
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

  generateRandomString (length = 15) {
    return Math.random()
      .toString(36)
      .substr(2, length)
  }

  getClosestWithClassName (el: any, className: any) {
    return this.MediumEditor.util.traverseUp(el, (element: any) => {
      return element.classList.contains(className)
    })
  }

  getElementsByTagName (parents: any, tagName: any) {
    const results: any = []

    Array.prototype.forEach.call(parents, editor => {
      const elements = editor.getElementsByTagName(tagName)

      Array.prototype.forEach.call(elements, element => {
        results.push(element)
      })
    })

    return results
  }

  events () {
    this._plugin.on(document, 'click', this.unselectImage.bind(this))
    // this._plugin.on(document, 'keydown', this.removeImage.bind(this))

    this._plugin.getEditorElements().forEach((editor: any) => {
      this._plugin.on(editor, 'click', this.selectImage.bind(this))
    })
  }

  handleClick () {
    if (this.options.onClick && typeof this.options.onClick === 'function') {
      this.cache_el = this._plugin.selectedElement
      this.options.onClick((imgUrl: any) => {
        this.insertImage(imgUrl, null)
      })
      return
    }
    // 否则创建一个 input 进行图片上传
    this._input = document.createElement('input')
    this._input.type = 'file'
    this._input.multiple = true

    this._plugin.on(this._input, 'change', this.uploadFiles.bind(this))

    this._input.click()
  }

  initToolbar () {
    this.toolbar = new Toolbar({
      plugin: this._plugin,
      type: 'images',
      activeClassName: this.activeClassName,
      buttons: [
        {
          name: 'align-left',
          action: 'left',
          label: 'Left'
        },
        {
          name: 'align-center',
          action: 'center',
          label: 'Center'
        },
        {
          name: 'align-right',
          action: 'right',
          label: 'Right'
        },
        {
          name: 'caption',
          action: 'add-caption',
          label: 'Add Caption'
        }
      ]
    })

    this._editor.extensions.push(this.toolbar)
  }

  uploadFiles () {
    const paragraph = this._plugin.selectedElement

    // Replace paragraph with div, because figure is a block element
    // and can't be nested inside paragraphs
    if (paragraph.nodeName.toLowerCase() === 'p') {
      const div = document.createElement('div')

      paragraph.parentNode.insertBefore(div, paragraph)
      this._plugin.selectElement(div)
      paragraph.remove()
    }

    Array.prototype.forEach.call(this._input.files, file => {
      // Generate uid for this image, so we can identify it later
      // and we can replace preview image with uploaded one
      const uid = this.generateRandomString()

      if (this.options.preview) {
        this.preview(file, uid)
      }

      this.upload(file, uid)
    })

    this._plugin.hideButtons()
  }

  preview (file: any, uid: any) {
    const reader = new FileReader()

    reader.onload = e => {
      this.insertImage(e.target?.result, uid)
    }

    reader.readAsDataURL(file)
  }

  upload (file: any, uid: any) {
    const xhr = new XMLHttpRequest()
    const data = new FormData()

    xhr.open('POST', this.options.uploadUrl, true)
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const image = this._plugin
          .selectedElement.querySelector(`[data-uid='${uid}']`)

        if (image) {
          this.replaceImage(image, xhr.responseText)
        } else {
          this.insertImage(xhr.responseText, null)
        }
      }
    }

    data.append('file', file)
    xhr.send(data)
  }

  insertImage (url: any, uid: any) {
    let el = this._editor.getSelectedParentElement();
    // 需 el 的父元素是 div[class="medium-editor-element"]，el 本身为 <p>，即一级段落
    if (el) {
      while (!el.parentNode.classList.contains('medium-editor-element')) {
        const current = el
        el = el.parentNode
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
    if (!el) {
      el = this.cache_el
    }

    const imageID = this.nextImageID()
    const img = document.createElement('img')
    img.setAttribute('image-id', `${imageID}`)
    img.style.maxWidth = '100%'

    this.cacheImages[imageID] = el

    let domImage: any

    img.alt = ''

    if (uid) {
      img.setAttribute('data-uid', uid)
    }

    // caption
    const caption = document.createElement('figcaption')
    caption.setAttribute('image-id', `${imageID}`)
    caption.innerHTML = `<span image-id='${imageID}' class="${this.captionClassName}">请输入图片描述</span>`

    // If we're dealing with a preview image,
    // we don't have to preload it before displaying
    if (url.match(/^data:/)) {
      img.src = url
      el.appendChild(img)
      el.appendChild(caption)
    } else {
      domImage = new Image()
      domImage.onload = () => {
        img.src = domImage.src
        el.style.textAlign = 'center'
        el.appendChild(img)
        el.appendChild(caption)
      }
      domImage.src = url
    }
    el.classList.add(this.elementClassName)
    el.contentediable = false
    // Return domImage so we can test this function easily (just for testing)
    return domImage
  }

  replaceImage (image: any, url: any) {
    const domImage = new Image()

    domImage.onload = () => {
      image.src = domImage.src
      image.removeAttribute('data-uid')
    }

    domImage.src = url

    // Return domImage so we can test this function easily
    return domImage
  }

  selectImage (e: any) {
    const el = e.target

    if (
      el.nodeName.toLowerCase() === 'img'
      // && this.getClosestWithClassName(el, this.elementClassName)
    ) {
      el.classList.add(this.activeClassName)
      this._editor.selectElement(el)
    }
  }

  unselectImage (e: any) {
    const el = e.target
    let clickedImage: any

    // Unselect all selected images. If an image is clicked, unselect all except this one.
    if (
      el.nodeName.toLowerCase() === 'img' &&
      el.classList.contains(this.activeClassName)
    ) {
      clickedImage = el
    }

    const images = this.getElementsByClassName(
      this._plugin.getEditorElements(),
      this.activeClassName
    )
    Array.prototype.forEach.call(images, image => {
      if (image !== clickedImage) {
        image.classList.remove(this.activeClassName)
      }
    })
  }
}
