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

export function getElementsByClassName (parents: HTMLElement[], className: string) {
  const results: HTMLElement[] = []

  Array.prototype.forEach.call(parents, editor => {
    const elements = editor.getElementsByClassName(className)

    Array.prototype.forEach.call(elements, element => {
      results.push(element)
    })
  })

  return results
}

export default {
  moveToNext,
  getClosestWithClassName,
  isChildOf,
  getElementsByClassName
}
