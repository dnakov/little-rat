let badgeNum = 0;
let popup;
let muted;
let blocked;
let requests = {};
let needSave = false;
let lastNotify = +new Date();

chrome.storage.local.get(s => {
  muted = s?.muted || {};
  blocked = s?.blocked || {};
  requests = s?.requests || {};
});

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'toggleMute') {
    muted[message.data.id] = !muted[message.data.id];
    chrome.storage.local.set({ muted });
  } else if (message.type === 'toggleBlock') {
    blocked[message.data.id] = !blocked[message.data.id];
    chrome.storage.local.set({ blocked });
    updateBlockedRules();
  }
});

async function notifyPopup(directRun=false) {
  let now = +new Date();
  if ((directRun || now - lastNotify > 1000) && popup) {
    lastNotify = now;
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
async function setupListener() {
  const hasPerm = await chrome.permissions.contains({permissions: ['declarativeNetRequestFeedback']})
  if(!hasPerm) {
    return;
  }
  if(!chrome.declarativeNetRequest?.onRuleMatchedDebug) return;
  console.log(chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((e) => {
    if (e.request.initiator?.startsWith('chrome-extension://')) {
      const k = e.request.initiator.replace('chrome-extension://', '');
      if(!requests[k]) {
        requests[k] = { reqUrls: {}, numRequestsAllowed: 0, numRequestsBlocked: 0 };
      }
      const req = requests[k];
      const url = [e.request.method, e.request.url].filter(Boolean).join(' ');
      req.numRequestsAllowed = req.numRequestsAllowed || 0;
      req.numRequestsBlocked = req.numRequestsBlocked || 0;

      if(!req.reqUrls[url] || typeof req.reqUrls[url] !== 'object') {
        req.reqUrls[url] = { blocked: 0, allowed: typeof req.reqUrls[url] === 'number' ? req.reqUrls[url] : 0 };
      }
      
      if(e.rule.ruleId === 1) {
        req.numRequestsBlocked += 1;
        req.reqUrls[url].blocked += 1;
      } else {
        req.numRequestsAllowed += 1;
        req.reqUrls[url].allowed += 1;
      }
      
      needSave = true;

      if(!popup && !muted?.[k]) {
        badgeNum += 1;
        updateBadge();
      }
      notifyPopup();
    }
  }));
}

setInterval(() => {
  if (needSave) {
    chrome.storage.local.set({ requests });
    needSave = false;
  }
}, 1000);

async function getExtensions() {
  const extensions = {}
  const hasPerm = await chrome.permissions.contains({permissions: ['management']})
  if(!hasPerm) return [];
  const extInfo = await chrome.management.getAll()
  for(let { enabled, name, id, icons } of extInfo) {
    if(!enabled) continue;
    extensions[id] = { 
      name,
      id,
      numRequestsAllowed: 0,
      numRequestsBlocked: 0,
      reqUrls: {},
      icon: icons?.[icons?.length - 1]?.url,
      blocked: blocked[id],
      muted: muted[id],
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
  await notifyPopup(true);
});


chrome.runtime.onConnect.addListener(async (port) => {
  port.onDisconnect.addListener(()=>{
    popup = null;
  })
  popup = port;
  badgeNum = 0;
  chrome.action.setBadgeText({ text: '' });
  await notifyPopup(true);
});

async function updateBlockedRules() {
  let initiatorDomains = []
  for(let k in blocked) {
    if(blocked[k]) {
      initiatorDomains.push(k)
    }
  }
  let addRules;
  if(initiatorDomains.length) {
    addRules = [{
      id: 1,
      priority: 999,
      action: { type: 'block' },
      condition: {
        resourceTypes: [ 'main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket', 'webtransport', 'webbundle', 'other' ],
        domainType: 'thirdParty',
        initiatorDomains
      }
    }]
  }

  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [1], addRules })
  console.log(await chrome.declarativeNetRequest.getDynamicRules())
}

setupListener();
chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.openOptionsPage();
});