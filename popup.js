let extensions;

async function toggleMuteExt(e) {
  const id = e.target.id.replace('mute-', '');
  await chrome.runtime.sendMessage({ type: 'toggleMute', data: { id } });  
  await updateList(extensions);
}

async function toggleBlockExt(e) {
  const id = e.target.id.replace('block-', '');
  await chrome.runtime.sendMessage({ type: 'toggleBlock', data: { id } });  
  await updateList(extensions);
}

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

async function updateList(exts) {
  extensions = Object.values(exts).sort((a, b) => {
    const diff = (b.numRequestsAllowed + b.numRequestsBlocked) - (a.numRequestsAllowed + a.numRequestsBlocked);
    if(diff === 0) return a.name.localeCompare(b.name);
    return diff;
  });

  
  const extsList = document.createElement('div');
  extsList.id = 'exts-body'
  let innerHTML = ''
  for (let ext of extensions) {
    const tr = document.createElement('div');
    tr.id = ext.id
    let icon
    if(!ext.icon || ext.icon.endsWith('undefined')) {
      icon = '';
    } else {
      icon = `<img src="${ext.icon}" style="width: 16px; height: 16px; margin-right: 4px;" />`
    }

    // NOTE: this is not XSS-safe but the risk is minimal, considering:
    // 1. Only runs in popup, where CSP doesn't not allow inline scripts
    // 2. Extension does not have the "tabs" permission or host permissions
    innerHTML += `
    <details class='item'>
      <summary>
        <div class='grid'>
          <div id='mute-${ext.id}' style='cursor: pointer;'>${ext.muted ? '\u{1F507}' : '\u{1F508}'}</div>
          <div id='block-${ext.id}' style='opacity: ${ext.blocked ? '100%' : '10%'}; cursor: pointer;'>\u{1F6AB}</div>
          <div>${icon}</div>
          <div>${ext.name}</div>            
          <div style="margin-left: 4px; color: #999;">${ext.numRequestsAllowed}${ext.numRequestsBlocked ? ` | <span style='color: red;'>${ext.numRequestsBlocked}</span>` : ''}</div>
        </div>
      </summary>
      <div class='requests'>
      ${Object.keys(ext.reqUrls).map(url => `
        <pre>${url}</pre>
        <div><div>${ext.reqUrls[url].allowed}${ext.reqUrls[url].blocked ? ` | <span style='color: red;'>${ext.reqUrls[url].blocked}</span>` : ''}</div></div>
      `).join(' ')}
      </div>

    </details>
    `
  }
  extsList.innerHTML = innerHTML;
  patchDOM(document.getElementById('exts-body'), extsList, document.getElementById('exts-body').parent);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('exts-body').addEventListener('click', (e) => {
    if(e.target.id.startsWith('mute-')) {
      toggleMuteExt(e);
      e.preventDefault();
    } else if (e.target.id.startsWith('block-')) {
      toggleBlockExt(e);
      e.preventDefault();
    }
  })
  document.getElementById('reset').addEventListener('click', 
    () => chrome.runtime.sendMessage({ type: 'reset' }));
});

(async () => {
  await chrome.runtime.connect();
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'init') {
      updateList(message.data);
    }
  })
})()