// Рисует купюру в SVG по мотивам настоящей: раскладка, надписи, цвет и рамка под портрет.
// Это иллюстрация, а не копия: портрет заменён силуэтом, защитных элементов нет.

import type { Banknote } from './banknotes';

const NS = 'http://www.w3.org/2000/svg';
const W = 320;
const H = 150;

let uid = 0;

type Attrs = Record<string, string | number>;

function s(tag: string, attrs: Attrs = {}, ...children: (SVGElement | string)[]): SVGElement {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
  for (const child of children) {
    if (typeof child === 'string') element.textContent = child;
    else element.append(child);
  }
  return element;
}

// Смешивает два цвета #rrggbb: t = 0 — первый, t = 1 — второй.
function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

const light = (c: string, t = 0.75) => mix(c, '#ffffff', t);
const dark = (c: string, t = 0.55) => mix(c, '#000000', t);

const group = new Intl.NumberFormat('ru-RU');

function text(x: number, y: number, content: string, attrs: Attrs = {}): SVGElement {
  return s('text', { x, y, 'font-family': 'Georgia, "Times New Roman", serif', ...attrs }, content);
}

// Овальная рамка с силуэтом вместо портрета.
function portrait(id: string, cx: number, cy: number, rx: number, ry: number, paper: string, ink: string): SVGElement {
  const k = ry / 46;
  const clip = s('clipPath', { id: `${id}-oval` }, s('ellipse', { cx, cy, rx, ry }));
  return s(
    'g',
    {},
    clip,
    s('ellipse', { cx, cy, rx, ry, fill: paper }),
    s(
      'g',
      { 'clip-path': `url(#${id}-oval)`, fill: ink, opacity: 0.55 },
      s('circle', { cx, cy: cy - 10 * k, r: 14 * k }),
      s('path', {
        d: `M ${cx - 34 * k} ${cy + 50 * k} Q ${cx - 30 * k} ${cy + 10 * k} ${cx} ${cy + 8 * k} Q ${cx + 30 * k} ${cy + 10 * k} ${cx + 34 * k} ${cy + 50 * k} Z`,
      }),
    ),
    s('ellipse', { cx, cy, rx, ry, fill: 'none', stroke: ink, 'stroke-width': 1.5 }),
    s('ellipse', { cx, cy, rx: rx + 4, ry: ry + 4, fill: 'none', stroke: ink, 'stroke-width': 0.6, 'stroke-dasharray': '1.5 2' }),
  );
}

// Тонкий гильош: волнистые линии, как фоновая сетка на настоящих купюрах.
function guilloche(color: string, opacity = 0.18): SVGElement {
  const lines = s('g', { fill: 'none', stroke: color, 'stroke-width': 0.6, opacity });
  for (let i = 0; i < 9; i++) {
    const y = 20 + i * 14;
    lines.append(s('path', { d: `M 0 ${y} Q 40 ${y - 10} 80 ${y} T 160 ${y} T 240 ${y} T 320 ${y}` }));
  }
  return lines;
}

function background(id: string, from: string, to: string): SVGElement[] {
  const gradient = s(
    'linearGradient',
    { id: `${id}-bg`, x1: 0, y1: 0, x2: 1, y2: 1 },
    s('stop', { offset: 0, 'stop-color': from }),
    s('stop', { offset: 1, 'stop-color': to }),
  );
  return [s('defs', {}, gradient), s('rect', { width: W, height: H, rx: 8, fill: `url(#${id}-bg)` })];
}

// ---------- Доллар ----------

const USD_WORDS: Record<number, string> = {
  1: 'ONE DOLLAR', 2: 'TWO DOLLARS', 5: 'FIVE DOLLARS', 10: 'TEN DOLLARS',
  20: 'TWENTY DOLLARS', 50: 'FIFTY DOLLARS', 100: 'ONE HUNDRED DOLLARS',
};

