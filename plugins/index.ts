import * as MediumEditor from "medium-editor-x";
import { Extension, IExtensionsManager } from "./types";
import { ImageOptions, Image } from "./image";
import * as utils from './utils'
import variables from './variables'
import ExtensionsHtmlRender from './builder'

class ExtensionManager implements IExtensionsManager {
  extensions: Extension[] = [];
  extensionsMapping: { [key: string]: Extension } = {};
  _plugin: any;
  _editor: any;
  _elem: HTMLElement;
  selectedElement: any;
  constructor(plugin: any) {
    this._plugin = plugin;
    this._editor = this._plugin.base;
  }

  render() {
    // render by render
    const _builder = new ExtensionsHtmlRender({editorId: this._plugin.getEditorId()});
    this.extensions.forEach(extension => {
      _builder.add(extension)
    })
    this._elem = _builder
      .mount(document.body)
      .render()

    // 绑定事件
    this.bindEvents();
  }

  addExtension(extension: Extension): void {
    this.extensions.push(extension);
    this.extensionsMapping[extension.name] = extension
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

    this._plugin.on(window, "resize", this.positionButtons.bind(this));
  }

  destroy() {
    this._elem.remove();
  }

  private positionButtons() {
    // Don't position buttons if they aren't active
    if (
      this._elem.classList.contains(variables.ACTIVE_BUTTONS_CLASS) ===
      false
    ) {
      return;
    }

    const el = this._editor.getSelectedParentElement();
    const elPosition = el.getBoundingClientRect();
    const addons = this._elem.getElementsByClassName(
     variables.ADDONS_BUTTONS_CLASS
    )[0];
    const addonButton = this._elem.getElementsByClassName(
      variables.ACTION_CLASS
    )[0];
    const addonsStyle = window.getComputedStyle(addons);
    const addonButtonStyle = window.getComputedStyle(addonButton);

    // Calculate position
    const position = {
      top: window.scrollY + elPosition.top,
      left:
        window.scrollX +
        elPosition.left -
        parseInt(addonsStyle.left, 10) -
        parseInt(addonButtonStyle.marginLeft, 10),
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
    const addonClassNames: string[] = [];
    let isAddon = false;
    let belongsToEditor = false;

    // Don't show buttons when the element has text
    if (!el || !el.innerText || el.innerText.trim() !== "") {
      return false;
    }

    // Don't show buttons when the editor doesn't belong to editor
    this._plugin.getEditorElements().forEach((editor: any) => {
      if (utils.isChildOf(el, editor)) {
        belongsToEditor = true;
      }
    });

    if (!belongsToEditor) {
      return false;
    }

    // Get class names used by addons
    this.extensions.forEach((extension) => {
      if (extension.elementClassName) {
        addonClassNames.push(extension.elementClassName);
      }
    });

    // Don't show buttons if the element is an addon element
    // - when the element has an addon class, or some of its parents have it
    // 如果元素是插件元素，则不显示按钮
    // - 当元素有插件类名，或者其父元素有插件类名
    addonClassNames.forEach((className: any) => {
      if (
        el.classList.contains(className) ||
        utils.getClosestWithClassName(el, className)
      ) {
        isAddon = true;
      }
    });

    return !isAddon;
  }

  private selectElement(el: any) {
    this.selectedElement = el;
  }

  private deselectElement() {
    this.selectedElement = null;
  }

  private show() {
    this._elem.classList.add(variables.ACTIVE_BUTTONS_CLASS);
    this.positionButtons();
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
