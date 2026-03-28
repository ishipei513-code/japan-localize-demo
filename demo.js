/**
 * Localization Compare Demo - Slider Logic
 * Architecture: Two layers (EN + JA) stacked in the same page.
 * EN layer is position:absolute with clip-path for the left side.
 * JA layer flows normally and sets the page scroll height, clipped for the right side.
 * The page scrolls natively via the body - no special scroll containers needed.
 */
(function () {
  'use strict';

  var viewport  = document.getElementById('compare-viewport');
  var layerEn   = document.getElementById('layer-en');
  var layerJa   = document.getElementById('layer-ja');
  var handle    = document.getElementById('slider-handle');
  var resetBtn  = document.getElementById('reset-btn');

  var isDragging = false;
  var currentRatio = 0.5;

  // ---- Set Slider Position ----
  function setSliderPosition(ratio) {
    ratio = Math.max(0, Math.min(1, ratio));
    currentRatio = ratio;
    document.documentElement.style.setProperty('--slider-pct', (ratio * 100) + '%');
  }

  // ---- Keep EN layer height synced with JA layer ----
  function syncLayerHeights() {
    if (layerJa && layerEn) {
      layerEn.style.height = layerJa.offsetHeight + 'px';
    }
  }

  if (window.ResizeObserver) {
    new ResizeObserver(syncLayerHeights).observe(layerJa);
  }
  window.addEventListener('resize', syncLayerHeights);
  window.addEventListener('load', syncLayerHeights);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      setTimeout(syncLayerHeights, 100);
    });
  }

  // ---- Drag Events ----
  function onPointerDown(e) {
    isDragging = true;
    handle.classList.add('dragging');
    document.body.style.cursor = 'ew-resize';
    e.preventDefault();
  }

  function getXRatio(e) {
    var rect = viewport.getBoundingClientRect();
    var x = (e.clientX || (e.touches && e.touches[0].clientX) || 0) - rect.left;
    return x / rect.width;
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    setSliderPosition(getXRatio(e));
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;
    handle.classList.remove('dragging');
    document.body.style.cursor = '';
  }

  // Mouse
  handle.addEventListener('mousedown', onPointerDown);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerUp);

  // Touch
  handle.addEventListener('touchstart', onPointerDown, { passive: false });
  document.addEventListener('touchmove', function (e) {
    if (!isDragging) return;
    setSliderPosition(getXRatio(e));
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchend', onPointerUp);

  // ---- Controls ----
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

  // ---- Initial ----
  setSliderPosition(0.5);

})();
