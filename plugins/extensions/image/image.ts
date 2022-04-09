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
  label: string = '<span class="fa fa-camera"></span>'

  options: ImageOptions = {
    // 如果 click 不为空且为一个函数，则点击时将调用 click(cb)，cb 为一个回调函数，需传入图片地址
    onClick: null
  }
  _plugin: any
  _editor: any

  // class name
  elementClassName: string = 'medium-editor-insert-images'
  activeClassName: string = 'medium-editor-insert-image-active'
  captionClassName: string = captionClassName
  toolbar: any
  captionListener: any
  imageID: number = 0

  cachedElement: any = null
  cacheImages: any = {}

  constructor(plugin: any, options: ImageOptions) {
    Object.assign(this.options, options)

    this._plugin = plugin
    this._editor = this._plugin.base

    this.initToolbar()
    this.events()

    // listen for editing figcaptions
    this.captionListener = (event: any) => {
      if (event.keyCode === 13) {
        const elem = MediumEditor.selection.getSelectionStart(this._editor.options.ownerDocument)
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
          MediumEditor.selection.moveCursor(document, next, next.childNodes.length)
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

  private nextImageID () {
    return this.imageID++
  }

  private events () {
    this._plugin.on(document, 'click', this.unselectImage.bind(this))

    this._plugin.getEditorElements().forEach((editor: any) => {
      this._plugin.on(editor, 'click', this.selectImage.bind(this))
    })
  }

  handleClick () {
    // 如果设置了回调，则交给回调处理，只接收回调函数传回的图片 URL
    if (this.options.onClick && typeof this.options.onClick === 'function') {
      this.cachedElement = this._plugin.selectedElement
      this.options.onClick((imgUrl: any) => {
        this.insertImage(imgUrl, null)
      })
      return
    }
    // TODO 支持图片上传
  }

  private initToolbar () {
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

  private insertImage (url: any, uid: any) {
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
      el = this.cachedElement
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

  private selectImage (e: any) {
    const el = e.target

    if (
      el.nodeName.toLowerCase() === 'img'
      // && this.getClosestWithClassName(el, this.elementClassName)
    ) {
      el.classList.add(this.activeClassName)
      this._editor.selectElement(el)
    }
  }

  private unselectImage (e: any) {
    const el = e.target
    let clickedImage: any

    // Unselect all selected images. If an image is clicked, unselect all except this one.
    if (
      el.nodeName.toLowerCase() === 'img' &&
      el.classList.contains(this.activeClassName)
    ) {
      clickedImage = el
    }

    const images = utils.getElementsByClassName(
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
