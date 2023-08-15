let badgeNum = 0;
let popup;
let muted;
let requests = {};
let needSave = false;

chrome.storage.local.get(s => {
  muted = s?.muted || {};
  requests = s?.requests || {};
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'toggleMute') {
    muted[message.data.id] = message.data.muted;
    chrome.storage.local.set({ muted });
  }
});

async function notifyPopup() {
  if (popup) {
    chrome.runtime.sendMessage({ type: 'init', data: await getExtensions() });
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
    if(!requests[k]) {
      requests[k] = { reqUrls: {}, numRequests: 0 };
    }
    const req = requests[k];
    const url = [e.request.method, e.request.url].filter(Boolean).join(' ');
    req.numRequests = req.numRequests || 0;
    req.numRequests += 1;
    req.reqUrls[url] = req.reqUrls[url] || 0;
    req.reqUrls[url] += 1;
    needSave = true;

    if(!popup && !muted?.[k]) {
      badgeNum += 1;
      updateBadge();
    }
    notifyPopup();
  }
});

setInterval(() => {
  if (needSave) {
    chrome.storage.local.set({ requests });
    needSave = false;
  }
}, 1000);

async function getExtensions() {
  const extensions = {}
  const extInfo = await chrome.management.getAll()
  for(let { enabled, name, id, icons } of extInfo) {
    if(!enabled) continue;  
    extensions[id] = { 
      name,
      id,
      numRequests: 0, 
      reqUrls: {},
      icon: icons?.[0]?.url,
      ...(requests[id] || {})
    };
  }
  return extensions;
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'reset') {
    requests = {};
    await chrome.storage.local.set({ requests });
  }
  await sendResponse();
  await notifyPopup();
});


chrome.runtime.onConnect.addListener(async (port) => {
  port.onDisconnect.addListener(()=>{
    popup = null;
  })
  popup = port;
  badgeNum = 0;
  chrome.action.setBadgeText({ text: '' });
  await notifyPopup();
});