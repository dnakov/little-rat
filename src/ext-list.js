import { patchDOM } from './patch-dom.js';
let extensions = [];
export async function updateList(exts = extensions, el = document.getElementById('exts-body')) {
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
    <details class='item ${ext.muted ? 'muted' : ''} ${ext.blocked ? 'blocked' : ''}'>
      <summary>
        <div class='grid'>
          <div class='item-mute' id='mute-${ext.id}' style='cursor: pointer;'>${ext.muted ? '\u{1F507}' : '\u{1F508}'}</div>
          <div class='item-block' id='block-${ext.id}' style='opacity: ${ext.blocked ? '100%' : '20%'}; cursor: pointer;'>\u{1F6AB}</div>
          <div class='item-icon'>${icon}</div>
          <div class='item-name'>${ext.name}</div>            
          <div class='item-reqNum' style="margin-left: 4px; color: #999;">${ext.numRequestsAllowed}${ext.numRequestsBlocked ? ` | <span style='color: red;'>${ext.numRequestsBlocked}</span>` : ''}</div>
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
  patchDOM(el, extsList, el.parent);
}