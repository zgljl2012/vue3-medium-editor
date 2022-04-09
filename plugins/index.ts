import * as MediumEditor from "medium-editor-x";
import { Extension, IExtensionsManager } from "./types";
import { ImageOptions, Image } from "./image";
import * as utils from './utils'
import variables from './variables'
import ExtensionsHtmlRender from './builder'
import {timer} from './decorator'

class ExtensionManager implements IExtensionsManager {
  extensions: Extension[] = [];
  extensionsMapping: { [key: string]: Extension } = {};
  extensionsClassNames: string[] = []
  _plugin: any;
  _editor: any;
  _elem: HTMLElement;
  selectedElement: any;

  // 缓存
  addonsLeft: number
  addon1MarginLeft: number

  constructor(plugin: any) {
    this._plugin = plugin;
    this._editor = this._plugin.base;
  }

  @timer
  render() {
    // render by render
    const _builder = new ExtensionsHtmlRender({editorId: this._plugin.getEditorId()});
    this.extensions.forEach(extension => {
      _builder.add(extension)
    })
    this._elem = _builder
      .mount(document.body)
      .render()

    // 缓存
    const addons = this._elem.getElementsByClassName(
      variables.ADDONS_BUTTONS_CLASS
     )[0];
     const addonButton1 = this._elem.getElementsByClassName(
       variables.ACTION_CLASS
     )[0];
     this.addonsLeft = parseInt(window.getComputedStyle(addons).left, 10);
     this.addon1MarginLeft = parseInt(window.getComputedStyle(addonButton1).marginLeft, 10);

    // 绑定事件
    this.bindEvents();
  }

  addExtension(extension: Extension): void {
    this.extensions.push(extension);
    this.extensionsMapping[extension.name] = extension
    this.extensionsClassNames.push(extension.elementClassName)
  }

  private bindEvents () {
    this._plugin.on(document, "click", this.toggleButtons.bind(this));
    this._plugin.on(document, "keyup", this.toggleButtons.bind(this));
    this._plugin.on(
      this._elem.getElementsByClassName(
        variables.SHOW_BUTTONS_CLASS
      )[0],
      "click",
      this.toggleAddons.bind(this)
    );

    const addonActions = this._elem.getElementsByClassName(
      variables.ACTION_CLASS
    );
    Array.prototype.forEach.call(addonActions, (action) => {
      this._plugin.on(action, "click", this.handleAddonClick.bind(this));
    });

    this._plugin.on(window, "resize", this.reposition.bind(this));
  }

  destroy() {
    this._elem.remove();
  }

  private reposition() {
    // Don't position buttons if they aren't active
    // 根据计时结果，此部分最时间
    if (
      this._elem.classList.contains(variables.ACTIVE_BUTTONS_CLASS) ===
      false
    ) {
      return;
    }

    const el = this._editor.getSelectedParentElement();
    const elPosition = el.getBoundingClientRect();

    // Calculate position
    const position = {
      top: window.scrollY + elPosition.top,
      left:
        window.scrollX +
        elPosition.left -
        this.addonsLeft -
        this.addon1MarginLeft
    };

    // If left position is lower than 0, the buttons would be out of the viewport.
    // In that case, align buttons with the editor
    position.left = position.left < 0 ? elPosition.left : position.left;

    this._elem.style.left = `${position.left}px`;
    this._elem.style.top = `${position.top}px`;
  }

  private toggleButtons(e: Event) {
    // 触发检查，检查是否应该显示响应元素
    const el = this._editor.getSelectedParentElement();
    // 检查 el 是否为 editor 元素本身，如果是，直接显示
    if (el && el.classList.contains('medium-editor')) {
      this.show();
      return
    }

    if (this.shouldDisplayButtonsOnElement(el)) {
      this.selectElement(el);
      this.show();
    } else {
      this.deselectElement();
      this.hide();
    }
  }

  // 是否应该显示按钮
  private shouldDisplayButtonsOnElement(el: HTMLElement) {
    // Don't show buttons when the element has text
    if (!el || !el.innerText || el.innerText.trim() !== "") {
      return false;
    }
    return this.belongsToEditor(el) && !this.isAddon(el);
  }

  private belongsToEditor(el: HTMLElement) {
    return this._plugin.getEditorElements().some((editor: any) => {
      return utils.isChildOf(el, editor);
    });
  }

  private isAddon(el: HTMLElement): boolean {
    return this.extensionsClassNames.some((className: any) => {
      return el.classList.contains(className);
    });
  }

  private selectElement(el: any) {
    this.selectedElement = el;
  }

  private deselectElement() {
    this.selectedElement = null;
  }

  private show() {
    this._elem.classList.add(variables.ACTIVE_BUTTONS_CLASS);
    this.reposition();
  }

  private hide() {
    this._elem.classList.remove(variables.ACTIVE_BUTTONS_CLASS);
    this._elem.classList.remove(variables.ACTIVE_ADDONS_CLASS);
  }

  private toggleAddons() {
    // 切换状态
    this._elem.classList.toggle(variables.ACTIVE_ADDONS_CLASS);
  }

  private handleAddonClick(e: any) {
    // 点击插件
    const name = e.currentTarget.getAttribute(variables.ATTR_DATA_ADDON);
    e.preventDefault();
    this.extensionsMapping[name].handleClick(e);
  }
}

export const createExtensionsManager = ({ imageOptions }: {imageOptions: ImageOptions}) => {
  const extensions = MediumEditor.Extension.extend({
    name: "extensions",

    init: function () {
      // eslint-disable-next-line prefer-rest-params
      MediumEditor.Extension.prototype.init.apply(this, arguments);

      // Create extensions manager
      this.extensionsManager = new ExtensionManager(this);

      // init extensions
      const imageExtension = new Image(imageOptions);

      // add extensions
      this.extensionsManager.addExtension(imageExtension);

      // render
      this.extensionsManager.render();
    },
    destroy: function () {
      this.extensionsManager.destroy();
    }
  });
  return extensions;
};
