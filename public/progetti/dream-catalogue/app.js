// ── Dream Map App ──────────────────────────────────────────────────
// High-density monochromatic data visualization

// ── i18n ─────────────────────────────────────────────────────────────
let currentLang = "en";

const TRANSLATIONS = {
  it: {
    connectBy: "CONNETTI PER:",
    objects: "OGGETTI",
    people: "PERSONE",
    perspective: "PROSPETTIVA",
    size: "DIMENSIONE:",
    importance: "IMPORTANZA",
    weirdness: "BIZZARRIA",
    memory: "RICORDO",
    lucidity: "LUCIDITÀ",
    duration: "DURATA",
    connectedDreams: "SOGNI COLLEGATI",
    legendBtn: "LEGENDA MOOD",
    legendTitle: "← LEGENDA MOOD",
    dreamLabel: "SOGNO",
    dateLabel: "DATA",
    moodLabel: "MOOD",
    settingLabel: "SETTING",
    objectsLabel: "OGGETTI",
    peopleLabel: "PERSONE",
    perspectiveLabel: "PROSPETTIVA",
    musicLabel: "MUSICA",
    nodesLabel: "NODI",
    linksLabel: "LINK",
    degreeLabel: "GRADO",
    filterLabel: "FILTRO",
    untitled: "[senza titolo]",
    langSwitch: "EN",
    dsStreams: "SOGNI",
    dsLinks: "LINK",
    dsAvgImp: "AVG IMPORTANZA",
    dsAvgBiz: "AVG BIZZARRIA",
    dsAvgRic: "AVG RICORDO",
    dsTopMood: "TOP MOOD",
    dsTopSet: "TOP SETTING",
    dsPeriod: "PERIODO",
  },
  en: {
    connectBy: "CONNECT BY:",
    objects: "OBJECTS",
    people: "PEOPLE",
    perspective: "PERSPECTIVE",
    size: "SIZE:",
    importance: "IMPORTANCE",
    weirdness: "WEIRDNESS",
    memory: "MEMORY",
    lucidity: "LUCIDITY",
    duration: "DURATION",
    connectedDreams: "CONNECTED DREAMS",
    legendBtn: "MOOD LEGEND",
    legendTitle: "← MOOD LEGEND",
    dreamLabel: "DREAM",
    dateLabel: "DATE",
    moodLabel: "MOOD",
    settingLabel: "SETTING",
    objectsLabel: "OBJECTS",
    peopleLabel: "PEOPLE",
    perspectiveLabel: "PERSPECTIVE",
    musicLabel: "MUSIC",
    nodesLabel: "NODES",
    linksLabel: "LINKS",
    degreeLabel: "DEGREE",
    filterLabel: "FILTER",
    untitled: "[untitled]",
    langSwitch: "IT",
    dsStreams: "DREAMS",
    dsLinks: "LINKS",
    dsAvgImp: "AVG IMPORTANCE",
    dsAvgBiz: "AVG WEIRDNESS",
    dsAvgRic: "AVG MEMORY",
    dsTopMood: "TOP MOOD",
    dsTopSet: "TOP SETTING",
    dsPeriod: "PERIOD",
  },
};

function t(key) {
  return TRANSLATIONS[currentLang][key] || key;
}

const MOOD_TRANSLATIONS = {
  tristezza: { en: "SADNESS" },
  paura: { en: "FEAR" },
  ansia: { en: "ANXIETY" },
  angoscia: { en: "ANGUISH" },
  confusione: { en: "CONFUSION" },
  gioia: { en: "JOY" },
  hype: { en: "HYPE" },
  tranquillità: { en: "TRANQUILITY" },
  tranquillita: { en: "TRANQUILITY" },
  adrenalina: { en: "ADRENALINE" },
  ipnosi: { en: "HYPNOSIS" },
  scherzo: { en: "PLAYFULNESS" },
  erotismo: { en: "EROTICISM" },
  rabbia: { en: "RAGE" },
  schifo: { en: "DISGUST" },
  panico: { en: "PANIC" },
  dolcezza: { en: "TENDERNESS" },
  festa: { en: "CELEBRATION" },
  lite: { en: "CONFLICT" },
  vertigini: { en: "VERTIGO" },
  ricordo: { en: "NOSTALGIA" },
};

function tMood(mood) {
  if (currentLang === "en" && MOOD_TRANSLATIONS[mood]) {
    return MOOD_TRANSLATIONS[mood].en;
  }
  return mood.toUpperCase();
}

function applyLang() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.getElementById("lang-toggle").textContent = t("langSwitch");
  document.documentElement.lang = currentLang;
  updateLegend();
  if (selectedNode) showPanel(selectedNode, getConnectedIds(selectedNode));
  updateStats();
}

