import { ToolbarButton } from '../types'

export class AlignLeftButton implements ToolbarButton {
  name: string = 'align-left'
  label: string = 'Left'

  onClick(extensionElem: HTMLElement) {
    const parentNode = <HTMLElement>(extensionElem.parentNode)
    parentNode.style['text-align'] = 'left'
  }
}
