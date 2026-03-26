/**
 * Localization Compare Demo - Slider Logic
 * Handles: drag-to-compare slider, synchronized scrolling, reset button
 */
(function () {
  'use strict';

  // ---- Elements ----
  const wrapper    = document.getElementById('compare-wrapper');
  const paneLeft   = document.getElementById('pane-left');
  const paneRight  = document.getElementById('pane-right');
  const handle     = document.getElementById('slider-handle');
  const iframeEn   = document.getElementById('iframe-en');
  const iframeJa   = document.getElementById('iframe-ja');
  const syncToggle = document.getElementById('sync-toggle');
  const resetBtn   = document.getElementById('reset-btn');

  let isDragging = false;
  let currentRatio = 0.5;
  let syncScrollEnabled = true;
  let scrollSyncLock = false;

  // ---- Slider Position ----
  function setSliderPosition(ratio) {
    ratio = Math.max(0.05, Math.min(0.95, ratio));
    currentRatio = ratio;
    const pct = ratio * 100;

    paneLeft.style.width  = pct + '%';
    paneRight.style.width = (100 - pct) + '%';
    handle.style.left     = pct + '%';
  }

  // ---- Drag Events ----
  function onPointerDown(e) {
    isDragging = true;
    handle.classList.add('dragging');
    document.body.style.cursor = 'ew-resize';

    // Prevent iframe from stealing pointer events
    iframeEn.style.pointerEvents = 'none';
    iframeJa.style.pointerEvents = 'none';

    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging) return;

    const rect = wrapper.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX) || 0) - rect.left;
    const ratio = x / rect.width;

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
    const rect = wrapper.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    setSliderPosition(x / rect.width);
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchend', onPointerUp);

  // ---- Synchronized Scrolling ----
  function setupScrollSync() {
    function waitForIframe(iframe) {
      return new Promise(function (resolve) {
        function tryResolve() {
          try {
            var doc = iframe.contentDocument || iframe.contentWindow.document;
            if (doc && doc.readyState === 'complete') {
              resolve(iframe.contentWindow);
              return;
            }
          } catch (err) {
            // Cross-origin - skip
          }
          // Not ready yet, wait for load event
          iframe.addEventListener('load', function onLoad() {
            iframe.removeEventListener('load', onLoad);
            try {
              resolve(iframe.contentWindow);
            } catch (err) { /* cross-origin */ }
          });
        }
        tryResolve();
      });
    }

    Promise.all([waitForIframe(iframeEn), waitForIframe(iframeJa)])
      .then(function (wins) {
        var winEn = wins[0];
        var winJa = wins[1];

        winEn.addEventListener('scroll', function () {
          if (!syncScrollEnabled || scrollSyncLock) return;
          scrollSyncLock = true;

          var docEn = winEn.document.documentElement;
          var maxScrollEn = docEn.scrollHeight - docEn.clientHeight;
          if (maxScrollEn <= 0) { scrollSyncLock = false; return; }
          var ratio = winEn.scrollY / maxScrollEn;

          var docJa = winJa.document.documentElement;
          var maxScrollJa = docJa.scrollHeight - docJa.clientHeight;
          winJa.scrollTo({ top: ratio * maxScrollJa });

          requestAnimationFrame(function () { scrollSyncLock = false; });
        });

        winJa.addEventListener('scroll', function () {
          if (!syncScrollEnabled || scrollSyncLock) return;
          scrollSyncLock = true;

          var docJa = winJa.document.documentElement;
          var maxScrollJa = docJa.scrollHeight - docJa.clientHeight;
          if (maxScrollJa <= 0) { scrollSyncLock = false; return; }
          var ratio = winJa.scrollY / maxScrollJa;

          var docEn = winEn.document.documentElement;
          var maxScrollEn = docEn.scrollHeight - docEn.clientHeight;
          winEn.scrollTo({ top: ratio * maxScrollEn });

          requestAnimationFrame(function () { scrollSyncLock = false; });
        });
      });
  }

  setupScrollSync();

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
