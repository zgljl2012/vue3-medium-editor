<template>
  <div class="editor" style="margin-left: 25%; margin-right: 25%;">
    <editor :text="text" @edit='edit' :onClickImage="onClickImage" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import editor from 'vue3-medium-editor'

export default defineComponent({
  name: 'HelloWorld',
  components: {
    editor
  },
  props: {
    msg: String
  },
  data () {
    return {
      text: ''
    }
  },
  methods: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    edit (op: {content: string}) {
      // console.log(op.content)
    },
    onClickImage (cb: (url: string) => void) {
      console.log('click image1')
      // eslint-disable-next-line node/no-callback-literal
      cb('https://www.baidu.com/img/PCtm_d9c8750bed0b3c7d089fa7d55720d6cf.png')
    }
  }
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.editor {
  background: #fafafa;
  padding: 24px;
  padding-left: 48px;
  padding-right: 48px;
  box-shadow: 3px 1px 5px 1px #87878755;
  min-height: 1000px;
}

</style>
