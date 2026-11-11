type Point = { x: number; y: number };
const gold = '#efbf48';
const dreamColors = ['#FF5A5F', '#2EE6D6', '#9B7BFF', '#FF9F1C'];
const duration = 4000;
const cleanups = new Set<() => void>();
const mix = (a: number, b: number, amount: number) => a + (b - a) * amount;
const smooth = (value: number) => { const x = Math.min(1, Math.max(0, value)); return x * x * (3 - 2 * x); };

export const setupAnimatedStudies = () => {
  document.querySelectorAll<HTMLElement>('[data-animated-study]').forEach(root => {
    if (root.dataset.bound) return;
    const canvas = root.querySelector('canvas');
    const context = canvas?.getContext('2d');
    const stage = root.querySelector<HTMLElement>('.study-stage');
    if (!canvas || !context || !stage) return;
    root.dataset.bound = 'true';
    const oracle = root.dataset.animatedStudy === 'oracle';
    // A separate mask surface lets overlapping holes form a union, without
    // the filled intersections produced by a single even-odd path.
    const mask = document.createElement('canvas');
    const maskContext = mask.getContext('2d')!;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const events = new AbortController();
    const words = Array.from(root.querySelectorAll<HTMLElement>('.study-word'));
    const targets = words.filter(word => Number(word.dataset.target) >= 0);
    const features = Array.from(root.querySelectorAll<HTMLElement>('[data-feature]'));
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-study-step]'));
    const play = root.querySelector<HTMLButtonElement>('[data-study-play]')!;
    let width = 0, height = 0, pixelRatio = 0;
    let currentStage = 0, elapsed = 0, phaseTime = 0, frozenTime = 0;
    let playing = !motion.matches, visible = false, frame = 0, previous = 0, lastRender = 0;
    let radius = 28, opacity = .85, receiptVersion = 0;
    let previousTimecode = '';

    const positionElement = (element: HTMLElement, point: Point) => {
      element.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
    };
    const line = (from: Point, to: Point, color: string, dashed = false) => {
      context.beginPath();
      context.strokeStyle = color;
      context.lineWidth = 1;
      context.setLineDash(dashed ? [4, 5] : []);
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
      context.setLineDash([]);
    };
    const node = (point: Point, size: number, color: string, glow = false) => {
      context.save();
      if (glow) { context.shadowColor = color; context.shadowBlur = 18; }
      context.beginPath();
      context.arc(point.x, point.y, size, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
      context.restore();
    };
    const wordPosition = (index: number, time: number): Point => {
      const cellWidth = (width - 24) / 7;
      const cellHeight = (height - 140) / 5;
      return {
        x: 12 + (index % 7 + .5) * cellWidth + Math.sin(time + index * 1.7) * Math.min(5, cellWidth * .07),
        y: 57 + (Math.floor(index / 7) + .5) * cellHeight + Math.cos(time * .7 + index) * 2,
      };
    };
    const updateReceipt = async () => {
      const version = ++receiptVersion;
      const utc = new Date().toISOString();
      root.querySelectorAll('[data-receipt-time]').forEach(element => { element.textContent = `UTC ${utc}`; });
      const configuration = JSON.stringify({
        study: 'oracle-01', phrase: ['Trust the path you cannot see.', 'Segui il sentiero che non vedi.'],
        slots: targets.map(word => words.indexOf(word)), radius, opacity, frozenTime, utc,
      });
      try {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(configuration));
        if (version !== receiptVersion || !root.isConnected) return;
        const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
        root.dataset.provenance = hash;
        root.querySelectorAll<HTMLElement>('[data-receipt-hash]').forEach(element => {
          element.textContent = `${element.lang === 'it' ? 'Provenienza studio' : 'Study provenance'} / SHA-256 ${hash.slice(0, 16)}`;
          element.title = hash;
        });
      } catch {
        root.querySelectorAll<HTMLElement>('[data-receipt-hash]').forEach(element => {
          element.textContent = element.lang === 'it' ? 'Hash non disponibile in questo contesto' : 'Hash unavailable in this context';
        });
      }
    };
    const renderOracle = () => {
      const time = motion.matches ? 0 : currentStage === 3 ? frozenTime : phaseTime;
      const positions = words.map((_, index) => wordPosition(index, time));
      if (currentStage === 2 || currentStage === 3) {
        maskContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        maskContext.clearRect(0, 0, width, height);
        maskContext.fillStyle = gold;
        maskContext.fillRect(8, 40, width - 16, height - 124);
        maskContext.globalCompositeOperation = 'destination-out';
        targets.forEach(word => {
          const point = positions[words.indexOf(word)];
          maskContext.beginPath();
          maskContext.arc(point.x, point.y, radius, 0, Math.PI * 2);
          maskContext.fill();
        });
        maskContext.globalCompositeOperation = 'source-over';
        context.save();
        context.globalAlpha = opacity;
        context.drawImage(mask, 0, 0, width, height);
        context.restore();
        if (currentStage === 3) {
          const path = targets.map(word => positions[words.indexOf(word)]);
          path.slice(1).forEach((point, index) => line(path[index], point, '#fafafa99', true));
        }
      }
      words.forEach((word, index) => {
        const target = Number(word.dataset.target);
        const point = positions[index];
        const scatter = currentStage === 1 && playing && !motion.matches ? smooth(elapsed / 950) : 1;
        const start = { x: width / 2 + (target - 2.5) * Math.min(60, width / 8), y: height / 2 };
        positionElement(word, { x: mix(start.x, point.x, scatter), y: mix(start.y, point.y, scatter) });
        word.style.fontSize = `${Math.max(10, Math.min(16, (width - 24) / 7 / 4.5))}px`;
        word.style.opacity = String(target >= 0 ? 1 : currentStage < 2 ? scatter * .75 : (1 - opacity) * .25);
        word.style.textShadow = target >= 0 && currentStage >= 2 ? `0 0 10px ${gold}, 0 0 18px ${gold}88` : 'none';
      });
    };
    const renderPipeline = () => {
      const center = { x: width / 2, y: height * .46 };
      const time = motion.matches ? 0 : phaseTime;
      const clusterCenter = { x: width * .64, y: height * .43 };
      const cluster = Array.from({ length: 16 }, (_, index) => {
        const angle = index * 2.39996;
        const distance = 17 + Math.sqrt(index) * Math.min(19, width * .03);
        return {
          x: clusterCenter.x + Math.cos(angle) * distance,
          y: clusterCenter.y + Math.sin(angle) * distance * .72,
        };
      });
      if (currentStage < 2) {
        const pulse = motion.matches || !playing ? 0 : Math.sin(time * 2.5);
        context.strokeStyle = '#2EE6D644';
        context.beginPath();
        context.arc(center.x, center.y, 24 + pulse * 4, 0, Math.PI * 2);
        context.stroke();
        node(center, 9 + pulse, '#2EE6D6', true);
        const label = root.querySelector<HTMLElement>('.study-node-label')!;
        positionElement(label, { x: center.x, y: center.y + 42 });
        if (currentStage === 1) {
          const reachX = Math.min(width * .29, 190);
          const reachY = height * .25;
          features.forEach((feature, index) => {
            const angle = -Math.PI / 2 + index * Math.PI * 2 / 5;
            const end = { x: center.x + Math.cos(angle) * reachX, y: center.y + Math.sin(angle) * reachY };
            line(center, end, dreamColors[index % 4] + '99');
            node(end, 3, dreamColors[index % 4]);
            positionElement(feature, { x: end.x, y: end.y + (Math.sin(angle) > 0 ? 18 : -17) });
          });
        }
        return;
      }
      cluster.forEach((point, index) => {
        if (index > 0) line(cluster[Math.floor((index - 1) / 2)], point, '#404040');
        node(point, 3 + index % 4, dreamColors[index % 4]);
      });
      const target = { x: width * .5, y: height * .48 };
      const progress = currentStage === 3 ? 1 : Math.min(1, elapsed / 3000);
      const attraction = motion.matches ? 1 : 1 - Math.exp(-5 * progress) * Math.cos(progress * 7);
      const record = { x: mix(width * .18, target.x, attraction), y: mix(height * .57, target.y, attraction) };
      [0, 3, 8].forEach(index => line(record, cluster[index], currentStage === 3 ? '#2EE6D680' : '#2EE6D64D', currentStage === 2));
      if (currentStage === 2) {
        context.save();
        context.setLineDash([3, 5]);
        context.lineDashOffset = -time * 12;
        line(record, clusterCenter, '#2EE6D6', true);
        context.restore();
      }
      node(record, 9, '#2EE6D6', true);
    };
    const render = () => {
      if (!width || !height) return;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.fillStyle = '#000';
      context.fillRect(0, 0, width, height);
      context.strokeStyle = '#171717';
      context.lineWidth = 1;
      for (let x = 24; x < width; x += 40) {
        for (let y = 48; y < height - 20; y += 40) {
          context.beginPath(); context.moveTo(x - 2, y); context.lineTo(x + 2, y);
          context.moveTo(x, y - 2); context.lineTo(x, y + 2); context.stroke();
        }
      }
      if (oracle) renderOracle(); else renderPipeline();
      const timecode = `00:${String(Math.floor((currentStage * duration + elapsed) / 1000)).padStart(2, '0')}`;
      if (timecode !== previousTimecode) {
        root.querySelectorAll('[data-study-time]').forEach(element => { element.textContent = timecode; });
        previousTimecode = timecode;
      }
    };
    const updateUI = () => {
      root.dataset.stage = String(currentStage);
      root.dataset.playing = String(playing);
      play.setAttribute('aria-pressed', String(playing));
      root.querySelector<HTMLElement>('[data-play-label]')!.hidden = playing;
      root.querySelector<HTMLElement>('[data-pause-label]')!.hidden = !playing;
      buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === currentStage)));
      root.querySelectorAll<HTMLElement>('[data-study-caption]').forEach((caption, index) => {
        caption.hidden = index !== currentStage;
        caption.setAttribute('aria-hidden', String(index !== currentStage));
      });
    };
    const changeStage = (next: number) => {
      currentStage = (next + 4) % 4;
      elapsed = 0;
      if (currentStage === 3 && oracle) { frozenTime = phaseTime; void updateReceipt(); }
      updateUI();
    };
    const tick = (now: number) => {
      frame = 0;
      const delta = previous ? Math.min(now - previous, 80) : 0;
      previous = now;
      elapsed += delta;
      if (currentStage !== 3) phaseTime += delta / 1000;
      if (elapsed >= duration) changeStage(currentStage + 1);
      if (pixelRatio !== window.devicePixelRatio) resize();
      // Keep drawing near 60 fps on 120/144 Hz displays, without slowing time.
      const frameInterval = 1000 / 60;
      if (!lastRender || now - lastRender >= frameInterval - .5) {
        render();
        const overshoot = Math.max(0, now - lastRender - frameInterval);
        lastRender = now - (overshoot % frameInterval);
      }
      schedule();
    };
    const schedule = () => {
      if (playing && visible && !document.hidden && root.isConnected) {
        if (!frame) frame = requestAnimationFrame(tick);
      } else { cancelAnimationFrame(frame); frame = 0; previous = 0; lastRender = 0; }
    };
    const resize = () => {
      width = stage.clientWidth;
      height = stage.clientHeight;
      pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      mask.width = canvas.width;
      mask.height = canvas.height;
      render();
    };
    const chooseStage = (index: number) => {
      playing = false;
      changeStage(index);
      schedule(); render();
    };
    buttons.forEach((button, index) => button.addEventListener('click', () => chooseStage(index), { signal: events.signal }));
    root.querySelector('[data-study-prev]')!.addEventListener('click', () => chooseStage(currentStage - 1), { signal: events.signal });
    root.querySelector('[data-study-next]')!.addEventListener('click', () => chooseStage(currentStage + 1), { signal: events.signal });
    play.addEventListener('click', () => { playing = !playing; updateUI(); schedule(); render(); }, { signal: events.signal });
    root.addEventListener('keydown', event => {
      if (!(event.target instanceof HTMLButtonElement)) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); chooseStage(currentStage + (event.key === 'ArrowRight' ? 1 : -1));
        buttons[currentStage].focus();
      }
    }, { signal: events.signal });
    if (oracle) {
      const adjustments = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-oracle-adjust]'));
      const updateAdjustments = () => {
        adjustments.forEach(button => {
          const isRadius = button.dataset.oracleAdjust === 'radius';
          const value = isRadius ? radius : Math.round(opacity * 100);
          button.disabled = Number(button.dataset.adjustment) < 0 ? value <= (isRadius ? 16 : 40) : value >= (isRadius ? 42 : 100);
        });
      };
      adjustments.forEach(button => {
        button.addEventListener('click', () => {
          const isRadius = button.dataset.oracleAdjust === 'radius';
          const adjustment = Number(button.dataset.adjustment);
          if (isRadius) radius = Math.min(42, Math.max(16, radius + adjustment));
          else opacity = Math.min(100, Math.max(40, Math.round(opacity * 100) + adjustment)) / 100;
          document.querySelectorAll(`[data-oracle-output="${button.dataset.oracleAdjust}"]`).forEach(output => {
            output.textContent = `${isRadius ? radius : Math.round(opacity * 100)}${isRadius ? ' px' : '%'}`;
          });
          updateAdjustments();
          chooseStage(2);
        }, { signal: events.signal });
      });
      updateAdjustments();
    }
    const intersection = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; schedule();
    });
    intersection.observe(root);
    const dimensions = new ResizeObserver(resize);
    dimensions.observe(stage);
    window.addEventListener('resize', resize, { signal: events.signal });
    document.addEventListener('visibilitychange', schedule, { signal: events.signal });
    motion.addEventListener('change', () => {
      if (motion.matches) playing = false;
      updateUI(); schedule(); render();
    }, { signal: events.signal });
    updateUI(); resize();
    const cleanup = () => {
      cancelAnimationFrame(frame); events.abort(); intersection.disconnect(); dimensions.disconnect();
      delete root.dataset.bound; cleanups.delete(cleanup);
    };
    cleanups.add(cleanup);
  });
};

document.addEventListener('astro:before-swap', () => { cleanups.forEach(cleanup => cleanup()); });