function getConnectedIds(d) {
  const connectedIds = new Set();
  links.forEach((l) => {
    const sid = l.source.id || l.source;
    const tid = l.target.id || l.target;
    if (sid === d.id) connectedIds.add(tid);
    if (tid === d.id) connectedIds.add(sid);
  });
  return connectedIds;
}

const MOOD_COLORS = {
  tristezza: "#2255ff",
  paura: "#bb00ff",
  ansia: "#ff5500",
  angoscia: "#ff0033",
  confusione: "#00aaff",
  gioia: "#ffffff",
  hype: "#eeff00",
  tranquillità: "#00ffcc",
  tranquillita: "#00ffcc",
  adrenalina: "#ff7700",
  ipnosi: "#cc00ff",
  scherzo: "#ffdd00",
  erotismo: "#ff0099",
  rabbia: "#ff1100",
  schifo: "#aaff00",
  panico: "#ff003c",
  dolcezza: "#ff88dd",
  festa: "#ffff00",
  lite: "#ff3300",
  vertigini: "#7700ff",
  ricordo: "#88aaff",
  default: "#888888",
};

function getMoodColor(mood) {
  const normalized = Array.isArray(mood) ? mood[0] : mood;
  return MOOD_COLORS[normalized?.toLowerCase?.() || ""] || MOOD_COLORS.default;
}

// ── Utility ─────────────────────────────────────────────────────────
function normalize(arr) {
  return arr
    .map((x) => {
      if (typeof x === "string")
        return x.trim().toLowerCase().replace(/\s+/g, " ");
      return x;
    })
    .filter((x) => x && x !== "" && x !== "?" && x !== "0");
}

function getArr(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

// ── State ────────────────────────────────────────────────────────────
let dreams = [];
let nodes = [],
  links = [];
let selectedFilter = "mood";
let selectedSize = "importanza";
let linkThreshold = 1;
let selectedNode = null;
let simulation;
let svg, g, linkG, nodeG;
let width, height;
let zoom;

const isMobile = () => window.innerWidth <= 768;

// ── Load data ────────────────────────────────────────────────────────
async function loadDreams() {
  const res = await fetch("dreams.json");
  dreams = await res.json();
  init();
}

// ── Build graph ──────────────────────────────────────────────────────
function buildGraph() {
  nodes = dreams.map((d) => ({
    id: d.id,
    dream: d,
    x: undefined,
    y: undefined,
  }));

  links = [];
  const dreamCount = dreams.length;

  for (let i = 0; i < dreamCount; i++) {
    for (let j = i + 1; j < dreamCount; j++) {
      const a = dreams[i],
        b = dreams[j];
      const shared = getSharedAttributes(a, b, selectedFilter);
      if (shared.length >= linkThreshold) {
        links.push({
          source: a.id,
          target: b.id,
          shared,
          weight: shared.length,
        });
      }
    }
  }
}

function getSharedAttributes(a, b, filter) {
  switch (filter) {
    case "mood": {
      const mA = normalize(getArr(a.mood_principale));
      const mB = normalize(getArr(b.mood_principale));
      return mA.filter((x) => mB.includes(x));
    }
    case "oggetti": {
      const oA = normalize(getArr(a.oggetti_chiave));
      const oB = normalize(getArr(b.oggetti_chiave));
      return oA.filter((x) => oB.includes(x));
    }
    case "ambientazione": {
      const aA = normalize(getArr(a.ambientazione));
      const aB = normalize(getArr(b.ambientazione));
      return aA.filter((x) => aB.includes(x));
    }
    case "persone": {
      const pA = normalize(getArr(a.persone?.tipologia));
      const pB = normalize(getArr(b.persone?.tipologia));
      return pA.filter((x) => pB.includes(x));
    }
    case "prospettiva": {
      const prA = a.prospettiva ? [a.prospettiva.trim().toLowerCase()] : [];
      const prB = b.prospettiva ? [b.prospettiva.trim().toLowerCase()] : [];
      return prA.filter((x) => prB.includes(x));
    }
    default:
      return [];
  }
}

// ── Node radius ───────────────────────────────────────────────────────
function getRadius(dream) {
  switch (selectedSize) {
    case "importanza":
      return 5 + dream.importanza_soggettiva * 0.18;
    case "bizzarria":
      return 5 + dream.bizzarria * 0.18;
    case "ricordo":
      return 5 + dream.ricordo_percentuale * 0.18;
    default:
      return 9;
  }
}

// ── Init ─────────────────────────────────────────────────────────────
function init() {
  document.getElementById("dream-count").textContent = dreams.length;
  applyLang(); // Force initial translation sweep
  buildGraph();
  setupSVG();
  startSimulation();
  // Legend toggle
  const legendToggle = document.getElementById("legend-toggle");
  const legendEl = document.getElementById("legend");
  const legendTitle = document.getElementById("legend-title");

  function openLegend() {
    legendEl.classList.add("legend-open");
    legendToggle.classList.add("legend-open");
  }
  function closeLegend() {
    legendEl.classList.remove("legend-open");
    legendToggle.classList.remove("legend-open");
  }

  legendToggle.addEventListener("click", openLegend);
  legendTitle.addEventListener("click", closeLegend);

  setupFilters();
  setupSwipeToClose();

  setupClock();
  setupTicker();
  setupDataStream();
  updateStats();
  updateLegend();
}

function setupSwipeToClose() {
  const handle = document.getElementById("panel-drag-handle");
  const panel = document.getElementById("detail-panel");
  let startY = 0,
    currentY = 0,
    dragging = false;

  handle.addEventListener(
    "touchstart",
    (e) => {
      startY = e.touches[0].clientY;
      dragging = true;
      panel.style.transition = "none";
    },
    { passive: true },
  );

  handle.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging) return;
      currentY = e.touches[0].clientY;
      const dy = Math.max(0, currentY - startY);
      panel.style.transform = `translateY(${dy}px)`;
    },
    { passive: true },
  );

  handle.addEventListener("touchend", () => {
    if (!dragging) return;
    dragging = false;
    panel.style.transition = "";
    const dy = currentY - startY;
    if (dy > 80) {
      deselectNode(); // closes panel + restores transform
    } else {
      panel.style.transform = ""; // snap back
    }
  });
}

