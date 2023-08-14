let extensions
async function toggleMuteExt(e) {
  const id = e.target.id.replace('mute-', '');
  let { muted } = await chrome.storage.local.get('muted')
  chrome.runtime.sendMessage({ type: 'toggleMute', data: { id, muted: !muted[id] } });  
  await updateList(extensions);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('extensions').addEventListener('click', (e) => {
    if(e.target.id.startsWith('mute-')) {
      toggleMuteExt(e);
    }
  });
});

async function updateList(exts) {
  extensions = exts;
  let { muted } = await chrome.storage.local.get('muted')
  if(!muted) {
    muted = {};
    await chrome.storage.local.set({ muted });
  }
  const extsList = document.createElement('tbody');
  extsList.id = 'exts-body'
  exts = exts.sort((a, b) => {
    const diff = b.numRequests - a.numRequests;
    if(diff === 0) return a.name.localeCompare(b.name);
    return diff;
  });
  
  for (let ext of exts) {
    const tr = document.createElement('tr');
    tr.id = ext.id

    tr.innerHTML = `
      <td><div id='mute-${ext.id}' style='cursor: pointer;'>${muted[ext.id] ? '\u{1F507}' : '\u{1F508}'}</div></td>
      <td><img src="${ext.icon}" style="width: 16px; height: 16px; margin-right: 4px;" /></td>
      <td>
        <details>
          <summary>${ext.name}</summary>
          ${Object.keys(ext.reqUrls).map(url => `
            <div style="display: flex; gap: 1em; font-size: .75em; padding: 0 1em;">
              <div style="flex: 1;">${url}</div>
              <div style="margin-right: auto;">${ext.reqUrls[url]}</div>
            </div>
          `).join(' ')}
        </details>
      </td>
      <td><div style="margin-left: 4px; color: #999;">${ext.numRequests}</div></td>
    `
    extsList.appendChild(tr);
  }
  patchDOM(document.getElementById('exts-body'), extsList, document.getElementById('exts-body').parent);
}

(async () => {
  await chrome.runtime.connect();
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'init') {
      updateList(Object.values(message.data));
    }
  });
})();



function patchDOM(oldNode, newNode, parent) {
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
