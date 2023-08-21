import { updateList } from './ext-list.js';
import { IS_STORE } from './constants.js';

const port = chrome.runtime.connect(undefined, { name: location.search?.includes('dashboard') ? 'dashboard' : 'popup' });

async function toggleMuteExt(e) {
  const id = e.target.id.replace('mute-', '');
  await port.postMessage({ type: 'toggleMute', data: { id } });  
  await updateList();
}

async function toggleBlockExt(e) {
  const id = e.target.id.replace('block-', '');
  await port.postMessage({ type: 'toggleBlock', data: { id } });  
  await updateList();
}

async function toggleExt(e) {
  const id = e.target.id.replace('toggle-', '');
  await port.postMessage({ type: 'toggleExt', data: { id } });  
  await updateList();
}

document.addEventListener('DOMContentLoaded', async () => {
  if(IS_STORE) {
    document.body.classList.add('is-store');
    document.getElementById('reset').style.visibility = 'hidden';
  }  
  document.getElementById('exts-body').addEventListener('click', (e) => {
    if(e.target.id.startsWith('mute-')) {
      toggleMuteExt(e);
      e.preventDefault();
    } else if (e.target.id.startsWith('block-')) {
      toggleBlockExt(e);
      e.preventDefault();
    } else if (e.target.id.startsWith('toggle-')) {
      toggleExt(e);
      e.preventDefault();
    }
  })
  document.getElementById('reset').addEventListener('click', 
    () => port.postMessage({ type: 'reset' }));
  document.getElementById('request-perm').addEventListener('click', 
    async () => {
      const granted = await chrome.permissions.request({permissions: ['management']})
      if(granted) {
        chrome.runtime.reload();
      }
    });
  const hasPerm = await chrome.permissions.contains({permissions: ['management']})
  if(!hasPerm) {
    document.querySelector('.permissions').style.visibility = 'visible';
  }
});

port.onMessage.addListener((message) => {
  if (message.type === 'init') {
    updateList(message.data);
  }
})

