// Keep the world-space anchor separate from the animated model transform.
export function explosionFrame(elapsed, random = Math.random) {
  const progress = Math.min(1, elapsed / 1.5);
  return {
    scale: Math.max(0, 1 - progress * 1.5),
    x: (random() - 0.5) * 0.2,
    y: progress,
    z: (random() - 0.5) * 0.2,
    done: elapsed >= 1.5
  };
}

export function recycleZ(z, cameraZ, spacing, rows) {
  const span = spacing * rows;
  while (z > cameraZ + spacing) z -= span;
  while (z < cameraZ - span + spacing) z += span;
  return z;
}
