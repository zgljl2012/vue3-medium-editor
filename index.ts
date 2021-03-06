/* eslint-disable */
import { h, defineComponent } from 'vue'
import * as MediumEditor from 'medium-editor-x'
import 'medium-editor/dist/css/medium-editor.min.css'
import 'medium-editor/dist/css/themes/default.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { createExtensionsManager } from './plugins'
import './style.css'
import './plugins/styles/style.css'

const EMPTY_CONTENT = '<p><br></p>'

export default defineComponent({
  name: 'medium-editor',
  /**
   * Usage:
   * <editor text="" @edit='edit' />
   * //...
   * edit (op: {content: string}) {
   *   console.log(op.content)
   * }
   */
  emits: ['edit', 'editorCreated'],
  props: {
    text: {
      type: [String]
    },
    onClickImage: {
      type: [Function],
      default: () => {
        return null
      }
    },
    options: {
      // Options: https://github.com/yabwe/medium-editor/blob/master/OPTIONS.md
      type: [Object],
      default: () => {
        return {
          toolbar: {
            buttons: ['h2', 'h3', 'bold', 'italic', 'underline', 'strikethrough',
              'highlighter', 'anchor', 'unorderedlist', 'orderedlist', 'quote',
              'justifyLeft', 'justifyCenter', 'justifyRight']
          },
          paste: {
            forcePlainText: false,
            cleanPastedHTML: true,
            cleanAttrs: ['style', 'dir', 'class'],
            cleanTags: ['label', 'meta', 'path', 'image', 'svg', 'button'],
            unwrapTags: ['sub', 'sup']
          },
          placeholder: {
            text: 'Type something...',
            hideOnClick: true
          }
        }
      }
    }
  },
  data () : { editor: MediumEditor.MediumEditor | null, customTag: string, elementID: string } {
    return {
      customTag: 'div',
      elementID: 'vue3ElementEditor',
      editor: null
    }
  },
  render () {
    return h(this.customTag, {
      class: 'medium-editor',
      id: this.elementID,
      ref: this.elementID,
      style: 'text-align:left; font-size: 18px;'
    })
  },
  mounted () {
    this.createAndSubscribe()
  },
  beforeUnmount () {
    this.tearDown()
  },
  methods: {
    getElement () {
      return document.getElementById(this.elementID) || { innerHTML: '' }
    },
    emit (event: Event) {
      this.$emit('edit', { content: this.getElement().innerHTML })
    },
    tearDown () {
      clearInterval(this.interval)
      window.removeEventListener('keydown', this.onGlobalKeyDown)
      this.editor?.unsubscribe('editableInput', this.emit)
      this.editor?.destroy()
    },
    onGlobalKeyDown(e: KeyboardEvent) {
      // ???????????????????????????????????????????????????
      if (e.key === 'Backspace' && e.target === this.getElement()
        && this.editor && this.editor?.getContent() === EMPTY_CONTENT) {
        e.preventDefault()
      }
    },
    createAndSubscribe () {
      // plugins
      const MediumEditorInsert = createExtensionsManager(
        {
          imageOptions: {
            onClick: this.onClickImage
          }
        }
      )
      const insertPlugin = new MediumEditorInsert()
      const options = {
        ...this.options,
        extensions: {
          insert: insertPlugin
        }
      }

      // ????????????????????????????????????????????????????????????????????????
      window.addEventListener('keydown', this.onGlobalKeyDown)

      this.getElement().innerHTML = this.text || EMPTY_CONTENT
      this.editor = new MediumEditor(`#${this.elementID}`, options)
      this.editor.subscribe('editableInput', this.emit)
      this.$emit('editorCreated', this.editor)

      // TODO ?????? Proxy ????????? DOM ?????????????????????????????????????????????????????????
      // ????????????????????????????????????????????????????????????????????????????????? 100 ms????????????????????????????????????????????????????????????
      let cache = this.getElement().innerHTML
      this.interval = setInterval(() => {
        if (cache !== this.getElement().innerHTML) {
          this.emit(new Event('editableInput'))
          cache = this.getElement().innerHTML
        }
      }, 100)

    }
  },
  watch: {
    text (newText) {
      if (newText !== this.getElement().innerHTML) {
        this.editor?.setContent(this.text || '', 0)
        this.getElement().innerHTML = this.text || ''
      }
    },
    options: {
      handler () {
        this.tearDown()
        this.createAndSubscribe()
      },
      deep: true
    }
  }
})
