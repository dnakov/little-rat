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
    <details class='item ${ext.muted ? ' muted' : ''}${ext.blocked ? ' blocked' : ''}${ext.enabled ? ' enabled' : ''}'>
      <summary>
        <div class='grid'>
          <div class='item-mute pointer' id='mute-${ext.id}' title='${ext.muted ? 'Unmute' : 'Mute'} notification (badge) for this extension'></div>
          <div class='item-block pointer' id='block-${ext.id}' title='${ext.blocked ? 'Unblock' : 'Block'} network requests for this extension'></div>
          <div class='item-toggle pointer' id='toggle-${ext.id}' title='${ext.enabled ? 'Disable' : 'Enable'} extension'></div>
          <div class='item-icon'>${icon}</div>
          <div class='item-name'>${ext.name}</div>            
          <div class='item-reqNum' style="margin-left: 4px; color: #999;"><span title='Num of network requests'>${ext.numRequestsAllowed}</span>${ext.numRequestsBlocked ? ` | <span title='Number of blocked requests' style='color: red;'>${ext.numRequestsBlocked}</span>` : ''}</div>
        </div>
      </summary>
      <div class='requests'>
      ${Object.keys(ext.reqUrls).map(url => `
        <div class='item-block pointer ${ext.reqUrls[url].isBlocked ? ' blocked' : ''}' id='block-ext-url-${ext.id}' data-method='${url.split(' ')[0]}' data-url='${url.split(' ')[1]}' title='${ext.reqUrls[url].isBlocked ? 'Unblock' : 'Block'} network requests for this url'></div>
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
