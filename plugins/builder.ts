import { Extension, IExtensionsHtmlRender } from "./types";
import variables from './variables'

export class ExtensionsHtmlRender implements IExtensionsHtmlRender {
  private _html: string
  private _elem: HTMLElement
  constructor({editorId}) {
    this.init({editorId})
  }

  private init({ editorId }) {
    this._elem = document.createElement("div");
    this._elem.id = `${variables.BASE_CLASS_PREFIX}${editorId}`;
    this._elem.classList.add(variables.BUTTONS_CLASS);
    this._elem.setAttribute(variables.ATTR_CONTENT_EDITABLE, 'false');
    this._html = this.renderIcon()
  }

  private renderIcon () : string {
    const svgPath = '<path d="M20 12h-7V5h-1v7H5v1h7v7h1v-7h7" fill-rule="evenodd"></path>'
    const iconClass = 'svgIcon-use'
    const width = 25
    const height = 25
    let html = `<svg class="${iconClass}" width="${width}" height="${height}">${svgPath}</svg>`;
    return html
  }

  add(extension: Extension): IExtensionsHtmlRender {
    throw new Error("Method not implemented.");
  }

  render(): HTMLElement {
    this._elem.innerHTML = this._html
    return this._elem
  }
}
