const storage = chrome.storage.sync;

const IDS = {
  LEFT_BAR: 'LEFT_BAR',
  RIGHT_BAR: 'RIGHT_BAR',
  STYLE_EL: 'STYLE_EL'
};

const ACTION_TYPES = {
  CHANGE_PAGE_STATUS: 'CHANGE_PAGE_STATUS',
  SET_ICON_STATUS: 'SET_ICON_STATUS'
};

const ACTIONS = {
  TOGGLE: 'TOGGLE',
  SET_FROM_STORAGE: 'SET_FROM_STORAGE'
};

const ICON_STATUSES = {
  ON: 'ON',
  OFF: 'OFF'
};

const START_WIDTH = 1200;
const BAR_TOP = 0.05;
const BAR_HEIGHT = 1 - BAR_TOP * 2;
const GRAB_COLOR = `rgba(38, 50, 56, 0.6)`;

const state = {
  currentWidth: null,
  observer: null,
  leftEl: null,
  rightEl: null,
  draggingEl: null,
  skinnyIsLoaded: false,
};

/** @param {?number} width */
const setBodyWidth = width => {
  // We use 'auto' instead of '' to the observer doesn't trigger
  document.body.style.width = width ? `${width}px` : 'auto';
};

const stripPx = (string = '') => Number(string.replace('px', ''));

/**
 * Gets the data object for the current page
 * @return {Promise<{beSkinny: boolean, [width]: number}>}
 */
const getHostData = async () =>
  new Promise(resolve => {
    const { host } = document.location;

    storage.get(host, data => {
      // The Chrome storage doesn't return the data 'at' the key. It returns
      // the data where the only key is the provided key. Which is dumb.
      let result = data[host];

      // Prior versions saved a boolean, so I gotta convert that
      if (typeof result === 'boolean') {
        result = {
          beSkinny: result
        };
      }

      resolve(result || { beSkinny: false });
    });
  });

const setHostData = data => {
  // Never in incognito mode
  if (chrome.extension.inIncognitoContext) return;

  storage.set({
    [document.location.host]: data
  });
};

const handleMouseMove = e => {
  e.preventDefault(); // stop text selection

  // TODO (davidg): maybe I can say that if e.ctrlKey is pressed, then only move that one side
  //  else make it symmetric.
  if (state.draggingEl === state.leftEl) {
    state.currentWidth = window.innerWidth - e.pageX * 2;
  } else if (state.draggingEl === state.rightEl) {
    state.currentWidth = window.innerWidth - (window.innerWidth - e.pageX) * 2;
  }

  // Make it a bit wider, this makes the dragging bar align with the mouse.
  // It gets thrown out a bit by a scrollbar but that's fine.
  state.currentWidth += state.draggingEl.offsetWidth;

  if (state.currentWidth < 100) return; // Because that would be silly

  // Snap to full width when close
  if (state.currentWidth > window.innerWidth - 40) {
    state.currentWidth = null;
  }

  setBodyWidth(state.currentWidth);
};

const handleMouseUp = () => {
  setBarsStyle({ background: '' });

  if (document.body.style.width) {
    getHostData().then(hostData => {
      hostData.width = stripPx(document.body.style.width);
      setHostData(hostData);
    });
  }

  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
};

const setBarsStyle = styleProps => {
  Object.assign(state.leftEl.style, styleProps);
  Object.assign(state.rightEl.style, styleProps);
};

const handleMouseDown = e => {
  state.draggingEl = e.target;
  setBarsStyle({ background: GRAB_COLOR });

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
};

const setBarsTopAndHeight = () => {
  setBarsStyle({
    top: `${window.innerHeight * BAR_TOP + window.scrollY}px`,
    height: `${window.innerHeight * BAR_HEIGHT}px`
  });
};

const makeBar = styleProps => {
  const el = document.createElement('div');
  el.className = 'skinny-ext-bar';

  Object.assign(
    el.style,
    styleProps,
    {
      top: `${window.innerHeight * BAR_TOP}px`,
      height: `${window.innerHeight * BAR_HEIGHT}px`,
    },
  );

  document.body.append(el);

  return el;
};

const addBarsToPage = () => {
  state.leftEl = makeBar({ left: '0px' });
  state.rightEl = makeBar({ right: '0px' });

  state.leftEl.addEventListener('mousedown', handleMouseDown);
  state.rightEl.addEventListener('mousedown', handleMouseDown);

  window.addEventListener('scroll', setBarsTopAndHeight);
  window.addEventListener('resize', setBarsTopAndHeight);

};

