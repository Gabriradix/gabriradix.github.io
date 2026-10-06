import { writeFile } from 'node:fs/promises';

// Native vectors for the homepage carousel, matching ProjectSchematics.astro.
// Keep wording short: these are previews, with full bilingual explanations on the pages.
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const text = (x, y, value, size = 24, color = '#e5e5e5', serif = false) =>
  `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="${serif ? 'Garamond, Georgia, serif' : 'Helvetica, Arial, sans-serif'}">${escape(value)}</text>`;
const lines = (x, y, values, size = 24, color = '#b5b5b5') => values.map((value, i) => text(x, y + i * (size * 1.4), value, size, color, true)).join('');
const line = (x1, y1, x2, y2, color = '#404040') => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="2"/>`;
const box = (x, y, w, h, color = '#101010', stroke = '#404040') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" stroke="${stroke}"/>`;
const circle = (x, y, r, accent) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#171717" stroke="${accent}" stroke-width="2"/>`;
const badge = (x, y, value, accent) => box(x, y - 24, 32, 32) + text(x + 8, y, value, 20, accent);
const wrap = (project, title, description, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="900" height="600" role="img" aria-labelledby="title desc">
<title id="title">${escape(project + ': ' + title)}</title><desc id="desc">${escape(description)}</desc>
${box(0, 0, 900, 600, '#101010', '#101010')}${text(40, 54, project, 20, '#b5b5b5')}${text(40, 108, title, 34)}${line(40, 140, 860, 140)}${body}
</svg>\n`;

for (const dream of [true, false]) {
  const accent = dream ? '#e5e5e5' : '#f5c842';
  const project = dream ? 'Dream Catalogue' : 'The Cheese Prophecy';
  const folder = dream ? 'dream-catalogue' : 'the-cheese-prophecy';
  const names = dream ? ['data-pipeline', 'graph-mechanics', 'ui-telemetry'] : ['poetic-generation', 'prophecy-kinetics', 'netart-interface'];
  const steps = dream ? [
    ['Record a dream', ['Memory and attributes', 'become a structured record.']],
    ['Choose the criteria', ['One filter connects dreams;', 'one metric sets their size.']],
    ['Build relationships', ['Shared attributes create links.', 'Forces position the nodes.']],
    ['Explore the archive', ['Select a dream to read it', 'and see its connections.']],
  ] : [
    ['Choose a prophecy', ['Select an aphorism at random', 'from the existing collection.']],
    ['Hide it in the text', ['Place its words among filler.', 'The surrounding text changes.']],
    ['Freeze the words', ['Stop the shuffle in a cascade.', 'Locate the prophecy words.']],
    ['Reveal and collect', ['Cheese holes reveal the words.', 'Download the card or restart.']],
  ];
  let flow = '';
  steps.forEach(([title, detail], i) => {
    const x = i % 2 ? 475 : 40;
    const y = i < 2 ? 190 : 365;
    flow += line(x, y - 16, x + 365, y - 16, accent) + text(x, y + 20, `0${i + 1}`, 20, accent) + text(x, y + 62, title, 27) + lines(x, y + 102, detail);
  });
  flow += text(40, 568, 'Follow the four stages in reading order.', 22, '#b5b5b5', true);
  await writeFile(`public/progetti/${folder}/diagram-${names[0]}.svg`, wrap(project, dream ? 'From dream to archive' : 'From words to prophecy', steps.map(s => s[0] + '. ' + s[1].join(' ')).join(' '), flow));

  let mechanics;
  if (dream) {
    mechanics = line(105, 300, 270, 245, accent) + circle(105, 300, 31.2, accent) + circle(270, 245, 52.8, accent) + circle(380, 340, 20.4, accent);
    mechanics += text(91, 307, '30', 22) + text(256, 252, '70', 22) + text(369, 347, '10', 20);
    mechanics += lines(40, 420, ['Example metric values.', 'Linked dreams share an attribute.'], 23);
    [['Size', ['Importance, weirdness or memory.', 'Higher value, larger node.']], ['Links', ['Shared attributes according', 'to the selected filter.']], ['Position', ['Links attract; nodes repel.', 'Collisions limit overlap.']]].forEach(([label, detail], i) => {
      const y = 200 + i * 120;
      mechanics += text(480, y, label, 26) + lines(480, y + 34, detail, 23);
    });
    mechanics += line(40, 525, 860, 525) + text(40, 566, 'Size, connections and position encode different aspects of a dream.', 23, '#b5b5b5', true);
  } else {
    const words = ['Every', 'river', 'ending', 'stone', 'holds', 'sky', 'a', 'seed'];
    const chosen = [0, 2, 4, 6, 7];
    mechanics = '';
    ['Word pool', 'Located words', 'Through the holes'].forEach((label, state) => {
      const x = 40 + state * 280;
      mechanics += text(x, 197, `${state + 1}`, 22, accent) + text(x + 28, 197, label, 23) + box(x, 225, 260, 260, state === 2 ? accent : '#101010');
      words.forEach((word, i) => {
        if (state === 2 && !chosen.includes(i)) return;
        const wx = x + 20 + (i % 2) * 120;
        const wy = 276 + Math.floor(i / 2) * 58;
        if (state === 2) mechanics += `<ellipse cx="${wx + 43}" cy="${wy - 8}" rx="52" ry="22" fill="#101010"/>`;
        mechanics += text(wx, wy, word, 24, chosen.includes(i) && state ? accent : '#e5e5e5', true);
        if (state === 1 && chosen.includes(i)) mechanics += line(wx, wy + 7, wx + 75, wy + 7, accent);
      });
    });
    mechanics += line(40, 525, 860, 525) + text(40, 566, 'The mask reveals an existing phrase: “Every ending holds a seed”.', 23, '#b5b5b5', true);
  }
  await writeFile(`public/progetti/${folder}/diagram-${names[1]}.svg`, wrap(project, dream ? 'What the graph encodes' : 'How the reveal works', dream ? 'Metric values control size, shared attributes create links, and forces position nodes.' : 'Words from the chosen aphorism are located in reading order and revealed through the cheese mask.', mechanics));

  let ui = box(40, 180, 430, 340, '#171717') + text(60, 218, project, 23) + line(40, 240, 470, 240);
  const keys = dream ? [['Filters', ['Choose connections', 'and node size.']], ['Graph', ['Pan, zoom, drag', 'or select a dream.']], ['Dream details', ['Read its record', 'and shared attributes.']]] : [['Shuffling text', ['A changing field', 'of scattered words.']], ['Reveal', ['The mask and complete', 'aphorism appear together.']], ['Actions', ['Generate, download', 'or start again.']]];
  if (dream) {
    ui += badge(60, 275, 'A', accent) + text(105, 274, 'CONNECT BY / SIZE BY', 19) + line(40, 295, 470, 295) + line(310, 295, 310, 520);
    ui += badge(60, 337, 'B', accent) + line(115, 425, 230, 370) + line(230, 370, 265, 458) + line(265, 458, 115, 425) + circle(115, 425, 18, accent) + circle(230, 370, 27, accent) + circle(265, 458, 20, accent);
    ui += badge(330, 337, 'C', accent) + lines(330, 385, ['Dream', 'record'], 24) + line(330, 465, 445, 465) + line(330, 485, 415, 485);
  } else {
    ui += badge(60, 280, 'A', accent) + lines(105, 275, ['river · seed · every · ending', 'stone · holds · sky · a'], 22);
    ui += box(60, 343, 390, 105) + badge(75, 380, 'B', accent) + lines(125, 386, ['Every ending', 'holds a seed.'], 28, accent);
    ui += badge(60, 495, 'C', accent) + text(105, 494, 'Generate / Download / New', 19);
  }
  keys.forEach(([label, detail], i) => {
    const y = 218 + i * 120;
    ui += badge(515, y, 'ABC'[i], accent) + text(562, y, label, 26) + lines(562, y + 40, detail, 24);
  });
  ui += text(40, 566, 'Simplified interface map. Explore the live application on the project page.', 23, '#b5b5b5', true);
  await writeFile(`public/progetti/${folder}/diagram-${names[2]}.svg`, wrap(project, 'Reading the interface', keys.map(s => s[0] + ': ' + s[1].join(' ')).join(' '), ui));
}
console.log('Updated six project carousel diagrams.');
