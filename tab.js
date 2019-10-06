var host = document.location.host;
var storage = chrome.storage.sync;

function loadCSS(file) {
  if (document.getElementById(file)) {//the css has already been added
    return;
  }
  var link = document.createElement('link');
  link.href = chrome.extension.getURL(file);
  link.id = file;
  link.type = 'text/css';
  link.rel = 'stylesheet';
  var head = document.getElementsByTagName('head')[0];
  if (head) { //in case this runs before head exists. hmmm.
    head.appendChild(link);
  }
}

function unloadCSS(file) {
  var cssNode = document.getElementById(file);
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

      loadCSS('skinny-default.css');
      if (host.match(/wikipedia.org/)) loadCSS('skinny-wiki.css');

      chrome.runtime.sendMessage({status: 'on'});
    } else {
      if (opt.toggle) {
        storage.remove(host);
      }

      unloadCSS('skinny-default.css');
      if (host.match(/wikipedia.org/)) unloadCSS('skinny-wiki.css');

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
