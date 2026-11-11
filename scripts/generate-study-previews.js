import { writeFile } from 'node:fs/promises';

// Carousel SVGs are curated exports of the explanatory drawings.
// Regenerate only the text-free hero backgrounds here; preserve those exports.
const gold = '#efbf48';
const colors = ['#FF5A5F', '#2EE6D6', '#9B7BFF', '#FF9F1C'];
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const rect = (x, y, width, height, fill = '#000', stroke = '#262626') => `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${stroke}"/>`;
const line = (a, b, color = '#404040', dashed = false) => `<path d="M${a.x} ${a.y}L${b.x} ${b.y}" fill="none" stroke="${color}" stroke-width="1.4"${dashed ? ' stroke-dasharray="5 7"' : ''}/>`;
const circle = (point, radius, fill, stroke = 'none') => `<circle cx="${point.x}" cy="${point.y}" r="${radius}" fill="${fill}" stroke="${stroke}"/>`;
const wrap = (title, body, width = 960, height = 600) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${escape(title)}</title>${rect(0, 0, width, height)}${body}</svg>\n`;
const write = (folder, name, content) => writeFile(`public/progetti/${folder}/${name}.svg`, content);

const nodes = Array.from({ length: 33 }, (_, index) => {
  const angle = index * 2.39996;
  const distance = 28 + Math.sqrt(index) * 33;
  return { x: 480 + Math.cos(angle) * distance * 1.5, y: 302 + Math.sin(angle) * distance, r: 4 + index * 7 % 11, color: colors[index % 4] };
});
const network = (points = nodes, opacity = 1) => `<g opacity="${opacity}">${points.map((point, index) => (index ? line(points[Math.floor((index - 1) / 2)], point, index % 4 === 0 ? '#2EE6D666' : '#404040') : '') + circle(point, point.r, point.color)).join('')}</g>`;

// Hero backgrounds contain geometry only, leaving the header and title readable.
const heroHoles = [{ x: 340, y: 420, r: 100 }, { x: 835, y: 370, r: 135 }, { x: 1290, y: 565, r: 87 }, { x: 615, y: 825, r: 122 }, { x: 1080, y: 930, r: 96 }];
const heroMask = `<defs><mask id="hero-holes">${rect(0, 0, 1600, 1000, '#fff', 'none')}${heroHoles.map(point => circle(point, point.r, '#000')).join('')}</mask></defs><g mask="url(#hero-holes)"><path d="M90 265L1480 320L1540 1010L155 1060Z" fill="${gold}" fill-opacity=".09" stroke="${gold}" stroke-opacity=".3" stroke-width="2"/></g>`;
await write('the-cheese-prophecy', 'hero-oracle', wrap('The Cheese Prophecy', heroMask, 1600, 1000));
const heroNodes = nodes.map(point => ({ ...point, x: 800 + (point.x - 480) * 2.25, y: 650 + (point.y - 302) * 1.65, r: point.r * 1.5 }));
await write('dream-catalogue', 'hero-constellation', wrap('Dream Catalogue', network(heroNodes, .65), 1600, 1000));
console.log('Updated two hero backgrounds; curated carousel SVGs preserved.');