function setupSVG() {
  const container = document.getElementById("graph-container");
  width = container.clientWidth;
  height = container.clientHeight;

  svg = d3.select("#graph-svg").attr("width", width).attr("height", height);

  zoom = d3
    .zoom()
    .scaleExtent([0.15, 8])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

  // ── SVG bloom filter ───────────────────────────────────────────
  const defs = svg.append("defs");
  const bloomFilter = defs
    .append("filter")
    .attr("id", "bloom")
    .attr("x", "-50%")
    .attr("y", "-50%")
    .attr("width", "200%")
    .attr("height", "200%");
  // Blur pass
  bloomFilter
    .append("feGaussianBlur")
    .attr("in", "SourceGraphic")
    .attr("stdDeviation", "1.8")
    .attr("result", "blur");
  // Merge blur + original for glow
  const merge = bloomFilter.append("feMerge");
  merge.append("feMergeNode").attr("in", "blur");
  merge.append("feMergeNode").attr("in", "SourceGraphic");

  g = svg.append("g");
  linkG = g.append("g").attr("class", "links");
  nodeG = g.append("g").attr("class", "nodes");

  // Initial zoom to fit
  svg.call(
    zoom.transform,
    d3.zoomIdentity.translate(width / 2, height / 2).scale(1.6),
  );
}

function startSimulation() {
  // Pre-compute degree map for gravity
  const degreeMap = {};
  nodes.forEach((n) => {
    degreeMap[n.id] = 0;
  });
  links.forEach((l) => {
    const s = l.source.id || l.source;
    const t = l.target.id || l.target;
    degreeMap[s] = (degreeMap[s] || 0) + 1;
    degreeMap[t] = (degreeMap[t] || 0) + 1;
  });

  simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance((d) => 120 - d.weight * 15)
        .strength((d) => 0.3 + d.weight * 0.1),
    )
    .force("charge", d3.forceManyBody().strength(isMobile() ? -120 : -180))
    .force("center", d3.forceCenter(0, 0))
    .force(
      "gravity",
      d3.forceRadial(0, 0, 0).strength((d) => {
        const deg = degreeMap[d.id] || 0;
        return deg <= 1 ? 0.1 : 0.025;
      }),
    )
    .force(
      "collision",
      d3.forceCollide().radius((d) => getRadius(d.dream) + 8),
    )
    .alphaDecay(isMobile() ? 0.05 : 0.0228)
    .on("tick", ticked);

  renderLinks();
  renderNodes();
}

