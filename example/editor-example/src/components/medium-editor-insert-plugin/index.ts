import Core from './Core'

export const createEditorInsert = (MediumEditor: any, imageOptions: any) => {
  const MediumEditorInsert = MediumEditor.Extension.extend({
    name: 'insert',

    addons: {
      images: imageOptions || {},
      embeds: true
    },

    _initializedAddons: {},

    init: function () {
      // eslint-disable-next-line prefer-rest-params
      MediumEditor.Extension.prototype.init.apply(this, arguments)

      this.core = new Core(this, MediumEditor)
    },

    destroy: function () {
      this.core.removeButtons()
    },

    getCore: function () {
      return this.core
    },

    getAddons: function () {
      return this._initializedAddons
    },

    getAddon: function (name: string) {
      return this._initializedAddons[name]
    }
  })

  return MediumEditorInsert
}
