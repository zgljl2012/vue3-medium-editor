import { Extension, AbstractExtension, MediumEditorAdaptor } from '../../types'
import utils from '../../utils'
import { Toolbar } from './toolbar'
import * as MediumEditor from 'medium-editor-x'
import { delay } from '../../decorator'

const captionClassName: string = 'medium-editor-insert-image-caption'
const elementClassName: string = 'medium-editor-insert-images'
const activeClassName: string = 'medium-editor-insert-image-active'
export interface ImageOptions {
  onClick(cb: (url: string) => void)
}

export class ImageExtension extends AbstractExtension {
  // options: ImageOptions
  name: string = 'image'
  label: string = '<span class="fa fa-camera"></span>'

  options: ImageOptions = {
    // 如果 click 不为空且为一个函数，则点击时将调用 click(cb)，cb 为一个回调函数，需传入图片地址
    onClick: null
  }
  _plugin: any
  _editor: any
  elementClassName: string = elementClassName
  activeClassName: string = activeClassName

  toolbar: any
  imageID: number = 0
  cacheImages: object = {}

  constructor(plugin: any, options: ImageOptions) {
    // Create an adaptor
    super(new MediumEditorAdaptor(plugin))

    Object.assign(this.options, options)

    this._plugin = plugin
    this._editor = this._plugin.base

    this.initToolbar()

    // listen for editing figcaptions
    this._plugin.on(document, 'keyup', this.captionHandler.bind(this))

    // 预处理当前编辑器中的内容
    this.preprocess()
  }

  @delay(300)
  private preprocess() {
    // 处理 figcaption 错位的问题，延时执行，解决初始化时文本尚未渲染完成的问题
    const figcaptions = this._editor.elements[0].getElementsByTagName('figcaption')
    for(const figcaption of figcaptions) {
      // 删除 figcaption 的 next 元素
      if (figcaption.nextSibling) {
        figcaption.nextSibling.remove()
      }
      // 将 figcaption 移到前一个 p 中
      const prev = figcaption.previousSibling
      prev.appendChild(figcaption)
      // 缓存 Image
      this.cacheImages[figcaption.getAttribute('data-image-id')] = prev
      const imageID = parseInt(figcaption.getAttribute('data-image-id'), 10)
      this.imageID = Math.max(this.imageID, imageID + 1)
    }
    // 清理掉所有的空 p
    const ps = this._editor.elements[0].getElementsByTagName('p')
    for(const p of ps) {
      if (p.innerHTML === '') {
        p.remove()
      }
    }
  }

  // 处理在图片后面回车的情况
  private handleEnterAfterImageElem (elem: any): boolean {
    if (elem.previousSibling && elem.previousSibling.classList.contains(this.elementClassName)) {
      // 清除 elem 的 style，因为这个 style 是从 image 上复制过来的
      elem.style = ''
      // 清除 classList
      elem.classList = []
      // 如果 elem 中包含 figcaption，则将 figcaption 移回 img 中
      if (elem.childNodes[1] && elem.childNodes[1].tagName.toLowerCase() === 'figcaption') {
        elem.previousSibling.appendChild(elem.childNodes[1])
        elem.removeChild(elem.childNodes[1])
      }
      return true
    }
    return false
  }