function renderLinks() {
  const linkSel = linkG
    .selectAll(".link")
    .data(
      links,
      (d) => `${d.source.id || d.source}-${d.target.id || d.target}`,
    );

  linkSel.exit().remove();

  const linkEnter = linkSel
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("stroke-width", (d) => 0.3 + d.weight * 0.4)
    .attr("stroke-opacity", (d) => Math.min(0.8, 0.1 + d.weight * 0.2))
    .on("mouseover", function (event, d) {
      d3.select(this)
        .attr("stroke", "rgba(255,255,255,0.9)")
        .attr("stroke-width", 2);
      showLinkTooltip(event, d);
    })
    .on("mouseout", function (event, d) {
      d3.select(this)
        .attr("stroke", null)
        .attr("stroke-width", 0.3 + d.weight * 0.4);
      hideLinkTooltip();
    });

  linkG.selectAll(".link").raise();
}

let tooltip = null;

function showLinkTooltip(event, d) {
  if (!tooltip) {
    tooltip = d3
      .select("body")
      .append("div")
      .style("position", "fixed")
      .style("background", "rgba(0,0,0,0.9)")
      .style("border", "1px solid rgba(255,255,255,0.2)")
      .style("color", "rgba(255,255,255,0.8)")
      .style("font-family", "JetBrains Mono, monospace")
      .style("font-size", "8px")
      .style("padding", "6px 10px")
      .style("pointer-events", "none")
      .style("letter-spacing", "0.1em")
      .style("z-index", "999");
  }
  tooltip
    .style("display", "block")
    .style("left", event.clientX + 10 + "px")
    .style("top", event.clientY + 10 + "px")
    .html(
      `SHARED: ${d.shared.map((s) => s.toUpperCase()).join(" · ")}<br>WEIGHT: ${d.weight}`,
    );
}

function hideLinkTooltip() {
  if (tooltip) tooltip.style("display", "none");
}

function renderNodes() {
  const nodeSel = nodeG.selectAll(".node-group").data(nodes, (d) => d.id);

  nodeSel.exit().remove();

  const nodeEnter = nodeSel
    .enter()
    .append("g")
    .attr("class", "node-group")
    .call(
      d3
        .drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded),
    )
    .on("click", (event, d) => {
      event.stopPropagation();
      selectNode(d);
    });

  // Invisible hitbox (larger click target)
  nodeEnter
    .append("circle")
    .attr("class", "node-hitbox")
    .attr("r", (d) => getRadius(d.dream) + 12)
    .attr("fill", "transparent")
    .attr("stroke", "none");

  // Outer ring (mood color) — bloom applied only on desktop
  if (!isMobile()) nodeEnter.attr("filter", "url(#bloom)");

  nodeEnter
    .append("circle")
    .attr("class", "node-outer")
    .attr("r", (d) => getRadius(d.dream) + 4)
    .attr("fill", "none")
    .attr("stroke", (d) => getMoodColor(d.dream.mood_principale))
    .attr("stroke-width", 1)
    .attr("opacity", 0.7);

  // Main circle
  nodeEnter
    .append("circle")
    .attr("class", "node-circle")
    .attr("r", (d) => getRadius(d.dream))
    .attr("fill", (d) =>
      d.dream["bianco e nero"]
        ? "rgba(255,255,255,0.08)"
        : `${getMoodColor(d.dream.mood_principale)}44`,
    )
    .attr("stroke", (d) => getMoodColor(d.dream.mood_principale))
    .attr("stroke-width", 1.2);

  // ID label (inside)
  nodeEnter
    .append("text")
    .attr("class", "node-id")
    .attr("dy", "0.35em")
    .attr("fill", (d) => getMoodColor(d.dream.mood_principale))
    .attr("opacity", 0.85)
    .text((d) => String(d.id).padStart(2, "0"));

  // Title label (below)
  nodeEnter
    .append("text")
    .attr("class", "node-label")
    .attr("dy", (d) => getRadius(d.dream) + 12)
    .text((d) => d.dream.titolo || `#${d.id}`)
    .style("fill", (d) => getMoodColor(d.dream.mood_principale))
    .style("opacity", 0.9);

  // Click dismiss on svg
  svg.on("click", () => deselectNode());
}

function updateNodeSizes() {
  nodeG.selectAll(".node-group").each(function (d) {
    const r = getRadius(d.dream);
    d3.select(this).select(".node-circle").attr("r", r);
    d3.select(this)
      .select(".node-outer")
      .attr("r", r + 3);
    d3.select(this)
      .select(".node-label")
      .attr("dy", r + 12);
  });
}

function ticked() {
  linkG
    .selectAll(".link")
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);

  nodeG
    .selectAll(".node-group")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);
}

