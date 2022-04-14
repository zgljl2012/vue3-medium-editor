import { Extension, ToolbarOptions } from '../../types'

export class VideoExtension implements Extension {
  name: string = 'video';
  label: string = '<span class="fa fa-video"></span>';
  elementClassName: string = 'video-extension';

  constructor() {
  }

  handleClick(e: Event) {
    console.log('VideoExtension.handleClick()')
  }

  toolbar(): ToolbarOptions | null {
    return null
  }
}