const injectStyles = () => {
  // Can't use classes since some sites do el.className = 'blah' and wipe our classes away.
  // So we style based on data-* attribute on <html>, probably still gets trashed on some sites
  // Triple for specificity
  document.documentElement.dataset.skinny1 = 'skinny1';
  document.documentElement.dataset.skinny2 = 'skinny2';
  document.documentElement.dataset.skinny3 = 'skinny3';

  // Some sites (firebase.google.com) will wipe out body styles. We make sure width is added/back
  state.observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'style' &&
        !document.body.style.width
      ) {
        setBodyWidth(state.currentWidth);
      }
    });
  });

  state.observer.observe(document.body, {attributes: true});

  // Add a style element and set the stylesheet
  // We add CSS via JS because it's faster than loading a CSS file. This reduces flicker
  const styleEl = document.createElement('style');
  styleEl.id = IDS.STYLE_EL;
  document.head.append(styleEl);

  // language=CSS (for Intellij syntax highlighting)
  [
    `
      html[data-skinny1=skinny1][data-skinny2=skinny2][data-skinny3=skinny3] body {
        margin: 0 auto !important;
        max-width: 100% !important;
        transform: translate(0) !important;
        box-sizing: border-box !important;
      }
    `,
    `
      .skinny-ext-bar {
        position: fixed;
        width: 8px;
        background: rgba(38, 50, 56, 0);
        border: 1px solid rgba(236, 239, 241, 0);
        border-radius: 8px;
        cursor: ew-resize;
        transition: background 200ms, border 200ms;
        z-index: 2147483647;
      }
    `,
    `
      .skinny-ext-bar:hover {
        background: rgba(38, 50, 56, 0.4);
        border: 1px solid rgba(236, 239, 241, 0.4);
      }
    `
  ]
    .reverse()
    .forEach(rule => styleEl.sheet.insertRule(rule));
};

// Yes, this is massively over-engineered.
const wait = async testFunction => new Promise(resolve => {
  const runTestFunction = () => {
    const result = testFunction();

    if (result) {
      resolve(result);
    } else {
      requestAnimationFrame(runTestFunction)
    }
  };

  runTestFunction();
});

/** @return {void} */
const loadSkinny = async (startWidth = START_WIDTH) => {
  state.skinnyIsLoaded = true;

  // This code can run before the body is parsed, so we wait
  await wait(() => document.body);

  state.currentWidth = startWidth;

  if (document.getElementById(IDS.STYLE_EL)) return;

  injectStyles();

  setBodyWidth(state.currentWidth);

  addBarsToPage();

  /*  --  Send a message to the page to change the extension icon  --  */
  chrome.runtime.sendMessage({
    type: ACTION_TYPES.SET_ICON_STATUS,
    payload: ICON_STATUSES.ON
  });
};

/**
 * Remove all our code from the page.
 * This could be called when the page has already unloaded,
 * so we don't assume anything exists
 *
 * @return {void}
 */
const unloadSkinny = () => {
  if (!state.skinnyIsLoaded) return;

  state.skinnyIsLoaded = false;

  if (state.observer) state.observer.disconnect();

  setBodyWidth(null);

  const styleNode = document.getElementById(IDS.STYLE_EL);
  if (styleNode) styleNode.remove();

  if (state.leftEl) state.leftEl.remove();
  if (state.rightEl) state.rightEl.remove();

  window.removeEventListener('scroll', setBarsTopAndHeight);
  window.removeEventListener('resize', setBarsTopAndHeight);

  chrome.runtime.sendMessage({
    type: ACTION_TYPES.SET_ICON_STATUS,
    payload: ICON_STATUSES.OFF
  });
};

/**
 * Toggles the skinny state, or sets it from storage (on page load)
 *
 * @param {string} action
 * @return {void}
 */
const changeSkinnyStatus = async action => {
  let hostData = await getHostData();

  if (action === ACTIONS.TOGGLE) {
    hostData.beSkinny = !hostData.beSkinny;

    setHostData(hostData);
  }

  if (hostData.beSkinny) {
    loadSkinny(hostData.width);
  } else {
    unloadSkinny();
  }
};

chrome.runtime.onMessage.addListener(({ type, payload }) => {
  if (type === ACTION_TYPES.CHANGE_PAGE_STATUS) {
    changeSkinnyStatus(payload);
  }
});

changeSkinnyStatus(ACTIONS.SET_FROM_STORAGE);