// ── Drag ──────────────────────────────────────────────────────────────
function dragStarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}
function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}
function dragEnded(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

// ── Selection ─────────────────────────────────────────────────────────
function selectNode(d) {
  selectedNode = d;

  // Highlight connected nodes
  const connectedIds = new Set();
  links.forEach((l) => {
    const sid = l.source.id || l.source;
    const tid = l.target.id || l.target;
    if (sid === d.id) connectedIds.add(tid);
    if (tid === d.id) connectedIds.add(sid);
  });

  nodeG.selectAll(".node-group").each(function (nd) {
    const isSelected = nd.id === d.id;
    const isConnected = connectedIds.has(nd.id);
    d3.select(this)
      .classed("selected", isSelected)
      .classed("faded", !isSelected && !isConnected);
    d3.select(this)
      .select(".node-circle")
      .classed("selected", isSelected)
      .classed("faded", !isSelected && !isConnected);
  });

  linkG.selectAll(".link").each(function (l) {
    const sid = l.source.id || l.source;
    const tid = l.target.id || l.target;
    const conn = sid === d.id || tid === d.id;
    d3.select(this).classed("highlighted", conn).classed("faded", !conn);
  });

  showPanel(d, connectedIds);
  updateStats();
}

function deselectNode() {
  selectedNode = null;
  nodeG.selectAll(".node-group").classed("selected faded", false);
  nodeG.selectAll(".node-circle").classed("selected faded", false);
  linkG.selectAll(".link").classed("highlighted faded", false);
  hidePanel();
  updateStats();
}

// ── Panel ─────────────────────────────────────────────────────────────
function showPanel(d, connectedIds) {
  const dream = d.dream;
  const panel = document.getElementById("detail-panel");
  panel.classList.remove("panel-hidden");
  document.getElementById("stats-panel").style.opacity = "0";
  document.getElementById("stats-panel").style.pointerEvents = "none";

  document.getElementById("panel-id").textContent =
    `${t("dreamLabel")} #${String(dream.id).padStart(3, "00")}`;
  document.getElementById("panel-title").textContent =
    dream.titolo || t("untitled").toUpperCase();
  document.getElementById("panel-date").textContent =
    `${t("dateLabel")}: ${dream.data || "?"}`;

  // Metrics
  setMetric("ricordo", dream.ricordo_percentuale, "%");
  setMetric("importanza", dream.importanza_soggettiva, "%");
  setMetric("lucidita", dream.lucidita, "%");
  setMetric("bizzarria", dream.bizzarria, "%");

  const maxDuration = 500;
  const dur = Math.min(dream.durata_percepita_min, maxDuration);
  document.getElementById("bar-durata").style.width =
    `${(dur / maxDuration) * 100}%`;
  document.getElementById("val-durata").textContent =
    `${dream.durata_percepita_min}min`;

  // Mood
  const moods = getArr(dream.mood_principale).filter((m) => m && m !== "?");
  renderSection("panel-mood", t("moodLabel"), moods, "mood-tag", "mood");

  // Ambientazione
  const ambs = normalize(getArr(dream.ambientazione));
  renderSection(
    "panel-ambientazione",
    t("settingLabel"),
    ambs,
    "tag",
    "ambientazione",
  );

  // Oggetti
  const obj = normalize(getArr(dream.oggetti_chiave));
  renderSection("panel-oggetti", t("objectsLabel"), obj, "tag", "oggetti");

  // Persone
  const personeTipologie = [];
  let personeCount = "";
  if (dream.persone) {
    if (dream.persone.quantita > 0)
      personeCount = `N=${dream.persone.quantita}`;
    normalize(getArr(dream.persone.tipologia)).forEach((tp) =>
      personeTipologie.push(tp),
    );
  }
  // Render count as plain tag + tipologie as clickable
  const personeEl = document.getElementById("panel-persone");
  if (personeTipologie.length || personeCount) {
    const countTag = personeCount
      ? `<span class="tag">${personeCount}</span>`
      : "";
    const tipoTags = personeTipologie
      .map(
        (i) =>
          `<span class="tag tag-clickable" data-filter-key="persone" data-value="${i}">${i.toUpperCase()}</span>`,
      )
      .join("");
    personeEl.innerHTML = `<div class="section-label">${t("peopleLabel")}</div>${countTag}${tipoTags}`;
    personeEl.querySelectorAll(".tag-clickable").forEach((tag) => {
      tag.addEventListener("click", () => {
        activateFilter("persone");
        setTimeout(() => highlightByValue("persone", tag.dataset.value), 50);
      });
    });
  } else {
    personeEl.innerHTML = "";
  }

  // Prospettiva
  const prosp = dream.prospettiva ? [dream.prospettiva.toLowerCase()] : [];
  renderSection(
    "panel-prospettiva",
    t("perspectiveLabel"),
    prosp,
    "tag",
    "prospettiva",
  );

  const musicEl = document.getElementById("panel-musica");
  if (dream.musica && dream.musica.trim()) {
    musicEl.innerHTML = `<div class="section-label">${t("musicLabel")}</div>
      <div class="tag">♪ ${dream.musica}</div>`;
    musicEl.style.display = "";
  } else {
    musicEl.style.display = "none";
  }

  // Flags
  const flags = [
    { label: "B&N", active: dream["bianco e nero"] },
    { label: "LUCIDO", active: dream.lucidita > 50 },
    { label: `♻ ×${dream.frequenza}`, active: dream.frequenza > 1 },
  ].filter((f) => f.active);

  const flagEl = document.getElementById("panel-flags");
  flagEl.innerHTML = flags
    .map((f) => `<span class="tag flag-tag flag-active">${f.label}</span>`)
    .join("");

  // Connections
  const connEl = document.getElementById("connections-list");
  connEl.innerHTML = "";
  connectedIds.forEach((cid) => {
    const cd = dreams.find((x) => x.id === cid);
    if (!cd) return;
    const shared = getSharedAttributes(dream, cd, selectedFilter);
    const item = document.createElement("div");
    item.className = "connection-item";
    item.innerHTML = `
      <span class="conn-id">#${String(cid).padStart(2, "0")}</span>
      <span class="conn-title">${cd.titolo || t("untitled")}</span>
      <span class="conn-shared">${shared.slice(0, 2).join(" · ")}</span>`;
    item.addEventListener("click", () => {
      const nd = nodes.find((n) => n.id === cid);
      if (nd) selectNode(nd);
    });
    connEl.appendChild(item);
  });
}

function setMetric(key, val, unit = "") {
  const safeVal = typeof val === "number" ? val : 0;
  document.getElementById(`bar-${key}`).style.width = `${safeVal}%`;
  document.getElementById(`val-${key}`).textContent = `${safeVal}${unit}`;
}

// Activate a filter key via UI (updates button state + rebuilds)
function activateFilter(key) {
  selectedFilter = key;
  document.querySelectorAll("[data-filter]").forEach((b) => {
    b.classList.toggle("active", b.dataset.filter === key);
  });
  rebuildGraph();
}

// Returns normalized values for a dream by filter key
function getDreamValues(dream, filterKey) {
  switch (filterKey) {
    case "mood":
      return normalize(getArr(dream.mood_principale));
    case "ambientazione":
      return normalize(getArr(dream.ambientazione));
    case "oggetti":
      return normalize(getArr(dream.oggetti_chiave));
    case "persone":
      return normalize(getArr(dream.persone?.tipologia));
    case "prospettiva":
      return dream.prospettiva ? [dream.prospettiva.trim().toLowerCase()] : [];
    default:
      return [];
  }
}

// Highlight nodes sharing a specific value in a specific filter dimension
function highlightByValue(filterKey, value) {
  const matchingIds = new Set();
  nodeG.selectAll(".node-group").each(function (d) {
    const vals = getDreamValues(d.dream, filterKey);
    const match = vals.includes(value.toLowerCase().trim());
    if (match) matchingIds.add(d.id);
    d3.select(this).classed("faded", !match);
    d3.select(this).select(".node-circle").classed("faded", !match);
    d3.select(this)
      .select(".node-label")
      .style("opacity", match ? 1 : null);
  });

  linkG.selectAll(".link").each(function (l) {
    const sid = l.source.id || l.source;
    const tid = l.target.id || l.target;
    const bothMatch = matchingIds.has(sid) && matchingIds.has(tid);
    d3.select(this)
      .classed("highlighted", bothMatch)
      .classed("faded", !bothMatch);
  });
}

function renderSection(elId, label, items, tagClass, filterKey) {
  const el = document.getElementById(elId);
  if (!items.length) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = `<div class="section-label">${label}</div>
    ${items
      .map((i) => {
        const clickable = filterKey ? "tag-clickable" : "";
        return `<span class="tag ${tagClass} ${clickable}" data-filter-key="${filterKey || ""}" data-value="${i}">${i.toUpperCase()}</span>`;
      })
      .join("")}`;

  if (filterKey) {
    el.querySelectorAll(".tag-clickable").forEach((tag) => {
      tag.addEventListener("click", () => {
        const val = tag.dataset.value;
        activateFilter(filterKey);
        // Highlight after rebuild settles
        setTimeout(() => highlightByValue(filterKey, val), 50);
      });
    });
  }
}

function hidePanel() {
  document.getElementById("detail-panel").classList.add("panel-hidden");
  document.getElementById("stats-panel").style.opacity = "";
  document.getElementById("stats-panel").style.pointerEvents = "";
}

// ── Filter setup ──────────────────────────────────────────────────────
function setupFilters() {
  // Connection filter
  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("[data-filter]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedFilter = btn.dataset.filter;
      rebuildGraph();
    });
  });

  // Size filter
  document.querySelectorAll("[data-size]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("[data-size]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSize = btn.dataset.size;
      updateNodeSizes();
      simulation.alpha(0.3).restart();
    });
  });

  // Lang toggle
  document.getElementById("lang-toggle").addEventListener("click", () => {
    currentLang = currentLang === "it" ? "en" : "it";
    applyLang();
  });

  // Hamburger menu (mobile)
  const menuToggle = document.getElementById("menu-toggle");
  const filterBar = document.getElementById("filter-bar");
  menuToggle.addEventListener("click", () => {
    filterBar.classList.toggle("menu-open");
    menuToggle.classList.toggle("active");
  });
  // Close menu on filter selection
  document.querySelectorAll("[data-filter], [data-size]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (isMobile()) {
        filterBar.classList.remove("menu-open");
        menuToggle.classList.remove("active");
      }
    });
  });

  // Close panel
  document
    .getElementById("close-panel")
    .addEventListener("click", deselectNode);
}

