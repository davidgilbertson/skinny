function sendMsgToTab(msgObj, callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, msgObj);
  });
}

function turnOn() {
  chrome.browserAction.setTitle({title: 'Make this site fat again'});
  chrome.browserAction.setIcon({path: 'icon_16_on.png'});
}
function turnOff() {
  chrome.browserAction.setTitle({title: 'Make this site skinny'});
  chrome.browserAction.setIcon({path: 'icon_16_off.png'});
}

//Events for when the extension button is clicked.
chrome.browserAction.onClicked.addListener(function(tab) {
  sendMsgToTab({action: 'addOrRemoveCSS', toggle: true});
});


//Events for when a tab is switched to.
chrome.tabs.onActivated.addListener(function(info) {
  turnOff(); //resets to allow for blank pages
  sendMsgToTab({action: 'addOrRemoveCSS', toggle: false});
});

chrome.tabs.onCreated.addListener(function(tab) {
  turnOff(); //resets to allow for blank pages
});

chrome.runtime.onMessage.addListener(function(req, sender, res) {
  if (req.status === 'on') {
    turnOn();
  }
  if (req.status === 'off') {
    turnOff();
  }
});