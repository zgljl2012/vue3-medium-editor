import { Extension, IExtensionsHtmlRender, ExtensionsHtmlRenderOptions } from "./types";
import variables from './variables'

export class ExtensionsHtmlRender implements IExtensionsHtmlRender {
  private _html: string
  private _elem: HTMLElement
  private options: ExtensionsHtmlRenderOptions
  private mountTo: HTMLElement
  constructor(options: ExtensionsHtmlRenderOptions) {
    this.options = options
    this.init()
  }

  private init() {
    this._elem = document.createElement("div");
    this._elem.id = `${variables.BASE_CLASS_PREFIX}${this.options.editorId}`;
    this._elem.classList.add(variables.BUTTONS_CLASS);
    this._elem.setAttribute(variables.ATTR_CONTENT_EDITABLE, 'false');
    const styles = 'border-color: rgba(0,0,0,.68); padding-top: 2px;'
    this._html = `<a class='${variables.SHOW_BUTTONS_CLASS}' style="${styles}">${this.renderIcon()}</a>
    <ul class='${variables.ADDONS_BUTTONS_CLASS}'>`;
  }

  private renderIcon () : string {
    const svgPath = '<path d="M20 12h-7V5h-1v7H5v1h7v7h1v-7h7" fill-rule="evenodd"></path>'
    const iconClass = 'svgIcon-use'
    const width = 25
    const height = 25
    const html = `<svg class="${iconClass}" width="${width}" height="${height}">${svgPath}</svg>`;
    return html
  }

  private li(html: string): string {
    return `<li>${html}</li>`
  }

  reset(): IExtensionsHtmlRender {
    this.init()
    return this
  }

  add(extension: Extension): IExtensionsHtmlRender {
    this._html += this.li(`<a class='${variables.ACTION_CLASS}' ${variables.ATTR_DATA_ADDON}='${extension.name}'>${extension.label}</a>`);
    return this
  }

  mount (target: HTMLElement): IExtensionsHtmlRender {
    this.mountTo = target
    return this
  }

  render(): HTMLElement {
    this._html += '</ul>';
    this._elem.innerHTML = this._html
    // mount
    if (this.mountTo) {
      this.mountTo.appendChild(this._elem)
    }
    return this._elem
  }
}

export default ExtensionsHtmlRender