function rebuildGraph() {
  deselectNode();
  simulation.stop();
  linkG.selectAll(".link").remove();
  nodeG.selectAll(".node-group").remove();

  // Preserve positions
  const oldPositions = {};
  nodes.forEach((n) => {
    oldPositions[n.id] = { x: n.x, y: n.y };
  });

  buildGraph();

  // Restore positions
  nodes.forEach((n) => {
    if (oldPositions[n.id]) {
      n.x = oldPositions[n.id].x;
      n.y = oldPositions[n.id].y;
    }
  });

  simulation.nodes(nodes);
  simulation.force("link").links(links);
  simulation.alpha(0.5).restart();

  renderLinks();
  renderNodes();
  updateStats();
  updateLegend();
}

// ── Stats ─────────────────────────────────────────────────────────────
function updateStats() {
  document.getElementById("stat-total").innerHTML =
    `${t("nodesLabel")}: <span>${nodes.length}</span>`;
  document.getElementById("stat-links").innerHTML =
    `${t("linksLabel")}: <span>${links.length}</span>`;
  if (selectedNode) {
    const connectedLinks = links.filter(
      (l) =>
        (l.source.id || l.source) === selectedNode.id ||
        (l.target.id || l.target) === selectedNode.id,
    );
    document.getElementById("stat-selected").innerHTML =
      `${t("degreeLabel")}: <span>${connectedLinks.length}</span>`;
  } else {
    document.getElementById("stat-selected").innerHTML =
      `${t("filterLabel")}: <span>${selectedFilter.toUpperCase()}</span>`;
  }
}