function usd(id: string, note: Banknote): SVGElement[] {
  const ink = note.value <= 2 ? '#2f4a3a' : dark(note.color, 0.5);
  const paper = mix('#ecebdc', note.color, note.value <= 2 ? 0.12 : 0.22);
  const value = String(note.value);
  const parts: SVGElement[] = [
    ...background(id, paper, mix(paper, note.color, 0.25)),
    guilloche(ink, 0.12),
    s('rect', { x: 6, y: 6, width: W - 12, height: H - 12, rx: 4, fill: 'none', stroke: ink, 'stroke-width': 2 }),
    s('rect', { x: 11, y: 11, width: W - 22, height: H - 22, rx: 3, fill: 'none', stroke: ink, 'stroke-width': 0.6 }),
    text(W / 2, 27, 'THE UNITED STATES OF AMERICA', { 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: ink, 'letter-spacing': 0.5 }),
    text(24, 42, 'FEDERAL RESERVE NOTE', { 'font-size': 6.5, fill: ink, 'letter-spacing': 0.6 }),
    portrait(id, W / 2, 80, 34, 42, light(note.color, 0.8), ink),
    // Печать Федерального резерва слева и печать Казначейства справа.
    s('circle', { cx: 74, cy: 82, r: 16, fill: 'none', stroke: '#2b2b2b', 'stroke-width': 2 }),
    s('circle', { cx: 74, cy: 82, r: 10, fill: 'none', stroke: '#2b2b2b', 'stroke-width': 0.8 }),
    s('circle', { cx: 246, cy: 92, r: 12, fill: 'none', stroke: '#2f7a4a', 'stroke-width': 2 }),
    s('circle', { cx: 246, cy: 92, r: 6, fill: '#2f7a4a', opacity: 0.6 }),
    text(W / 2, 136, USD_WORDS[note.value] ?? `${value} DOLLARS`, { 'text-anchor': 'middle', 'font-size': 9.5, 'font-weight': 700, fill: ink, 'letter-spacing': 1.2 }),
    text(20, 34, value, { 'font-size': note.value >= 100 ? 15 : 18, 'font-weight': 700, fill: ink }),
    text(W - 20, 34, value, { 'text-anchor': 'end', 'font-size': note.value >= 100 ? 15 : 18, 'font-weight': 700, fill: ink }),
    text(20, 136, value, { 'font-size': 16, 'font-weight': 700, fill: ink }),
    text(W - 20, 136, value, { 'text-anchor': 'end', 'font-size': note.value >= 5 ? 26 : 16, 'font-weight': 700, fill: note.value >= 5 ? note.color : ink }),
  ];
  if (note.value === 100) {
    // Синяя защитная лента на $100.
    parts.push(s('rect', { x: 206, y: 11, width: 7, height: H - 22, fill: '#3f7fd0', opacity: 0.75 }));
  }
  return parts;
}

// ---------- Евро ----------

