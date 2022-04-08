import { Extension } from './types'

export interface ImageOptions {
  onClick(cb: (url: string) => void)
}

export class Image implements Extension {
  options: ImageOptions
  name: string = 'image'
  label: string = '<span class="fa fa-camera"></span>'
  constructor(options: ImageOptions) {
    this.options = options
  }

  handleClick(e: Event) {
    console.log(':image', e)
  }
}
