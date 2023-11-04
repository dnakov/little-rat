import { updateList } from './ext-list.js';
import { IS_STORE } from './constants.js';

const port = chrome.runtime.connect(undefined, { name: location.search?.includes('dashboard') ? 'dashboard' : 'popup' });
let theme;

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

async function toggleBlockExtUrl(e) {
  const id = e.target.id.replace('block-ext-url-', '').split(' ');
  const urlInfo = id[1].split('|');
  await port.postMessage({ type: 'toggleBlockExtUrl', data: { extId: urlInfo[1], method: id[0], url: urlInfo[0] } });
  await updateList();
}

async function toggleExt(e) {
  const id = e.target.id.replace('toggle-', '');
  await port.postMessage({ type: 'toggleExt', data: { id } });
  await updateList();
}

document.addEventListener('DOMContentLoaded', async () => {
  setTheme();
  if (IS_STORE) {
    document.body.classList.add('is-store');
    document.getElementById('reset').style.visibility = 'hidden';
  }
  document.getElementById('exts-body').addEventListener('click', (e) => {
    if (e.target.id.startsWith('mute-')) {
      toggleMuteExt(e);
      e.preventDefault();
    } else if (e.target.id.startsWith('block-ext-url-')) {
      toggleBlockExtUrl(e);
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
  document.getElementById('theme').addEventListener('click', toggleTheme);

  document.getElementById('request-perm').addEventListener('click',
    async () => {
      const granted = await chrome.permissions.request({ permissions: ['management'] })
      if (granted) {
        chrome.runtime.reload();
      }
    });
  const hasPerm = await chrome.permissions.contains({ permissions: ['management'] })
  if (!hasPerm) {
    document.querySelector('.permissions').style.visibility = 'visible';
  }
});

port.onMessage.addListener((message) => {
  if (message.type === 'init') {
    updateList(message.data);
  }
})

function setTheme(theme) {
  theme = theme || localStorage.theme;
  if (!theme) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    } else {
      theme = 'light';
    }
    localStorage.theme = theme;
  }
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function toggleTheme() {
  localStorage.theme = localStorage.theme === 'dark' ? 'light' : 'dark';
  setTheme(theme);
}

