import * as MediumEditor from 'medium-editor-x'

export function moveToNext (el: HTMLElement) {
  let nextChild = el.nextSibling
  if (nextChild === null) {
    const p = document.createElement('p')
    p.innerHTML = '<br>'
    el.parentNode?.appendChild(p)
    nextChild = p
  }
  // move cursor to next element
  MediumEditor.selection.moveCursor(document, nextChild, nextChild.childNodes.length)
}

export function getClosestWithClassName(el: HTMLElement, className: string) {
  return MediumEditor.util.traverseUp(el, (element: any) => {
    return element.classList.contains(className);
  });
}

export function isChildOf(el: HTMLElement, parent: string) {
  return MediumEditor.util.traverseUp(el, (element: any) => {
    return element === parent;
  });
}
