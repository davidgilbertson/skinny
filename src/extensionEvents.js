const sendMsgToTab = msgObj => {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, msgObj);
  });
};

const turnOn = () => {
  chrome.browserAction.setTitle({title: 'Make this site fat again'});
  chrome.browserAction.setIcon({path: 'icon_16_on.png'});
};

const turnOff = () => {
  chrome.browserAction.setTitle({title: 'Make this site skinny'});
  chrome.browserAction.setIcon({path: 'icon_16_off.png'});
};

// Events for when the extension button is clicked.
chrome.browserAction.onClicked.addListener(() => {
  sendMsgToTab({type: 'CHANGE_PAGE_STATUS', payload: 'TOGGLE'});
});

// Events for when a tab is switched to.
chrome.tabs.onActivated.addListener(() => {
  turnOff(); // Resets to allow for blank pages
  sendMsgToTab({type: 'CHANGE_PAGE_STATUS', payload: 'SET_FROM_STORAGE'});
});

chrome.tabs.onCreated.addListener(() => {
  turnOff(); // Resets to allow for blank pages
});

chrome.runtime.onMessage.addListener(({type, payload}) => {
  if (type === 'SET_ICON_STATUS') {
    if (payload === 'ON') turnOn();
    if (payload === 'OFF') turnOff();
  }
});