function euroWindow(value: number, x: number, y: number, w: number, h: number, ink: string, glass: string): SVGElement {
  const g = s('g', { fill: glass, stroke: ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round' });
  const right = x + w;
  const bottom = y + h;
  const mid = x + w / 2;
  switch (value) {
    case 5: // античный портик: фронтон и колонны
      g.append(s('path', { d: `M ${x - 6} ${y + 22} L ${mid} ${y} L ${right + 6} ${y + 22} Z` }));
      g.append(s('rect', { x: x - 4, y: y + 22, width: w + 8, height: 6 }));
      for (let i = 0; i < 4; i++) g.append(s('rect', { x: x + 2 + i * ((w - 10) / 3), y: y + 30, width: 6, height: h - 34 }));
      break;
    case 10: // романская полукруглая арка
      g.append(s('path', { d: `M ${x} ${bottom} V ${y + w / 2} A ${w / 2} ${w / 2} 0 0 1 ${right} ${y + w / 2} V ${bottom} Z` }));
      g.append(s('path', { d: `M ${x + 10} ${bottom} V ${y + w / 2} A ${w / 2 - 10} ${w / 2 - 10} 0 0 1 ${right - 10} ${y + w / 2} V ${bottom}`, fill: 'none' }));
      break;
    case 20: // готическое стрельчатое окно
      g.append(s('path', { d: `M ${x} ${bottom} V ${y + 40} Q ${x} ${y + 8} ${mid} ${y} Q ${right} ${y + 8} ${right} ${y + 40} V ${bottom} Z` }));
      g.append(s('path', { d: `M ${mid} ${y + 6} V ${bottom} M ${x} ${y + 60} H ${right}`, fill: 'none' }));
      g.append(s('circle', { cx: mid, cy: y + 30, r: 9 }));
      break;
    case 50: // ренессанс: арка между пилястрами и карниз
      g.append(s('rect', { x: x - 8, y: y + 8, width: w + 16, height: 7 }));
      g.append(s('rect', { x: x - 8, y: y + 15, width: 8, height: h - 15 }));
      g.append(s('rect', { x: right, y: y + 15, width: 8, height: h - 15 }));
      g.append(s('path', { d: `M ${x + 4} ${bottom} V ${y + 15 + (w - 8) / 2} A ${(w - 8) / 2} ${(w - 8) / 2} 0 0 1 ${right - 4} ${y + 15 + (w - 8) / 2} V ${bottom} Z` }));
      break;
    case 100: // барокко: арка с волнистым завершением
      g.append(s('path', { d: `M ${x - 8} ${y + 22} Q ${x + 10} ${y - 4} ${mid} ${y + 8} Q ${right - 10} ${y - 4} ${right + 8} ${y + 22} Z` }));
      g.append(s('path', { d: `M ${x} ${bottom} V ${y + 26 + w / 2} A ${w / 2} ${w / 2} 0 0 1 ${right} ${y + 26 + w / 2} V ${bottom} Z` }));
      g.append(s('circle', { cx: mid, cy: y + 15, r: 4 }));
      break;
    case 200: { // модерн: окно из железа и стекла
      g.append(s('path', { d: `M ${x} ${bottom} V ${y + 26} Q ${mid} ${y - 10} ${right} ${y + 26} V ${bottom} Z` }));
      const grid = s('g', { fill: 'none', 'stroke-width': 0.9 });
      for (let i = 1; i < 4; i++) grid.append(s('path', { d: `M ${x + (w / 4) * i} ${y + 14} V ${bottom}` }));
      for (let i = 1; i < 5; i++) grid.append(s('path', { d: `M ${x} ${y + 26 + ((h - 26) / 5) * i} H ${right}` }));
      g.append(grid);
      break;
    }
    default: { // XX век: стеклянный фасад
      g.append(s('rect', { x, y, width: w, height: h }));
      const grid = s('g', { fill: 'none', 'stroke-width': 0.9 });
      for (let i = 1; i < 5; i++) grid.append(s('path', { d: `M ${x + (w / 5) * i} ${y} V ${bottom}` }));
      for (let i = 1; i < 6; i++) grid.append(s('path', { d: `M ${x} ${y + (h / 6) * i} H ${right}` }));
      g.append(grid);
    }
  }
  return g;
}

function euroStars(cx: number, cy: number, r: number): SVGElement {
  const g = s('g', { fill: '#f5c400' });
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    g.append(s('circle', { cx: cx + r * Math.cos(angle), cy: cy + r * Math.sin(angle), r: 1.6 }));
  }
  return g;
}

function eur(id: string, note: Banknote): SVGElement[] {
  const ink = dark(note.color, 0.45);
  const value = String(note.value);
  const holo = s(
    'linearGradient',
    { id: `${id}-holo`, x1: 0, y1: 0, x2: 0, y2: 1 },
    s('stop', { offset: 0, 'stop-color': '#e8edf2' }),
    s('stop', { offset: 0.5, 'stop-color': '#b9c3cf' }),
    s('stop', { offset: 1, 'stop-color': '#eef1f5' }),
  );
  return [
    ...background(id, light(note.color, 0.55), note.color),
    s('defs', {}, holo),
    guilloche('#ffffff', 0.2),
    s('rect', { x: 0, y: 0, width: 26, height: H, fill: ink, opacity: 0.25 }),
    s('rect', { x: 32, y: 14, width: 26, height: 20, fill: '#1f4fa0', rx: 2 }),
    euroStars(45, 24, 7),
    euroWindow(note.value, 70, 34, 70, 100, ink, light(note.color, 0.35)),
    text(176, 64, value, { 'font-size': 44, 'font-weight': 700, fill: '#ffffff', 'font-family': 'system-ui, sans-serif', opacity: 0.95 }),
    text(178, 86, 'EURO  ΕΥΡΩ  ЕВРО', { 'font-size': 9, fill: '#ffffff', 'letter-spacing': 1.2, 'font-family': 'system-ui, sans-serif' }),
    text(178, 128, 'BCE ECB ЕЦБ EZB EKP', { 'font-size': 6.5, fill: ink, 'letter-spacing': 0.8, 'font-family': 'system-ui, sans-serif' }),
    text(36, 140, value, { 'font-size': 13, 'font-weight': 700, fill: '#ffffff', 'font-family': 'system-ui, sans-serif' }),
    // Голографическая полоса справа.
    s('rect', { x: 286, y: 0, width: 18, height: H, fill: `url(#${id}-holo)`, opacity: 0.9 }),
    text(295, 48, '€', { 'text-anchor': 'middle', 'font-size': 14, fill: '#8a95a3', 'font-family': 'system-ui, sans-serif' }),
  ];
}

// ---------- Фунт ----------

const GBP_WORDS: Record<number, string> = { 5: 'Five Pounds', 10: 'Ten Pounds', 20: 'Twenty Pounds', 50: 'Fifty Pounds' };

function gbp(id: string, note: Banknote): SVGElement[] {
  const ink = dark(note.color, 0.5);
  const value = String(note.value);
  return [
    ...background(id, light(note.color, 0.6), mix(note.color, '#ffffff', 0.15)),
    guilloche(ink, 0.15),
    // Прозрачное окно полимерной купюры.
    s('rect', { x: 18, y: 50, width: 40, height: 74, rx: 3, fill: '#ffffff', opacity: 0.55, stroke: '#c9b26a', 'stroke-width': 1.2 }),
    s('path', { d: 'M 28 70 L 38 62 L 48 70 L 48 90 L 28 90 Z', fill: '#c9b26a', opacity: 0.6 }),
    text(70, 32, 'Bank of England', { 'font-size': 15, 'font-style': 'italic', 'font-weight': 700, fill: ink }),
    text(70, 46, 'Promise to pay the bearer on demand the sum of', { 'font-size': 6.2, fill: ink }),
    text(70, 60, GBP_WORDS[note.value] ?? `${value} Pounds`, { 'font-size': 10, 'font-style': 'italic', fill: ink }),
    text(70, 112, `£${value}`, { 'font-size': 34, 'font-weight': 700, fill: '#ffffff', 'font-family': 'system-ui, sans-serif', stroke: ink, 'stroke-width': 0.6 }),
    portrait(id, 244, 78, 40, 50, light(note.color, 0.85), ink),
    text(W - 16, 30, value, { 'text-anchor': 'end', 'font-size': 18, 'font-weight': 700, fill: ink, 'font-family': 'system-ui, sans-serif' }),
  ];
}

// ---------- Драм и лари: общая раскладка, разные надписи ----------

function caucasus(id: string, note: Banknote, issuer: string, unit: string, symbol: string): SVGElement[] {
  const ink = dark(note.color, 0.5);
  const value = group.format(note.value);
  const ornament = s('g', { fill: 'none', stroke: '#ffffff', 'stroke-width': 0.8, opacity: 0.45 });
  for (let i = 0; i < 6; i++) ornament.append(s('circle', { cx: 210, cy: 104, r: 6 + i * 6 }));
  return [
    ...background(id, light(note.color, 0.5), note.color),
    guilloche('#ffffff', 0.18),
    ornament,
    s('rect', { x: 8, y: 8, width: W - 16, height: H - 16, rx: 5, fill: 'none', stroke: '#ffffff', 'stroke-width': 0.8, opacity: 0.6 }),
    text(W / 2, 24, issuer, { 'text-anchor': 'middle', 'font-size': 7.4, fill: ink, 'letter-spacing': 0.6, 'font-family': 'system-ui, sans-serif', 'font-weight': 600 }),
    portrait(id, 72, 84, 40, 50, light(note.color, 0.8), ink),
    text(W - 18, 76, value, { 'text-anchor': 'end', 'font-size': note.value >= 10000 ? 30 : 36, 'font-weight': 700, fill: '#ffffff', 'font-family': 'system-ui, sans-serif' }),
    text(W - 18, 96, unit, { 'text-anchor': 'end', 'font-size': 12, 'font-weight': 600, fill: ink, 'letter-spacing': 1.5, 'font-family': 'system-ui, sans-serif' }),
    text(W - 18, 134, symbol, { 'text-anchor': 'end', 'font-size': 20, fill: '#ffffff', opacity: 0.9, 'font-family': 'system-ui, sans-serif' }),
    text(132, 134, value, { 'font-size': 11, 'font-weight': 700, fill: ink, 'font-family': 'system-ui, sans-serif' }),
  ];
}

// ---------- Рубль: вместо портрета — силуэт здания ----------

function landmark(cx: number, base: number, ink: string, fill: string): SVGElement {
  return s(
    'g',
    { fill, stroke: ink, 'stroke-width': 1.2, 'stroke-linejoin': 'round' },
    s('rect', { x: cx - 44, y: base - 34, width: 88, height: 34 }),
    s('path', { d: `M ${cx - 50} ${base - 34} L ${cx} ${base - 52} L ${cx + 50} ${base - 34} Z` }),
    s('rect', { x: cx - 10, y: base - 68, width: 20, height: 18 }),
    s('path', { d: `M ${cx - 13} ${base - 68} Q ${cx} ${base - 86} ${cx + 13} ${base - 68} Z` }),
    s('path', { d: `M ${cx} ${base - 86} V ${base - 94}`, fill: 'none' }),
    ...[-30, -15, 0, 15, 30].map((dx) => s('rect', { x: cx + dx - 3, y: base - 28, width: 6, height: 22, fill: 'none' })),
  );
}

function rub(id: string, note: Banknote): SVGElement[] {
  const ink = dark(note.color, 0.5);
  const value = group.format(note.value);
  return [
    ...background(id, light(note.color, 0.55), note.color),
    guilloche('#ffffff', 0.2),
    s('rect', { x: 8, y: 8, width: W - 16, height: H - 16, rx: 5, fill: 'none', stroke: '#ffffff', 'stroke-width': 0.8, opacity: 0.6 }),
    text(18, 26, 'БИЛЕТ БАНКА РОССИИ', { 'font-size': 9, 'font-weight': 700, fill: ink, 'letter-spacing': 1.2, 'font-family': 'system-ui, sans-serif' }),
    landmark(92, 134, ink, light(note.color, 0.7)),
    text(W - 18, 72, value, { 'text-anchor': 'end', 'font-size': 36, 'font-weight': 700, fill: '#ffffff', 'font-family': 'system-ui, sans-serif' }),
    text(W - 18, 92, 'РУБЛЕЙ', { 'text-anchor': 'end', 'font-size': 11, 'font-weight': 600, fill: ink, 'letter-spacing': 1.5, 'font-family': 'system-ui, sans-serif' }),
    text(W - 18, 134, '₽', { 'text-anchor': 'end', 'font-size': 20, fill: '#ffffff', opacity: 0.9, 'font-family': 'system-ui, sans-serif' }),
    text(W - 18, 116, note.note ?? '', { 'text-anchor': 'end', 'font-size': 8, fill: ink, 'font-family': 'system-ui, sans-serif' }),
  ];
}

export function drawBanknote(code: string, note: Banknote, label: string): SVGElement {
  const id = `bn${++uid}`;
  let parts: SVGElement[];
  switch (code) {
    case 'USD': parts = usd(id, note); break;
    case 'EUR': parts = eur(id, note); break;
    case 'GBP': parts = gbp(id, note); break;
    case 'AMD': parts = caucasus(id, note, 'ՀԱՅԱՍՏԱՆԻ ՀԱՆՐԱՊԵՏՈՒԹՅԱՆ ԿԵՆՏՐՈՆԱԿԱՆ ԲԱՆԿ', 'ԴՐԱՄ', '֏'); break;
    case 'GEL': parts = caucasus(id, note, 'საქართველოს ეროვნული ბანკი', 'ლარი', '₾'); break;
    case 'RUB': parts = rub(id, note); break;
    default: parts = caucasus(id, note, code, code, code);
  }
  return s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'bill', role: 'img', 'aria-label': label }, ...parts);
}
