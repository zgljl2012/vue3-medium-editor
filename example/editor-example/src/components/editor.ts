import { h, defineComponent } from 'vue'
import MediumEditor from 'medium-editor'
import 'medium-editor/dist/css/medium-editor.min.css'
import 'medium-editor/dist/css/themes/default.min.css'
import './style.css'

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
    options: {
      // Options: https://github.com/yabwe/medium-editor/blob/master/OPTIONS.md
      type: [Object],
      default: () => {
        return {
          toolbar: {
            buttons: ['h2', 'h3', 'bold', 'italic', 'underline', 'strikethrough',
              'highlighter', 'anchor', 'unorderedlist', 'orderedlist', 'quote', 'pre',
              'justifyLeft', 'justifyCenter', 'justifyRight', 'fontsize']
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
    return h(this.customTag, { class: 'medium-editor', id: this.elementID, ref: this.elementID, style: 'text-align:left; font-size: 18px;' })
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
      this.$emit('edit', { event, editor: this.editor, content: this.editor?.getContent() })
    },
    tearDown () {
      this.editor?.unsubscribe('editableInput', this.emit)
      this.editor?.destroy()
    },
    createAndSubscribe () {
      this.getElement().innerHTML = this.text || ''
      this.editor = new MediumEditor(`#${this.elementID}`, this.options)
      this.editor.subscribe('editableInput', this.emit)
      this.$emit('editorCreated', this.editor)
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
