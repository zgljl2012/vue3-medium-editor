import * as MediumEditor from "medium-editor-x";
import { Extension, IExtensionsManager } from "./types";
import { ImageOptions, Image } from "./image";
import * as utils from './utils'
import variables from './variables'

class ExtensionManager implements IExtensionsManager {
  extensions: Extension[] = [];
  extensionsMapping: { [key: string]: Extension } = {};
  _plugin: any;
  _editor: any;
  MediumEditor: any;
  buttons: any;
  selectedElement: any;
  constructor(plugin: any, MediumEditor: any) {
    this._plugin = plugin;
    this._editor = this._plugin.base;
    this.MediumEditor = MediumEditor;
  }

  render() {
    // 添加按钮
    this.addButtons();
    // 绑定事件
    this.events();
  }

  addExtension(extension: Extension): void {
    this.extensions.push(extension);
    this.extensionsMapping[extension.name] = extension
  }

  events() {
    this._plugin.on(document, "click", this.toggleButtons.bind(this));
    this._plugin.on(document, "keyup", this.toggleButtons.bind(this));
    this._plugin.on(
      this.buttons.getElementsByClassName(
        variables.SHOW_BUTTONS_CLASS
      )[0],
      "click",
      this.toggleAddons.bind(this)
    );

    // This could be written in one statement when medium-editor 5.15.2 is released
    // https://github.com/yabwe/medium-editor/pull/1046
    const addonActions = this.buttons.getElementsByClassName(
      variables.ACTION_CLASS
    );
    Array.prototype.forEach.call(addonActions, (action) => {
      this._plugin.on(action, "click", this.handleAddonClick.bind(this));
    });

    this._plugin.on(window, "resize", this.positionButtons.bind(this));
  }

  addButtons() {
    let html: any;

    this.buttons = document.createElement("div");
    this.buttons.id = `${variables.BASE_CLASS_PREFIX}${this._plugin.getEditorId()}`;
    this.buttons.classList.add(variables.BUTTONS_CLASS);
    this.buttons.setAttribute("contentediable", false);

    html = `<a class='${variables.SHOW_BUTTONS_CLASS}' style="border-color: rgba(0,0,0,.68); padding-top: 2px;"><svg class="svgIcon-use" width="25" height="25"><path d="M20 12h-7V5h-1v7H5v1h7v7h1v-7h7" fill-rule="evenodd"></path></svg></a>
    <ul class='${variables.ADDONS_BUTTONS_CLASS}'>`;

    // 遍历插件
    this.extensions.forEach((extension) => {
      console.log('----->>>>', extension)
      html += `<li><a class='${variables.ACTION_CLASS}' ${variables.ATTR_DATA_ADDON}='${extension.name}'>${extension.label}</a></li>`;
    });

    html += "</ul>";

    this.buttons.innerHTML = html;

    document.body.appendChild(this.buttons);
  }

  removeButtons() {
    this.buttons.remove();
  }

  positionButtons() {
    // Don't position buttons if they aren't active
    if (
      this.buttons.classList.contains(variables.ACTIVE_BUTTONS_CLASS) ===
      false
    ) {
      return;
    }

    const el = this._editor.getSelectedParentElement();
    const elPosition = el.getBoundingClientRect();
    const addons = this.buttons.getElementsByClassName(
     variables.ADDONS_BUTTONS_CLASS
    )[0];
    const addonButton = this.buttons.getElementsByClassName(
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

    this.buttons.style.left = `${position.left}px`;
    this.buttons.style.top = `${position.top}px`;
  }

  toggleButtons(e: any) {
    const el = this._editor.getSelectedParentElement();

    if (this.shouldDisplayButtonsOnElement(el)) {
      this.selectElement(el);
      this.showButtons();
    } else {
      this.deselectElement();
      this.hideButtons();
    }
  }

  shouldDisplayButtonsOnElement(el: any) {
    const addons = this._plugin.getAddons();
    const addonClassNames: any = [];
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
    Object.keys(addons).forEach((addonName) => {
      const addon = addons[addonName];
      if (addon.elementClassName) {
        addonClassNames.push(addon.elementClassName);
      }
    });

    // Don't show buttons if the element is an addon element
    // - when the element has an addon class, or some of its parents have it
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

  selectElement(el: any) {
    this.selectedElement = el;
  }

  deselectElement() {
    this.selectedElement = null;
  }

  showButtons() {
    this.buttons.classList.add(variables.ACTIVE_BUTTONS_CLASS);
    this.positionButtons();
  }

  hideButtons() {
    this.buttons.classList.remove(variables.ACTIVE_BUTTONS_CLASS);
    this.buttons.classList.remove(variables.ACTIVE_ADDONS_CLASS);
  }

  toggleAddons() {
    this.buttons.classList.toggle(variables.ACTIVE_ADDONS_CLASS);
  }

  handleAddonClick(e: any) {
    const name = e.currentTarget.getAttribute(variables.ATTR_DATA_ADDON);

    e.preventDefault();

    this.extensionsMapping[name].handleClick(e);
  }
}

export const createExtensionManager = ({ imageOptions }: {imageOptions: ImageOptions}) => {
  const extensions = MediumEditor.Extension.extend({
    name: "extensions",

    init: function () {
      // eslint-disable-next-line prefer-rest-params
      MediumEditor.Extension.prototype.init.apply(this, arguments);

      // Create extensions manager
      this.extensionsManager = new ExtensionManager(this, MediumEditor);
      // init extensions
      const imageExtension = new Image(imageOptions);

      // add extensions
      this.extensionsManager.addExtension(imageExtension);

      // render
      this.extensionsManager.render();
    },
    destroy: function () {
      this.extensionsManager.removeButtons();
    }
  });
  return extensions;
};
