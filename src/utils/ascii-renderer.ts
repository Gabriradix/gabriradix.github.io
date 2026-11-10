const ramp = ' .:-=+*#%@';
const maxCells = 12_000;
const shades = 20;
const opaqueBlack = new Uint32Array(new Uint8Array([0, 0, 0, 255]).buffer)[0];

/** Cache glyph rasterization and spatial waves; only time-dependent values change per frame. */
export function createAsciiRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const atlas = document.createElement('canvas');
  const atlasCtx = atlas.getContext('2d');
  if (!atlasCtx) return null;

  let columns = 0;
  let rows = 0;
  const cellWidth = 13;
  const cellHeight = 18;
  let viewportWidth = 0;
  let viewportHeight = 0;
  let renderScale = 1;
  let image: ImageData;
  let pixels = new Uint32Array(0);
  let sprites: { offsets: Int32Array; colors: Uint32Array }[] = [];
  let radialSin = new Float32Array(0);
  let radialCos = new Float32Array(0);
  let noiseSin = new Float32Array(0);
  let noiseCos = new Float32Array(0);
  let rippleSin = new Float32Array(0);
  let rippleCos = new Float32Array(0);
  let columnWave = new Float32Array(0);
  let rowWave = new Float32Array(0);
  let lastMouseX = NaN;
  let lastMouseY = NaN;

  const resize = (width: number, height: number) => {
    if (viewportWidth === width && viewportHeight === height && columns) return;
    viewportWidth = width;
    viewportHeight = height;
    renderScale = Math.max(1, Math.sqrt(width * height / (13 * 18 * maxCells)));
    canvas.width = Math.floor(width / renderScale);
    canvas.height = Math.floor(height / renderScale);
    columns = Math.floor(canvas.width / cellWidth);
    rows = Math.floor(canvas.height / cellHeight);
    image = ctx.createImageData(canvas.width, canvas.height);
    pixels = new Uint32Array(image.data.buffer);
    const count = columns * rows;
    radialSin = new Float32Array(count);
    radialCos = new Float32Array(count);
    noiseSin = new Float32Array(count);
    noiseCos = new Float32Array(count);
    rippleSin = new Float32Array(count);
    rippleCos = new Float32Array(count);
    columnWave = new Float32Array(columns);
    rowWave = new Float32Array(rows);
    lastMouseX = lastMouseY = NaN;

    for (let r = 0, i = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++, i++) {
        const radial = Math.hypot(c, r) * 0.04;
        const noise = c * 2.3 + r * 3.7;
        radialSin[i] = Math.sin(radial);
        radialCos[i] = Math.cos(radial);
        noiseSin[i] = Math.sin(noise);
        noiseCos[i] = Math.cos(noise);
      }
    }

    atlas.width = ramp.length * cellWidth;
    atlas.height = shades * cellHeight;
    atlasCtx.font = `${cellHeight - 2}px monospace`;
    atlasCtx.textBaseline = 'top';
    for (let shade = 0; shade < shades; shade++) {
      const brightness = shade * 8;
      atlasCtx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness + 10}, 0.85)`;
      for (let glyph = 1; glyph < ramp.length; glyph++) {
        atlasCtx.fillText(ramp[glyph], glyph * cellWidth, shade * cellHeight);
      }
    }
    const atlasPixels = atlasCtx.getImageData(0, 0, atlas.width, atlas.height).data;
    sprites = [];
    for (let shade = 0; shade < shades; shade++) {
      for (let glyph = 0; glyph < ramp.length; glyph++) {
        const offsets: number[] = [];
        const rgba: number[] = [];
        for (let y = 0; y < cellHeight; y++) {
          for (let x = 0; x < cellWidth; x++) {
            const source = ((shade * cellHeight + y) * atlas.width + glyph * cellWidth + x) * 4;
            const alpha = atlasPixels[source + 3] / 255;
            if (!alpha) continue;
            offsets.push(y * canvas.width + x);
            rgba.push(Math.round(atlasPixels[source] * alpha),
              Math.round(atlasPixels[source + 1] * alpha),
              Math.round(atlasPixels[source + 2] * alpha), 255);
          }
        }
        sprites.push({ offsets: new Int32Array(offsets), colors: new Uint32Array(new Uint8Array(rgba).buffer) });
      }
    }
  };

  const render = (timestamp: number, mouseX: number, mouseY: number) => {
    // Quantize to the original grid: pointer events within one cell need no new distance field.
    const mouseColumn = Math.floor(mouseX / renderScale / cellWidth);
    const mouseRow = Math.floor(mouseY / renderScale / cellHeight);
    if (mouseColumn !== lastMouseX || mouseRow !== lastMouseY) {
      lastMouseX = mouseColumn;
      lastMouseY = mouseRow;
      for (let r = 0, i = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++, i++) {
          const distance = Math.hypot(c - mouseColumn, r - mouseRow);
          const amplitude = Math.exp(-distance * 0.07) * 0.8;
          rippleSin[i] = Math.sin(distance * 0.3) * amplitude;
          rippleCos[i] = Math.cos(distance * 0.3) * amplitude;
        }
      }
    }

    const time = timestamp * 0.001;
    const radialTimeSin = Math.sin(time * 2);
    const radialTimeCos = Math.cos(time * 2);
    const rippleTimeSin = Math.sin(time * 6);
    const rippleTimeCos = Math.cos(time * 6);
    const noiseTimeSin = Math.sin(time * 10) * 0.08;
    const noiseTimeCos = Math.cos(time * 10) * 0.08;
    for (let c = 0; c < columns; c++) columnWave[c] = Math.sin(c * 0.12 - time * 2.5);
    for (let r = 0; r < rows; r++) rowWave[r] = Math.cos(r * 0.08 + time * 1.5);

    // Compose cached glyph pixels in memory, then upload once. Thousands of canvas API
    // calls (including drawImage per glyph) are much slower on software-backed canvases.
    pixels.fill(opaqueBlack);
    for (let r = 0, i = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++, i++) {
        const z = (columnWave[c] * rowWave[r]
          + radialSin[i] * radialTimeCos - radialCos[i] * radialTimeSin) * 0.4
          + rippleSin[i] * rippleTimeCos - rippleCos[i] * rippleTimeSin
          + noiseSin[i] * noiseTimeCos + noiseCos[i] * noiseTimeSin;
        const glyph = Math.max(0, Math.min(ramp.length - 1, Math.floor((z + 1) * 0.5 * ramp.length)));
        if (!glyph) continue;
        const shade = Math.max(0, Math.min(shades - 1, Math.round((80 + z * 40) / 8)));
        const sprite = sprites[shade * ramp.length + glyph];
        const origin = r * cellHeight * canvas.width + c * cellWidth;
        for (let p = 0; p < sprite.offsets.length; p++) {
          pixels[origin + sprite.offsets[p]] = sprite.colors[p];
        }
      }
    }
    ctx.putImageData(image, 0, 0);
  };

  return { resize, render };
}

/** One scheduled frame at a time, capped at 60 Hz even on high-refresh displays. */
export function createAsciiPlayback(draw: (time: number) => void,
  requestFrame = requestAnimationFrame, cancelFrame = cancelAnimationFrame) {
  let frame: number | null = null;
  let lastTime = -Infinity;
  let running = false;
  const interval = 1000 / 60;
  const tick = (time: number) => {
    frame = null;
    if (!running) return;
    const elapsed = time - lastTime;
    if (elapsed >= interval - 0.5) {
      draw(time);
      // Retain fractional intervals on 144 Hz displays without catching up after a stall.
      lastTime = elapsed < interval * 2 ? lastTime + interval : time;
    }
    if (running) frame = requestFrame(tick);
  };
  return {
    start() {
      if (running) return;
      running = true;
      lastTime = -Infinity;
      frame = requestFrame(tick);
    },
    stop() {
      running = false;
      if (frame !== null) cancelFrame(frame);
      frame = null;
    },
  };
}
