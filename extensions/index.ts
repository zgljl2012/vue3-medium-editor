/* eslint-disable */
import Core from './Core'
import * as MediumEditor from 'medium-editor-x'

export interface ImageOptions {
  onClick(cb: (url: string) => void)
}


export const createEditorInsert = (imageOptions: ImageOptions) => {
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

    // getCore: function () {
    //   return this.core
    // },

    getAddons: function () {
      return this._initializedAddons
    },

    getAddon: function (name: string) {
      return this._initializedAddons[name]
    }
  })

  return MediumEditorInsert
}
