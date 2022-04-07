/* eslint-disable */
export default class Embeds {
    constructor(plugin, options, MediumEditor) {
        this.MediumEditor = MediumEditor;
        this._plugin = plugin;
        this._editor = this._plugin.base;
        this.options = {
            label: '<span class="fa fa-video"></span>'
        };
        Object.assign(this.options, options);
        this.label = this.options.label;
    }
    handleClick() {
        window.console.log('embeds clicked');
    }
}
