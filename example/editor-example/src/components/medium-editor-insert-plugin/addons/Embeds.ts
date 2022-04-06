export default class Embeds {
  MediumEditor: any
  _plugin: any
  _editor: any
  options: any
  label: any
  constructor (plugin: any, options: any, MediumEditor: any) {
    this.MediumEditor = MediumEditor
    this._plugin = plugin
    this._editor = this._plugin.base

    this.options = {
      label: '<span class="fa fa-video"></span>'
    }

    Object.assign(this.options, options)

    this.label = this.options.label
  }

  handleClick () {
    window.console.log('embeds clicked')
  }
}
