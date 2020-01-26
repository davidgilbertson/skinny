var host = document.location.host;
var storage = chrome.storage.sync;

var CSS_FILE_NAME = 'skinny.css';

function loadCSS() {
  if (document.getElementById(CSS_FILE_NAME)) {//the css has already been added
    return;
  }
  var link = document.createElement('link');
  link.href = chrome.extension.getURL(CSS_FILE_NAME);
  link.id = CSS_FILE_NAME;
  link.type = 'text/css';
  link.rel = 'stylesheet';
  var head = document.getElementsByTagName('head')[0];
  if (head) { //in case this runs before head exists. hmmm.
    head.appendChild(link);
  }
}

function unloadCSS(CSS_FILE) {
  var cssNode = document.getElementById(CSS_FILE);
  if (cssNode) { //this could be called when the thing's already unloaded
    cssNode.parentNode.removeChild(cssNode);
  }
}

function addOrRemoveCSS(opt) {
  storage.get(host, function(data) {
    if ((data[host] && !opt.toggle) || (!data[host] && opt.toggle)) {
      if (opt.toggle && !chrome.extension.inIncognitoContext) {
        var hostObj = {};
        hostObj[host] = true;
        storage.set(hostObj);
      }

      loadCSS();

      chrome.runtime.sendMessage({status: 'on'});
    } else {
      if (opt.toggle) {
        storage.remove(host);
      }

      unloadCSS();

      chrome.runtime.sendMessage({status: 'off'});
    }
  });
}

chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
  if (req.action === 'addOrRemoveCSS') {
    addOrRemoveCSS({toggle: req.toggle});
  }
});

//Entry point when the file loads on each page.
addOrRemoveCSS({toggle: false});
