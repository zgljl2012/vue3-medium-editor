/* eslint-disable */
import Images from './addons/Images';
import Embeds from './addons/Embeds';
export default class Core {
    constructor(plugin, MediumEditor) {
        this._plugin = plugin;
        this._editor = this._plugin.base;
        this.MediumEditor = MediumEditor;
        this.initAddons();
        this.addButtons();
        this.events();
    }
    getClosestWithClassName(el, className) {
        return this.MediumEditor.util.traverseUp(el, (element) => {
            return element.classList.contains(className);
        });
    }
    isChildOf(el, parent) {
        return this.MediumEditor.util.traverseUp(el, (element) => {
            return element === parent;
        });
    }
    events() {
        // This could be chained when medium-editor 5.15.2 is released
        // https://github.com/yabwe/medium-editor/pull/1046
        this._plugin.on(document, 'click', this.toggleButtons.bind(this));
        this._plugin.on(document, 'keyup', this.toggleButtons.bind(this));
        this._plugin.on(this.buttons.getElementsByClassName('medium-editor-insert-buttons-show')[0], 'click', this.toggleAddons.bind(this));
        // This could be written in one statement when medium-editor 5.15.2 is released
        // https://github.com/yabwe/medium-editor/pull/1046
        const addonActions = this.buttons.getElementsByClassName('medium-editor-insert-action');
        Array.prototype.forEach.call(addonActions, action => {
            this._plugin.on(action, 'click', this.handleAddonClick.bind(this));
        });
        this._plugin.on(window, 'resize', this.positionButtons.bind(this));
    }
    initAddons() {
        // Initialize all default addons, we'll delete ones we don't need later
        this._plugin._initializedAddons = {
            images: new Images(this._plugin, this._plugin.addons.images, this.MediumEditor),
            embeds: new Embeds(this._plugin, this._plugin.addons.embeds, this.MediumEditor)
        };
        Object.keys(this._plugin.addons).forEach(name => {
            const AddonOptions = this._plugin.addons[name];
            // If the addon is custom one
            if (!this._plugin._initializedAddons[name]) {
                if (typeof AddonOptions === 'function') {
                    this._plugin._initializedAddons[name] = new AddonOptions(this._plugin);
                }
                else {
                    window.console.error(`I don't know how to initialize custom '${name}' addon!`);
                }
            }
            // Delete disabled addon
            if (!AddonOptions) {
                delete this._plugin._initializedAddons[name];
            }
        });
    }
    addButtons() {
        const addons = this._plugin.getAddons();
        let html;
        this.buttons = document.createElement('div');
        this.buttons.id = `medium-editor-insert-${this._plugin.getEditorId()}`;
        this.buttons.classList.add('medium-editor-insert-buttons');
        this.buttons.setAttribute('contentediable', false);
        html = `<a class='medium-editor-insert-buttons-show' style="border-color: rgba(0,0,0,.68); padding-top: 2px;"><svg class="svgIcon-use" width="25" height="25"><path d="M20 12h-7V5h-1v7H5v1h7v7h1v-7h7" fill-rule="evenodd"></path></svg></a>
    <ul class='medium-editor-insert-buttons-addons'>`;
        // 遍历插件
        Object.keys(addons).forEach(name => {
            const addon = addons[name];
            html += `<li><a class='medium-editor-insert-action' data-addon='${name}'>${addon.label}</a></li>`;
        });
        html += '</ul>';
        this.buttons.innerHTML = html;
        document.body.appendChild(this.buttons);
    }
    removeButtons() {
        this.buttons.remove();
    }
    positionButtons() {
        // Don't position buttons if they aren't active
        if (this.buttons.classList.contains('medium-editor-insert-buttons-active') ===
            false) {
            return;
        }
        const el = this._editor.getSelectedParentElement();
        const elPosition = el.getBoundingClientRect();
        const addons = this.buttons.getElementsByClassName('medium-editor-insert-buttons-addons')[0];
        const addonButton = this.buttons.getElementsByClassName('medium-editor-insert-action')[0];
        const addonsStyle = window.getComputedStyle(addons);
        const addonButtonStyle = window.getComputedStyle(addonButton);
        // Calculate position
        const position = {
            top: window.scrollY + elPosition.top,
            left: window.scrollX +
                elPosition.left -
                parseInt(addonsStyle.left, 10) -
                parseInt(addonButtonStyle.marginLeft, 10)
        };
        // If left position is lower than 0, the buttons would be out of the viewport.
        // In that case, align buttons with the editor
        position.left = position.left < 0 ? elPosition.left : position.left;
        this.buttons.style.left = `${position.left}px`;
        this.buttons.style.top = `${position.top}px`;
    }
    toggleButtons(e) {
        const el = this._editor.getSelectedParentElement();
        // 如果 el 中包含 medium-editor-insert-image 这个类，但子元素中又没有 img，则移除 medium-editor-insert-image
        if (e.keyCode === this.MediumEditor.util.keyCode.ENTER) {
            if (el.classList.contains('medium-editor-insert-images') && el.getElementsByTagName('img').length === 0) {
                el.classList.remove('medium-editor-insert-images');
            }
        }
        if (this.shouldDisplayButtonsOnElement(el)) {
            this.selectElement(el);
            this.showButtons();
        }
        else {
            this.deselectElement();
            this.hideButtons();
        }
    }
    shouldDisplayButtonsOnElement(el) {
        const addons = this._plugin.getAddons();
        const addonClassNames = [];
        let isAddon = false;
        let belongsToEditor = false;
        // Don't show buttons when the element has text
        if (!el || !el.innerText || el.innerText.trim() !== '') {
            return false;
        }
        // Don't show buttons when the editor doesn't belong to editor
        this._plugin.getEditorElements().forEach((editor) => {
            if (this.isChildOf(el, editor)) {
                belongsToEditor = true;
            }
        });
        if (!belongsToEditor) {
            return false;
        }
        // Get class names used by addons
        Object.keys(addons).forEach(addonName => {
            const addon = addons[addonName];
            if (addon.elementClassName) {
                addonClassNames.push(addon.elementClassName);
            }
        });
        // Don't show buttons if the element is an addon element
        // - when the element has an addon class, or some of its parents have it
        addonClassNames.forEach((className) => {
            if (el.classList.contains(className) ||
                this.getClosestWithClassName(el, className)) {
                isAddon = true;
            }
        });
        return !isAddon;
    }
    selectElement(el) {
        this.selectedElement = el;
    }
    deselectElement() {
        this.selectedElement = null;
    }
    showButtons() {
        this.buttons.classList.add('medium-editor-insert-buttons-active');
        this.positionButtons();
    }
    hideButtons() {
        this.buttons.classList.remove('medium-editor-insert-buttons-active');
        this.buttons.classList.remove('medium-editor-insert-addons-active');
    }
    toggleAddons() {
        this.buttons.classList.toggle('medium-editor-insert-addons-active');
    }
    handleAddonClick(e) {
        const name = e.currentTarget.getAttribute('data-addon');
        e.preventDefault();
        this._plugin.getAddon(name).handleClick(e);
    }
}
