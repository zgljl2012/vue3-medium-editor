import { ToolbarButton } from '../types'

export class AlignCenterButton implements ToolbarButton {
  name: string = 'align-center'
  label: string = 'Center'

  onClick(extensionElem: HTMLElement) {
    const parentNode = <HTMLElement>(extensionElem.parentNode)
    parentNode.style['text-align'] = 'center'
  }
}