// ── Legend ────────────────────────────────────────────────────────────
let activeMoodFilter = null;

function highlightByMood(mood) {
  if (activeMoodFilter === mood) {
    // Deselect
    activeMoodFilter = null;
    nodeG.selectAll(".node-group").classed("faded", false);
    nodeG.selectAll(".node-circle").classed("faded", false);
    nodeG.selectAll(".node-label").style("opacity", 0.9);
    linkG.selectAll(".link").classed("faded", false);
    document.querySelectorAll(".legend-item").forEach((el) => {
      el.classList.remove("active-mood", "faded");
    });
    return;
  }
  activeMoodFilter = mood;

  // Collect matching node IDs
  const matchingIds = new Set();
  nodeG.selectAll(".node-group").each(function (d) {
    const nodeMoods = (
      Array.isArray(d.dream.mood_principale)
        ? d.dream.mood_principale
        : [d.dream.mood_principale]
    ).map((m) => m?.toLowerCase?.() || "");
    const match = nodeMoods.includes(mood);
    if (match) matchingIds.add(d.id);
    d3.select(this).classed("faded", !match);
    d3.select(this).select(".node-circle").classed("faded", !match);
    d3.select(this)
      .select(".node-label")
      .style("opacity", match ? 1 : null);
  });

  // Highlight links between matching nodes, fade the rest
  linkG.selectAll(".link").each(function (l) {
    const sid = l.source.id || l.source;
    const tid = l.target.id || l.target;
    const bothMatch = matchingIds.has(sid) && matchingIds.has(tid);
    d3.select(this)
      .classed("highlighted", bothMatch)
      .classed("faded", !bothMatch);
  });

  document.querySelectorAll(".legend-item").forEach((el) => {
    const isSame = el.dataset.mood === mood;
    el.classList.toggle("active-mood", isSame);
    el.classList.toggle("faded", !isSame);
  });
}

