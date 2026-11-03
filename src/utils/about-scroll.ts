/** Keep the sticky model's text exclusion current, including momentum scrolling. */
export function bindMobileReflow(reflow: () => void) {
  let frame: number | null = null;
  let settleTimer: ReturnType<typeof setTimeout> | null = null;

  const requestReflow = () => {
    if (window.innerWidth >= 768 || frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      reflow();
    });
  };

  const onMovement = () => {
    requestReflow();
    if (settleTimer !== null) clearTimeout(settleTimer);
    // Some mobile browsers deliver the final sticky position after touchend.
    settleTimer = setTimeout(() => {
      settleTimer = null;
      requestReflow();
    }, 80);
  };

  const events = ['scroll', 'scrollend', 'touchmove', 'touchend', 'touchcancel'];
  const options = { passive: true, capture: true };
  for (const event of events) window.addEventListener(event, onMovement, options);
  const viewport = window.visualViewport;
  viewport?.addEventListener('scroll', onMovement, options);
  viewport?.addEventListener('resize', onMovement, options);

  return () => {
    for (const event of events) window.removeEventListener(event, onMovement, options);
    viewport?.removeEventListener('scroll', onMovement, options);
    viewport?.removeEventListener('resize', onMovement, options);
    if (frame !== null) cancelAnimationFrame(frame);
    if (settleTimer !== null) clearTimeout(settleTimer);
  };
}