  // 处理 figcaption 中的 caption 都被删除，然后回车的情况
  private handleEnterAfterDeleteCaption (elem: any): boolean {
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
      return true
    }
    return false
  }

  // 处理删除后重新输入的情况
  private handleEnterAfterReInputCaption (elem: any): boolean {
    // 如果是 span，同时 parent 是 font，parent.parent 是 figcaption，则是说明是先删除完 span 再重新输入的情况
    if (elem.parentNode.tagName.toLowerCase() === 'font' && elem.parentNode.parentNode.tagName.toLowerCase() === 'figcaption') {
      const imageID = elem.parentNode.parentNode.getAttribute('data-image-id')
      let el = this.cacheImages[imageID]
      if (!el) {
        return false
      }
      if (el.classList.contains(elementClassName)) {
        // 删除 el 的最后一个，移到下一行，如果没有的话，给 el 的父节点添加新行
        if (el.lastChild.nodeName.toLowerCase() === 'p') {
          el.removeChild(el.lastChild)
        }
        utils.moveToNext(el)
      }
      return true
    }
    return false
  }

  // 处理在 caption 后面回车的情况
  private handleEnterAfterCaption (elem: any): boolean {
    // 如不是 caption 元素，则检查上层父节点（可能 caption 被添加了 style）
    if (!elem || !elem.classList.contains(captionClassName)) {
      const target = utils.getClosestWithClassName(elem, captionClassName)
      if (!target) {
        return false
      }
      elem = target
    }
    // get the image ID
    const imageID = elem.getAttribute('data-image-id')
    if (!imageID) {
      return false
    }
    // 获取图片元素
    let el = this.cacheImages[imageID]
    if (!el) {
      return false
    }
    if (el.classList.contains(elementClassName)) {
      // 此时在 image 中新增了一行，删除此行
      if (el.lastChild.nodeName.toLowerCase() === 'p') {
        el.removeChild(el.lastChild)
      }
      // 移到下一行或新行
      utils.moveToNext(el)
    }
    return true
  }

  private captionHandler (event: any) {
    // 处理 caption 的全选删除
    if (event.key === 'Backspace') {
      let elem = MediumEditor.selection.getSelectionStart(this._editor.options.ownerDocument)
      // 查找最近的 figcaption
      while (elem && elem.tagName.toLowerCase() !== 'figcaption') {
        elem = elem.parentNode
        if (elem.tagName.toLowerCase() === 'div') {
          return
        }
      }
      if (elem) {
        // 如果 figcaption 中的内容全部删除，则删除 figcaption
        const parentNode = elem.parentNode
        // case1: 下一行无内容
        if (elem.innerHTML === '<br>') {
          parentNode.removeChild(elem)
          utils.moveToNext(parentNode)
        } else {
          // case2: 下一行有内容，此时，会把下一行的元素提到 figcaption 中
          // 创建下一行的 p，将 figcaption 中的内容移到下一行的 p 中，然后删除 figcaption
          if (elem.childNodes[0].getAttribute('data-image-id') === null) {
            const next = document.createElement('p')
            next.appendChild(elem.childNodes[0])
            parentNode.parentNode.insertBefore(next, parentNode.nextSibling)
            parentNode.removeChild(elem)
          }
        }
      }
    }
    if (event.keyCode === 13) {
      const elem = MediumEditor.selection.getSelectionStart(this._editor.options.ownerDocument)
      // 判断当前的上个元素是否为 img，处理从图片末尾回车和整个 figcaption 被删除的问题
      const handlers: ((elem: any) => boolean)[] = [
        this.handleEnterAfterImageElem.bind(this),
        this.handleEnterAfterDeleteCaption.bind(this),
        this.handleEnterAfterReInputCaption.bind(this),
        this.handleEnterAfterCaption.bind(this)
      ]
      for(const handler of handlers) {
        if (handler(elem)) {
          return
        }
      }
    }
  }

  private nextImageID (): string {
    return `${this.imageID++}`
  }

  handleClick () {
    // 如果设置了回调，则交给回调处理，只接收回调函数传回的图片 URL
    if (this.options.onClick && typeof this.options.onClick === 'function') {
      this.options.onClick((imgUrl: any) => {
        this.render({url: imgUrl})
      })
      return
    }
    // TODO 支持图片上传
  }

  private initToolbar () {
    this.toolbar = new Toolbar({
      plugin: this._plugin,
      type: 'images',
      activeClassName: activeClassName,
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

  protected render ({url}: {url: string}) {
    let el = this.getCurrentNode()
    const imageID = this.nextImageID()
    const img = document.createElement('img')
    img.setAttribute('data-image-id', `${imageID}`)
    img.style.maxWidth = '100%'

    this.cacheImages[imageID] = el

    let domImage: any

    img.alt = ''

    // caption
    const caption = document.createElement('figcaption')
    caption.setAttribute('data-image-id', `${imageID}`)
    caption.innerHTML = `<span data-image-id='${imageID}' class="${captionClassName}">请输入图片描述</span>`

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
    el.classList.add(elementClassName)
    el.setAttribute('contenteditable', 'false')
    return el
  }
}