function updateLegend() {
  const allMoods = new Set();
  dreams.forEach((d) =>
    getArr(d.mood_principale).forEach((m) => {
      if (m && m !== "?") allMoods.add(m.toLowerCase());
    }),
  );

  const container = document.getElementById("legend-items");
  container.innerHTML = "";
  [...allMoods].forEach((mood) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.dataset.mood = mood;
    const col = MOOD_COLORS[mood] || MOOD_COLORS.default;
    item.innerHTML = `
      <div class="legend-dot" style="background:${col};box-shadow:0 0 6px 1px ${col}88"></div>
      <span class="legend-text" style="color:${col};text-shadow:0 0 8px ${col}66">${tMood(mood)}</span>`;
    item.addEventListener("click", () => highlightByMood(mood));
    container.appendChild(item);
  });
}

// ── Clock ─────────────────────────────────────────────────────────────
function setupClock() {
  const update = () => {
    const now = new Date();
    document.getElementById("clock").textContent =
      now.toISOString().replace("T", " ").slice(0, 19) + " UTC";
  };
  update();
  setInterval(update, 1000);
}

// ── Ticker ────────────────────────────────────────────────────────────
function setupTicker() {
  const items = dreams
    .filter((d) => d.titolo)
    .map(
      (d) => `[#${String(d.id).padStart(2, "0")}] ${d.titolo.toUpperCase()}`,
    );
  const all = [...items, ...items].join("   ·   ");
  document.getElementById("ticker-content").textContent = all;
}

// ── Data stream ───────────────────────────────────────────────────────
function setupDataStream() {
  const el = document.getElementById("data-stream");

  // Compute real stats once
  const moodCount = {};
  const settingCount = {};
  let totalImportanza = 0,
    totalBizzarria = 0,
    totalRicordo = 0;
  let dates = [];

  dreams.forEach((d) => {
    getArr(d.mood_principale).forEach((m) => {
      if (m && m !== "?") moodCount[m] = (moodCount[m] || 0) + 1;
    });
    normalize(getArr(d.ambientazione)).forEach((s) => {
      settingCount[s] = (settingCount[s] || 0) + 1;
    });
    totalImportanza += d.importanza_soggettiva || 0;
    totalBizzarria += d.bizzarria || 0;
    totalRicordo += d.ricordo_percentuale || 0;
    if (d.data) dates.push(d.data);
  });

  const n = dreams.length;
  const topMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0];
  const topSetting = Object.entries(settingCount).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const avgImportanza = (totalImportanza / n).toFixed(1);
  const avgBizzarria = (totalBizzarria / n).toFixed(1);
  const avgRicordo = (totalRicordo / n).toFixed(1);
  const dateRange = dates.length
    ? `${dates[dates.length - 1]} → ${dates[0]}`
    : "—";

  const lines = [
    `GABRIELE RADICELLO`,
    `SOGNI: ${n}`,
    `LINK: ${links.length}`,
    `AVG IMPORTANZA: ${avgImportanza}%`,
    `AVG BIZZARRIA: ${avgBizzarria}%`,
    `AVG RICORDO: ${avgRicordo}%`,
    `TOP MOOD: ${topMood ? topMood[0].toUpperCase() : "—"} ×${topMood?.[1]}`,
    `TOP SETTING: ${topSetting ? topSetting[0].toUpperCase() : "—"} ×${topSetting?.[1]}`,
    `PERIODO: ${dateRange}`,
  ];

  let i = 0;
  function tick() {
    const lines = [
      `GABRIELE RADICELLO`,
      `${t("dsStreams")}: ${n}`,
      `${t("dsLinks")}: ${links.length}`,
      `${t("dsAvgImp")}: ${avgImportanza}%`,
      `${t("dsAvgBiz")}: ${avgBizzarria}%`,
      `${t("dsAvgRic")}: ${avgRicordo}%`,
      `${t("dsTopMood")}: ${topMood ? topMood[0].toUpperCase() : "—"} ×${topMood?.[1]}`,
      `${t("dsTopSet")}: ${topSetting ? topSetting[0].toUpperCase() : "—"} ×${topSetting?.[1]}`,
      `${t("dsPeriod")}: ${dateRange}`,
    ];
    el.textContent = lines[i % lines.length];
    i++;
  }
  tick();
  setInterval(tick, 2000);
}

// ── Start ─────────────────────────────────────────────────────────────
window.addEventListener("resize", () => {
  const container = document.getElementById("graph-container");
  width = container.clientWidth;
  height = container.clientHeight;
  svg.attr("width", width).attr("height", height);
  simulation.force("center", d3.forceCenter(0, 0));
  simulation.alpha(0.1).restart();
});

loadDreams();
