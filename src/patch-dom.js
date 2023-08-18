export function patchDOM(oldNode, newNode, parent) {
  if (!oldNode) {
    if (parent && newNode) {
      parent.appendChild(newNode);
    }
    return;
  }

  if (oldNode.isEqualNode(newNode)) return;

  if (oldNode.nodeName !== newNode.nodeName) {
    parent.replaceChild(newNode, oldNode);
    return;
  }

  if (oldNode.nodeType === Node.TEXT_NODE) {
    if (oldNode.textContent !== newNode.textContent) {
      oldNode.textContent = newNode.textContent;
    }
    return;
  }

  for (let i = oldNode.attributes.length - 1; i >= 0; i--) {
    const attrName = oldNode.attributes[i].name;
    if (!newNode.hasAttribute(attrName) && !attrName === 'open') {
      oldNode.removeAttribute(attrName);
    }
  }

  for (let i = 0; i < newNode.attributes.length; i++) {
    const attrName = newNode.attributes[i].name;
    const attrValue = newNode.attributes[i].value;
    oldNode.setAttribute(attrName, attrValue);
  }

  for (let i = 0; i < newNode.childNodes.length; i++) {
    if (oldNode.childNodes[i]) {
      patchDOM(oldNode.childNodes[i], newNode.childNodes[i], oldNode);
    } else {
      oldNode.appendChild(newNode.childNodes[i].cloneNode(true));
    }
  }

  while (oldNode.childNodes.length > newNode.childNodes.length) {
    oldNode.removeChild(oldNode.lastChild);
  }
}
