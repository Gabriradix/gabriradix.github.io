import { writeFile } from 'node:fs/promises';

// Dedicated, text-free hero artwork and localized previews of the current studies.
const gold = '#efbf48';
const colors = ['#FF5A5F', '#2EE6D6', '#9B7BFF', '#FF9F1C'];
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const rect = (x, y, width, height, fill = '#000', stroke = '#262626') => `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${stroke}"/>`;
const line = (a, b, color = '#404040', dashed = false) => `<path d="M${a.x} ${a.y}L${b.x} ${b.y}" fill="none" stroke="${color}" stroke-width="1.4"${dashed ? ' stroke-dasharray="5 7"' : ''}/>`;
const circle = (point, radius, fill, stroke = 'none') => `<circle cx="${point.x}" cy="${point.y}" r="${radius}" fill="${fill}" stroke="${stroke}"/>`;
const text = (x, y, value, size = 20, color = '#d4d4d4', family = 'sans', anchor = 'start') => `<text x="${x}" y="${y}" fill="${color}" text-anchor="${anchor}" font-size="${size}" font-family="${family === 'serif' ? 'Apple Garamond Custom,Garamond,Georgia,serif' : family === 'mono' ? 'ui-monospace,monospace' : 'Alte Haas Grotesk,Helvetica,Arial,sans-serif'}">${escape(value)}</text>`;
const wrap = (title, body, width = 960, height = 600) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${escape(title)}</title>${rect(0, 0, width, height)}${body}</svg>\n`;
const write = (folder, name, content) => writeFile(`public/progetti/${folder}/${name}.svg`, content);

const slots = [1, 8, 16, 20, 25, 33];
const targetWords = {
  en: ['Trust', 'the', 'path', 'you', 'cannot', 'see.'],
  it: ['Segui', 'il', 'sentiero', 'che', 'non', 'vedi.'],
};
const filler = {
  en: ['light', 'silence', 'within', 'above', 'time', 'still', 'opens', 'shadow', 'dream', 'milk', 'salt', 'echo', 'moon', 'dust', 'soft', 'tide', 'wait', 'seed', 'night', 'rain', 'stone', 'air', 'fall', 'rise', 'far', 'near', 'slow', 'gold', 'mist'],
  it: ['luce', 'silenzio', 'dentro', 'sopra', 'tempo', 'fermo', 'apre', 'ombra', 'sogno', 'latte', 'sale', 'eco', 'luna', 'polvere', 'lieve', 'marea', 'attesa', 'seme', 'notte', 'pioggia', 'pietra', 'aria', 'cade', 'sale', 'oltre', 'vicino', 'lento', 'oro', 'nebbia'],
};
const position = index => ({ x: 98 + index % 7 * 127, y: 122 + Math.floor(index / 7) * 86 });
const cheeseField = (lang, reveal) => {
  let body = '';
  if (reveal) {
    const holes = slots.map(index => circle(position(index), 43, '#000')).join('');
    body += `<defs><mask id="holes">${rect(0, 0, 960, 600, '#fff', 'none')}${holes}</mask></defs><rect x="28" y="54" width="904" height="460" fill="${gold}" opacity=".85" mask="url(#holes)"/>`;
  }
  let noiseIndex = 0;
  for (let index = 0; index < 35; index++) {
    const target = slots.indexOf(index);
    const point = position(index);
    if (target < 0 && reveal) continue;
    const word = target < 0 ? filler[lang][noiseIndex++] : targetWords[lang][target];
    body += text(point.x, point.y + 7, word, 24, target >= 0 ? gold : '#737373', 'serif', 'middle');
    if (target >= 0 && !reveal) {
      body += circle(point, 43, 'none', gold);
      body += line({ x: point.x - 6, y: point.y - 16 }, { x: point.x + 6, y: point.y - 16 }, gold);
      body += line({ x: point.x, y: point.y - 22 }, { x: point.x, y: point.y - 10 }, gold);
    }
  }
  return body;
};
const nodes = Array.from({ length: 33 }, (_, index) => {
  const angle = index * 2.39996;
  const distance = 28 + Math.sqrt(index) * 33;
  return { x: 480 + Math.cos(angle) * distance * 1.5, y: 302 + Math.sin(angle) * distance, r: 4 + index * 7 % 11, color: colors[index % 4] };
});
const network = (points = nodes, opacity = 1) => `<g opacity="${opacity}">${points.map((point, index) => (index ? line(points[Math.floor((index - 1) / 2)], point, index % 4 === 0 ? '#2EE6D666' : '#404040') : '') + circle(point, point.r, point.color)).join('')}</g>`;

for (const lang of ['en', 'it']) {
  const suffix = lang === 'it' ? '.it' : '';
  const cheese = 'the-cheese-prophecy';
  const dream = 'dream-catalogue';
  await write(cheese, `diagram-cheese-generation${suffix}`, wrap('The Cheese Prophecy', cheeseField(lang, true)));
  await write(cheese, `diagram-cheese-revelation${suffix}`, wrap('The Cheese Prophecy', cheeseField(lang, false)));

  const phrase = lang === 'it' ? ['Segui il sentiero', 'che non vedi.'] : ['Trust the path', 'you cannot see.'];
  let oracleUI = rect(42, 55, 876, 490) + line({ x: 42, y: 126 }, { x: 918, y: 126 }, '#262626');
  oracleUI += rect(65, 75, 160, 32, gold, gold) + text(145, 97, lang === 'it' ? 'Rivela' : 'Reveal', 17, '#000', 'mono', 'middle');
  oracleUI += `<defs><mask id="slice">${rect(0, 0, 960, 600, '#fff', 'none')}${[{x:155,y:231},{x:297,y:269},{x:209,y:396},{x:349,y:414}].map(point => circle(point, 37, '#000')).join('')}</mask></defs><path d="M84 173L419 194L434 460L102 482Z" fill="${gold}" opacity=".85" mask="url(#slice)"/>`;
  oracleUI += text(502, 276, phrase[0], 37, gold, 'serif') + text(502, 324, phrase[1], 37, gold, 'serif');
  oracleUI += rect(502, 416, 173, 44) + text(588, 444, lang === 'it' ? 'Conserva' : 'Keep', 17, '#d4d4d4', 'mono', 'middle');
  oracleUI += rect(691, 416, 173, 44) + text(777, 444, lang === 'it' ? 'Nuova' : 'New', 17, '#d4d4d4', 'mono', 'middle');
  await write(cheese, `diagram-cheese-interface${suffix}`, wrap('The Cheese Prophecy', oracleUI));

  const cluster = nodes.slice(0, 18).map(point => ({ ...point, x: 684 + (point.x - 480) * .55, y: 302 + (point.y - 302) * .75 }));
  const raw = { x: 190, y: 302 };
  const indexed = { x: 515, y: 351 };
  let pipeline = network(cluster) + line(raw, indexed, '#2EE6D6', true);
  const features = lang === 'it' ? ['Umore', 'Ambientazione', 'Oggetti', 'Assurdità', 'Memoria'] : ['Mood', 'Setting', 'Objects', 'Weirdness', 'Recall'];
  features.forEach((feature, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / 5;
    const point = { x: raw.x + Math.cos(angle) * 124, y: raw.y + Math.sin(angle) * 124 };
    pipeline += line(raw, point, colors[index % 4]) + circle(point, 4, colors[index % 4]);
    pipeline += text(point.x, point.y + (Math.sin(angle) > 0 ? 28 : -18), feature, 16, '#d4d4d4', 'mono', 'middle');
  });
  pipeline += circle(raw, 27, 'none', '#2EE6D666') + circle(raw, 10, '#2EE6D6');
  [0, 3, 8].forEach(index => { pipeline += line(indexed, cluster[index], '#2EE6D699'); });
  pipeline += circle(indexed, 12, '#2EE6D6') + text(indexed.x, indexed.y + 42, 'DC-001', 16, '#2EE6D6', 'mono', 'middle');
  await write(dream, `diagram-dream-pipeline${suffix}`, wrap('Dream Catalogue', pipeline));

  const forces = circle({ x: 480, y: 302 }, 222, 'none', '#262626') + network() + `<path d="M110 302h40m-10-8 10 8-10 8M850 302h-40m10-8-10 8 10 8M480 45v35m-8-10 8 10 8-10M480 560v-35m-8 10 8-10 8 10" fill="none" stroke="#2EE6D6" stroke-width="2"/>`;
  await write(dream, `diagram-dream-forces${suffix}`, wrap('Dream Catalogue', forces));

  let dreamUI = rect(42, 55, 876, 490) + line({ x: 42, y: 127 }, { x: 918, y: 127 }, '#262626') + line({ x: 642, y: 127 }, { x: 642, y: 545 }, '#262626');
  const filters = lang === 'it' ? ['Umore', 'Oggetti', 'Ambientazione'] : ['Mood', 'Objects', 'Setting'];
  filters.forEach((filter, index) => { dreamUI += text(66 + index * 174, 99, filter, 17, index === 0 ? '#2EE6D6' : '#a3a3a3', 'mono'); });
  dreamUI += network(nodes.map(point => ({ ...point, x: 342 + (point.x - 480) * .84, y: 330 + (point.y - 302) * .82, r: point.r * .8 })));
  dreamUI += text(674, 180, 'DC-001', 21, '#2EE6D6', 'mono');
  (lang === 'it' ? ['Memoria', 'Assurdità', 'Lucidità'] : ['Recall', 'Weirdness', 'Lucidity']).forEach((label, index) => {
    const y = 260 + index * 84;
    dreamUI += text(674, y, label, 19) + line({ x: 674, y: y + 22 }, { x: 884, y: y + 22 }, '#262626') + line({ x: 674, y: y + 22 }, { x: 824 - index * 26, y: y + 22 }, colors[3 - index]);
  });
  await write(dream, `diagram-dream-interface${suffix}`, wrap('Dream Catalogue', dreamUI));
}

// Hero backgrounds contain geometry only, leaving the header and title readable.
const heroHoles = [{ x: 340, y: 420, r: 100 }, { x: 835, y: 370, r: 135 }, { x: 1290, y: 565, r: 87 }, { x: 615, y: 825, r: 122 }, { x: 1080, y: 930, r: 96 }];
const heroMask = `<defs><mask id="hero-holes">${rect(0, 0, 1600, 1000, '#fff', 'none')}${heroHoles.map(point => circle(point, point.r, '#000')).join('')}</mask></defs><g mask="url(#hero-holes)"><path d="M90 265L1480 320L1540 1010L155 1060Z" fill="${gold}" fill-opacity=".09" stroke="${gold}" stroke-opacity=".3" stroke-width="2"/></g>`;
await write('the-cheese-prophecy', 'hero-oracle', wrap('The Cheese Prophecy', heroMask, 1600, 1000));
const heroNodes = nodes.map(point => ({ ...point, x: 800 + (point.x - 480) * 2.25, y: 650 + (point.y - 302) * 1.65, r: point.r * 1.5 }));
await write('dream-catalogue', 'hero-constellation', wrap('Dream Catalogue', network(heroNodes, .65), 1600, 1000));
console.log('Updated six bilingual carousel previews and two text-free hero backgrounds.');
