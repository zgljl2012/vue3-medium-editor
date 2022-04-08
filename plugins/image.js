export class Image {
    constructor(options) {
        this.name = 'image';
        this.label = '<span class="fa fa-camera"></span>';
        this.options = options;
    }
    handleClick(e) {
        console.log(':image', e);
    }
}
