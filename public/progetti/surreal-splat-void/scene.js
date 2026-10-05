import * as pc from 'playcanvas';
import { explosionFrame, recycleZ } from './splat-motion.js';

const canvas = document.getElementById('application-canvas');
let app;
let ready = false;
let active = false;
let failed = false;
const report = (detail) => {
  if (failed && !detail.error) return;
  window.splatStatus = detail;
  window.dispatchEvent(new CustomEvent('splat-status', { detail }));
};

async function initialize() {
  app = new pc.Application(canvas, {
    mouse: new pc.Mouse(canvas),
    keyboard: new pc.Keyboard(window),
    graphicsDeviceOptions: { antialias: false, alpha: false }
  });
  app.autoRender = false;
  app.maxDeltaTime = 0.05;
  app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
  const syncResolution = () => {
    app.resizeCanvas();
    app.setCanvasResolution(pc.RESOLUTION_FIXED, Math.max(1, canvas.clientWidth), Math.max(1, canvas.clientHeight));
    app.renderNextFrame = ready && active && !document.hidden;
  };
  window.addEventListener('resize', syncResolution);
  syncResolution();

  const camera = new pc.Entity('Camera');
  camera.addComponent('camera', { clearColor: new pc.Color(0, 0, 0), fov: 60, nearClip: 0.1, farClip: 100 });
  app.root.addChild(camera);
  camera.setPosition(0, 1.6, 0);
  const eulers = new pc.Vec3();
  const force = new pc.Vec3();
  const forward = new pc.Vec3();
  const right = new pc.Vec3();
  const direction = new pc.Vec3();
  let dragging = false;
  canvas.addEventListener('pointerdown', event => { dragging = event.button === 0; });
  window.addEventListener('pointerup', () => { dragging = false; });
  window.addEventListener('blur', () => { dragging = false; });

  app.mouse.on(pc.EVENT_MOUSEMOVE, (event) => {
    if (!active || (document.pointerLockElement !== canvas && !dragging)) return;
    eulers.x = pc.math.clamp(eulers.x - event.dy * 0.2, -89, 89);
    eulers.y -= event.dx * 0.2;
  });
  const lockPointer = () => {
    if (!active || document.pointerLockElement === canvas) return;
    try { canvas.requestPointerLock()?.catch(() => {}); } catch {}
  };
  canvas.addEventListener('click', lockPointer);
  let pointerWasLocked = false;
  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === canvas;
    if (pointerWasLocked && !locked && window.isExperienceStarted) {
      window.dispatchEvent(new Event('splat-return-to-menu'));
    }
    pointerWasLocked = locked;
  });
  const syncActivity = () => {
    active = ready && window.isExperienceStarted && !document.hidden;
    app.autoRender = active;
    if (!active) document.getElementById('sound')?.pause();
    else document.getElementById('sound')?.play().catch(() => {});
  };
  window.addEventListener('splat-experience', syncActivity);
  document.addEventListener('visibilitychange', syncActivity);

  const names = ['macs', 'chitarra', 'emac', 'teschione', 'torre'];
  let loaded = 0;
  const assets = await Promise.all(names.map(name => new Promise((resolve, reject) => {
    const asset = new pc.Asset(name, 'gsplat', { url: `assets/${name}.sog`, filename: `${name}.sog` });
    const timeout = setTimeout(() => {
      asset.off('load');
      asset.off('error');
      reject(new Error(`Tempo di caricamento esaurito per ${name}.sog`));
    }, 90000);
    asset.once('load', () => {
      clearTimeout(timeout);
      report({ ready: false, loaded: ++loaded, total: names.length });
      resolve(asset);
    });
    asset.once('error', error => {
      clearTimeout(timeout);
      reject(new Error(`Impossibile caricare ${name}.sog: ${error}`));
    });
    app.assets.add(asset);
    app.assets.load(asset);
  })));
  const [macs, chitarra, emac, teschione, torreAsset] = assets;

  const createItem = (asset, y, scale) => {
    const anchor = new pc.Entity(asset.name);
    const motion = new pc.Entity('Disintegration');
    const model = new pc.Entity('Model');
    app.root.addChild(anchor);
    anchor.addChild(motion);
    motion.addChild(model);
    model.addComponent('gsplat', { asset });
    model.setLocalEulerAngles(0, 0, 180);
    model.setLocalScale(scale, scale, scale);
    return { anchor, motion, baseY: y, elapsed: 0, exploded: false, axis: new pc.Vec3() };
  };
  const corridor = Array.from({ length: 16 }, (_, i) => {
    const item = createItem(macs, 0, 1);
    item.side = i % 2 === 0 ? -1 : 1;
    item.anchor.setPosition(item.side * 3, 0, -4 * Math.floor(i / 2));
    item.anchor.setEulerAngles(0, item.side === 1 ? 0 : 180, 0);
    return item;
  });
  const interior = [
    [chitarra, -2, 0.33], [emac, -2, 0.15], [teschione, -1, 0.25],
    [teschione, -1, 0.25], [chitarra, -2, 0.33], [emac, -2, 0.15]
  ].map(([asset, y, scale], i) => {
    const item = createItem(asset, y, scale);
    item.anchor.setPosition((Math.random() - 0.5) * 2.5, y, -10 - i * 8);
    item.anchor.setEulerAngles(0, Math.random() * 360, 0);
    return item;
  });
  const tower = createItem(torreAsset, -2, 5);
  const resetMotion = item => {
    item.exploded = false;
    item.elapsed = 0;
    item.motion.setLocalPosition(0, 0, 0);
    item.motion.setLocalEulerAngles(0, 0, 0);
    item.motion.setLocalScale(1, 1, 1);
  };

  const updateItem = (item, spacing, rows, dt, cameraPosition, cameraForward) => {
    const anchor = item.anchor;
    const position = anchor.getPosition();
    const nextZ = recycleZ(position.z, cameraPosition.z, spacing, rows);
    if (nextZ !== position.z) {
      resetMotion(item);
      anchor.setPosition(item.side ? item.side * 3 : (Math.random() - 0.5) * 2.5, item.baseY, nextZ);
    }
    const distance = cameraPosition.distance(anchor.getPosition());
    direction.sub2(anchor.getPosition(), cameraPosition).normalize();
    anchor.enabled = distance <= 35 && (cameraForward.dot(direction) > -0.2 || distance <= 5);
    if (distance < 2.5 && !item.exploded) {
      item.exploded = true;
      item.axis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    }
    if (item.exploded) {
      item.elapsed += dt;
      const frame = explosionFrame(item.elapsed);
      item.motion.setLocalScale(frame.scale, frame.scale, frame.scale);
      item.motion.setLocalPosition(frame.x, frame.y, frame.z);
      item.motion.rotateLocal(item.axis.x * 1200 * dt, item.axis.y * 1200 * dt, item.axis.z * 1200 * dt);
      if (frame.done) {
        resetMotion(item);
        // The furthest row will enter view as the camera advances.
        anchor.setPosition(item.side ? item.side * 3 : (Math.random() - 0.5) * 2.5, item.baseY, cameraPosition.z - spacing * (rows - 1));
      }
    } else if (!item.side && anchor.enabled) anchor.rotate(0, 45 * dt, 0);
  };

  app.on('update', dt => {
    if (!active) return;
    camera.setLocalEulerAngles(eulers.x, eulers.y, 0);
    if (document.hasFocus()) {
      forward.copy(camera.forward); forward.y = 0; forward.normalize();
      right.copy(camera.right); right.y = 0; right.normalize();
      force.set(0, 0, 0);
      if (app.keyboard.isPressed(pc.KEY_W) || app.keyboard.isPressed(pc.KEY_UP)) force.add(forward);
      if (app.keyboard.isPressed(pc.KEY_S) || app.keyboard.isPressed(pc.KEY_DOWN)) force.sub(forward);
      if (app.keyboard.isPressed(pc.KEY_A) || app.keyboard.isPressed(pc.KEY_LEFT)) force.sub(right);
      if (app.keyboard.isPressed(pc.KEY_D) || app.keyboard.isPressed(pc.KEY_RIGHT)) force.add(right);
      if (force.lengthSq() > 0) {
        const position = camera.getPosition().clone().add(force.normalize().mulScalar(4 * dt));
        position.x = pc.math.clamp(position.x, -3, 3);
        camera.setPosition(position);
      }
    }
    const cameraPosition = camera.getPosition();
    const cameraForward = camera.forward;
    tower.anchor.setPosition(cameraPosition.x, -2, cameraPosition.z + 50);
    tower.anchor.rotate(0, 15 * dt, 0);
    direction.sub2(tower.anchor.getPosition(), cameraPosition).normalize();
    tower.anchor.enabled = cameraForward.dot(direction) > 0;
    corridor.forEach(item => updateItem(item, 4, 8, dt, cameraPosition, cameraForward));
    interior.forEach(item => updateItem(item, 8, 6, dt, cameraPosition, cameraForward));
  });
  app.start();
  ready = true;
  report({ ready: true, loaded: names.length, total: names.length });
  syncActivity();
  window.addEventListener('pagehide', () => { app.destroy(); }, { once: true });
}

initialize().catch(error => {
  failed = true;
  console.error(error);
  if (app) app.autoRender = false;
  report({ ready: false, error: 'Caricamento non riuscito. Ricarica la pagina per riprovare.' });
});
