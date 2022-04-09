<template>
  <div style="margin-left: 3em; margin-right: 3em;">
    <hr/>
    <editor1 :text="text" @edit='edit' :onClickImage="onClickImage" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
// import editor1 from './editor'
import editor1 from 'vue3-medium-editor'

const TEST_1 = '<p>Hello world</p><p class="medium-editor-insert-images" style="text-align: center;"><img data-image-id="0" alt="" src="https://www.baidu.com/img/PCtm_d9c8750bed0b3c7d089fa7d55720d6cf.png" style="max-width: 100%;" class=""><figcaption data-image-id="0"><span data-image-id="0" class="medium-editor-insert-image-caption">请输入图片描述</span></figcaption></p><p></p>'

export default defineComponent({
  name: 'HelloWorld',
  components: {
    editor1
  },
  props: {
    msg: String
  },
  data () {
    return {
      text: TEST_1
    }
  },
  methods: {
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

h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
