/**
 * Localization Compare Demo - Slider Logic
 * Handles: drag-to-compare slider, synchronized scrolling, reset button
 */
(function () {
  'use strict';

  // ---- Elements ----
  var wrapper    = document.getElementById('compare-wrapper');
  var paneLeft   = document.getElementById('pane-left');
  var paneRight  = document.getElementById('pane-right');
  var handle     = document.getElementById('slider-handle');
  var iframeEn   = document.getElementById('iframe-en');
  var iframeJa   = document.getElementById('iframe-ja');
  var syncToggle = document.getElementById('sync-toggle');
  var resetBtn   = document.getElementById('reset-btn');

  var isDragging = false;
  var currentRatio = 0.5;
  var syncScrollEnabled = true;
  var scrollSyncLock = false;
  var iframeWindows = { en: null, ja: null };

  // ---- Slider Position ----
  function setSliderPosition(ratio) {
    ratio = Math.max(0.05, Math.min(0.95, ratio));
    currentRatio = ratio;
    var pct = ratio * 100;

    paneLeft.style.width  = pct + '%';
    paneRight.style.width = (100 - pct) + '%';
    handle.style.left     = pct + '%';
  }

  // ---- Drag Events ----
  function onPointerDown(e) {
    isDragging = true;
    handle.classList.add('dragging');
    document.body.style.cursor = 'ew-resize';

    // Prevent iframe from stealing pointer events during drag
    iframeEn.style.pointerEvents = 'none';
    iframeJa.style.pointerEvents = 'none';

    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging) return;

    var rect = wrapper.getBoundingClientRect();
    var x = (e.clientX || (e.touches && e.touches[0].clientX) || 0) - rect.left;
    var ratio = x / rect.width;

    setSliderPosition(ratio);
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;
    handle.classList.remove('dragging');
    document.body.style.cursor = '';

    iframeEn.style.pointerEvents = '';
    iframeJa.style.pointerEvents = '';
  }

  // Mouse
  handle.addEventListener('mousedown', onPointerDown);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerUp);

  // Touch
  handle.addEventListener('touchstart', onPointerDown, { passive: false });
  document.addEventListener('touchmove', function (e) {
    if (!isDragging) return;
    var rect = wrapper.getBoundingClientRect();
    var x = e.touches[0].clientX - rect.left;
    setSliderPosition(x / rect.width);
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchend', onPointerUp);

  // ---- Helper: wait for iframe load ----
  function waitForIframe(iframe) {
    return new Promise(function (resolve) {
      function check() {
        try {
          var doc = iframe.contentDocument || iframe.contentWindow.document;
          if (doc && doc.readyState === 'complete') {
            resolve(iframe.contentWindow);
            return;
          }
        } catch (err) { /* cross-origin */ }

        iframe.addEventListener('load', function onLoad() {
          iframe.removeEventListener('load', onLoad);
          try { resolve(iframe.contentWindow); }
          catch (err) { /* cross-origin */ }
        });
      }
      check();
    });
  }

  // ---- Sync Scroll Helper ----
  function syncFrom(source, target) {
    if (!syncScrollEnabled || scrollSyncLock) return;
    scrollSyncLock = true;

    try {
      var srcDoc = source.document.documentElement;
      var tgtDoc = target.document.documentElement;
      var maxSrc = srcDoc.scrollHeight - srcDoc.clientHeight;
      var maxTgt = tgtDoc.scrollHeight - tgtDoc.clientHeight;

      if (maxSrc > 0 && maxTgt > 0) {
        var ratio = source.scrollY / maxSrc;
        target.scrollTo(0, Math.round(ratio * maxTgt));
      }
    } catch (err) { /* cross-origin */ }

    // Release lock after a short delay to prevent infinite feedback loop
    setTimeout(function () { scrollSyncLock = false; }, 30);
  }

  // ---- Forwarding wheel events from parent page to iframes ----
  // When user scrolls over the wrapper area (not directly inside an iframe),
  // forward the scroll to the appropriate iframe
  function forwardWheelToIframe(e) {
    e.preventDefault();

    var rect = wrapper.getBoundingClientRect();
    var mouseX = e.clientX - rect.left;
    var splitPoint = rect.width * currentRatio;

    // Determine which iframe the mouse is over
    var primaryWin = mouseX < splitPoint ? iframeWindows.en : iframeWindows.ja;
    if (!primaryWin) return;

    try {
      primaryWin.scrollBy({ top: e.deltaY, behavior: 'auto' });
    } catch (err) { /* cross-origin */ }
  }

  wrapper.addEventListener('wheel', forwardWheelToIframe, { passive: false });

  // ---- Setup Synchronized Scrolling ----
  function setupScrollSync() {
    Promise.all([waitForIframe(iframeEn), waitForIframe(iframeJa)])
      .then(function (wins) {
        var winEn = wins[0];
        var winJa = wins[1];
        iframeWindows.en = winEn;
        iframeWindows.ja = winJa;

        // Listen for scroll events inside each iframe
        winEn.addEventListener('scroll', function () {
          syncFrom(winEn, winJa);
        });

        winJa.addEventListener('scroll', function () {
          syncFrom(winJa, winEn);
        });

        // Also propagate wheel events happening inside iframes
        // so that scrolling over one iframe also scrolls the other
        try {
          winEn.document.addEventListener('wheel', function (e) {
            // Let the iframe handle its own scroll (don't preventDefault)
            // The scroll event listener above will handle sync
          }, { passive: true });
        } catch (err) { /* cross-origin */ }

        try {
          winJa.document.addEventListener('wheel', function (e) {
            // Same - let iframe handle it naturally
          }, { passive: true });
        } catch (err) { /* cross-origin */ }
      });
  }

  setupScrollSync();

  // ---- Touch scroll support for iframes ----
  // On touch devices, scrolling inside iframes should work natively
  // The sync scroll listeners will handle synchronization

  // ---- Controls ----
  syncToggle.addEventListener('change', function () {
    syncScrollEnabled = this.checked;
  });

  resetBtn.addEventListener('click', function () {
    setSliderPosition(0.5);
  });

  // ---- Keyboard ----
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') {
      setSliderPosition(currentRatio - 0.02);
    } else if (e.key === 'ArrowRight') {
      setSliderPosition(currentRatio + 0.02);
    } else if (e.key === 'Home') {
      setSliderPosition(0.5);
    }
  });

  // ---- Initial Position ----
  setSliderPosition(0.5);

})();
