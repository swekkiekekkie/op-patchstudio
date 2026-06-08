let showRotateOverlayGlobal: ((zoomCallback?: () => void) => void) | null = null;

export function registerOverlayControl(showOverlay: (zoomCallback?: () => void) => void): void {
  showRotateOverlayGlobal = showOverlay;
}

export function triggerRotateOverlay(zoomCallback?: () => void): void {
  if (showRotateOverlayGlobal) {
    showRotateOverlayGlobal(zoomCallback);
  } else {
    zoomCallback?.();
  }
}
