<template>
  <div>
    <hr/>
    <editor1 text="" @edit='edit' />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import editor1 from './editor'
// import editor1 from 'vue3-medium-editor'

export default defineComponent({
  name: 'HelloWorld',
  components: {
    editor1
  },
  props: {
    msg: String
  },
  methods: {
    edit (op: {content: string}) {
      console.log(op.content)
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
