import * as MediumEditor from 'medium-editor-x';
export function moveToNext(el) {
    let nextChild = el.nextSibling;
    if (nextChild === null) {
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        el.parentNode?.appendChild(p);
        nextChild = p;
    }
    // move cursor to next element
    MediumEditor.selection.moveCursor(document, nextChild, nextChild.childNodes.length);
}
