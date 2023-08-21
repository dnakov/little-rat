let badgeNum = 0;
let ports = {};
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

function debounce(func, delay) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

async function notifyPopup() {
  const data = await getExtensions();
  Object.values(ports).forEach(port => port.postMessage({ type: 'init', data }));
}

const d_notifyPopup = debounce(notifyPopup, 1000);

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
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((e) => {
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

      if(!ports.popup && !muted?.[k]) {
        badgeNum += 1;
        updateBadge();
      }
      d_notifyPopup();
    }
  });
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
    extensions[id] = { 
      name,
      id,
      numRequestsAllowed: 0,
      numRequestsBlocked: 0,
      reqUrls: {},
      icon: icons?.[icons?.length - 1]?.url,
      blocked: blocked[id],
      muted: muted[id],
      enabled,
      ...(requests[id] || {})
    };
  }
  return extensions;
}




chrome.runtime.onConnect.addListener(async (port) => {
  const name = port.name;
  port.onDisconnect.addListener(() => {
    delete ports[name];
  })
  ports[name] = port;
  if(name === 'popup') {
    badgeNum = 0;
    chrome.action.setBadgeText({ text: '' });
  }
  
  port.onMessage.addListener(async (message) => {
    if (message.type === 'reset') {
      requests = {};
      await chrome.storage.local.set({ requests });
    }
    await notifyPopup();
  });

  port.onMessage.addListener(async (message) => {
    if (message.type === 'toggleMute') {
      muted[message.data.id] = !muted[message.data.id];
      chrome.storage.local.set({ muted });
    } else if (message.type === 'toggleBlock') {
      blocked[message.data.id] = !blocked[message.data.id];
      chrome.storage.local.set({ blocked });
      updateBlockedRules();
    } else if (message.type === 'toggleExt') {
      const ext = await chrome.management.get(message.data.id)
      await chrome.management.setEnabled(message.data.id, !ext.enabled);
    }
    await notifyPopup();
  });

  await notifyPopup();
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
}

setupListener();
chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.openOptionsPage();
});