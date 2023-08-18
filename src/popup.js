import { updateList } from './ext-list.js';
import { IS_STORE } from './constants.js';

async function toggleMuteExt(e) {
  const id = e.target.id.replace('mute-', '');
  await chrome.runtime.sendMessage({ type: 'toggleMute', data: { id } });  
  await updateList();
}

async function toggleBlockExt(e) {
  const id = e.target.id.replace('block-', '');
  await chrome.runtime.sendMessage({ type: 'toggleBlock', data: { id } });  
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
    }
  })
  document.getElementById('reset').addEventListener('click', 
    () => chrome.runtime.sendMessage({ type: 'reset' }));
  document.getElementById('request-perm').addEventListener('click', 
    async () => {
      const granted = await chrome.permissions.request({permissions: ['declarativeNetRequestFeedback', 'management']})
      if(granted) {
        chrome.runtime.reload();
      }
    });
  const hasPerm = await chrome.permissions.contains({permissions: ['declarativeNetRequestFeedback']})
  if(!hasPerm) {
    document.querySelector('.permissions').style.visibility = 'visible';
  }
});

(async () => {
  await chrome.runtime.connect();
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'init') {
      updateList(message.data);
    }
  })
})()