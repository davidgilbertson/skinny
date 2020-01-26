const CSS_FILE_NAME = 'skinny.css';

const ACTION_TYPES = {
  CHANGE_PAGE_STATUS: 'CHANGE_PAGE_STATUS',
  SET_ICON_STATUS: 'SET_ICON_STATUS',
};

const ACTIONS = {
  TOGGLE: 'TOGGLE',
  SET_FROM_STORAGE: 'SET_FROM_STORAGE',
};

const ICON_STATUSES = {
  ON: 'ON',
  OFF: 'OFF',
};

const loadSkinny = () => {
  // The css has already been added
  if (document.getElementById(CSS_FILE_NAME)) return;

  const link = document.createElement('link');
  link.href = chrome.extension.getURL(CSS_FILE_NAME);
  link.id = CSS_FILE_NAME;
  link.type = 'text/css';
  link.rel = 'stylesheet';

  const head = document.querySelector('head');

  // In case this runs before head exists.
  if (head) head.appendChild(link);

  chrome.runtime.sendMessage({
    type: ACTION_TYPES.SET_ICON_STATUS,
    payload: ICON_STATUSES.ON,
  });
};

const unloadSkinny = () => {
  const cssNode = document.getElementById(CSS_FILE_NAME);

  // This could be called when the thing's already unloaded
  if (cssNode) cssNode.remove();

  chrome.runtime.sendMessage({
    type: ACTION_TYPES.SET_ICON_STATUS,
    payload: ICON_STATUSES.OFF,
  });
};

const changeSkinnyStatus = action => {
  const host = document.location.host;
  const storage = chrome.storage.sync;

  storage.get(host, data => {
    let doMakeSkinny;

    if (action === ACTIONS.SET_FROM_STORAGE) {
      doMakeSkinny = !!data[host];
    } else if (action === ACTIONS.TOGGLE) {
      doMakeSkinny = !data[host];

      // When not in incognito mode, update storage
      if (!chrome.extension.inIncognitoContext) {
        if (doMakeSkinny) {
          storage.set({[host]: true});
        } else {
          storage.remove(host);
        }
      }
    } else {
      throw Error(`Skinny extension: ${action} is not a valid action`);
    }

    if (doMakeSkinny) {
      loadSkinny();
    } else {
      unloadSkinny();
    }
  });
};

chrome.runtime.onMessage.addListener(({type, payload}) => {
  if (type === ACTION_TYPES.CHANGE_PAGE_STATUS) {
    changeSkinnyStatus(payload);
  }
});

// Entry point when the file loads on each page.
changeSkinnyStatus(ACTIONS.SET_FROM_STORAGE);
