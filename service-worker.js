const extensions = {}
let badgeNum = 0;
let popup;
let muted;

chrome.storage.local.get('muted', ({ muted: m }) => {
  muted = m || {};
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'toggleMute') {
    muted[message.data.id] = message.data.muted;
    chrome.storage.local.set({ muted });
  }
});

function notifyPopup() {
  if (popup) {
    chrome.runtime.sendMessage({ type: 'init', data: extensions });
  }
}

function updateBadge() {
  if (badgeNum > 0) {
    chrome.action.setBadgeBackgroundColor({ color: '#F00' });
    chrome.action.setBadgeTextColor({ color: '#FFF' });
    chrome.action.setBadgeText({ text: badgeNum.toString() });
  }
}

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((e) => {
  if (e.request.initiator?.startsWith('chrome-extension://')) {
    const k = e.request.initiator.replace('chrome-extension://', '');
    const ext = extensions[k];
    ext.numRequests = ext.numRequests || 0;
    ext.numRequests += 1;
    ext.reqUrls[e.request.url] = ext.reqUrls[e.request.url] || 0;
    ext.reqUrls[e.request.url] += 1;
    
    if(!popup && !muted[k]) {
      badgeNum = 1;
      updateBadge();
    }
    notifyPopup();
  }
});

chrome.management.getAll(
  (extInfo) => {
    for(let { name, id, icons } of extInfo) {
      extensions[id] = { name, id, icon: icons?.[0]?.url, numRequests: 0, reqUrls: {}};
    }
  }
);


chrome.runtime.onConnect.addListener(port => {
  popup = port;
  badgeNum = 0;
  chrome.action.setBadgeText({ text: '' });
  
  notifyPopup();
  port.onDisconnect.addListener(()=>{
    popup = null;
  })
});