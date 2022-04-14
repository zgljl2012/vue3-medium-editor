import { ToolbarButton } from '../types'

export class AlignRightButton implements ToolbarButton {
  name: string = 'align-right'
  label: string = 'Right'

  onClick(extensionElem: HTMLElement) {
    const parentNode = <HTMLElement>(extensionElem.parentNode)
    parentNode.style['text-align'] = 'right'
  }
}
