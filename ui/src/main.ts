import {
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { api, type AppNotification, type Direction, type Rate, type Rule } from './api';
import { BANKNOTES, type Banknote, type BanknoteSeries } from './banknotes';
import './style.css';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

const REFRESH_MS = 60_000;
const BASE = 'USD';
// Валюты, курсы которых собирает бэкенд (rates.currencies).
const QUOTES = ['EUR', 'GBP', 'AMD', 'GEL'];

const CURRENCY_INFO: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: '$', name: 'Доллар США' },
  EUR: { symbol: '€', name: 'Евро' },
  GBP: { symbol: '£', name: 'Фунт стерлингов' },
  AMD: { symbol: '֏', name: 'Армянский драм' },
  GEL: { symbol: '₾', name: 'Грузинский лари' },
};

function info(code: string) {
  return CURRENCY_INFO[code] ?? { symbol: code, name: code };
}

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Нет элемента #${id}`);
  return element as T;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

const statusEl = byId<HTMLDivElement>('status');
const statusText = byId<HTMLSpanElement>('status-text');
const tilesEl = byId<HTMLElement>('tiles');
const chartTitle = byId<HTMLHeadingElement>('chart-title');
const chartSub = byId<HTMLParagraphElement>('chart-sub');
const periodsEl = byId<HTMLDivElement>('periods');
const chartCanvas = byId<HTMLCanvasElement>('rate-chart');
const chartEmpty = byId<HTMLParagraphElement>('chart-empty');
const ruleForm = byId<HTMLFormElement>('rule-form');
const formError = byId<HTMLParagraphElement>('form-error');
const rulesList = byId<HTMLUListElement>('rules');
const rulesEmpty = byId<HTMLParagraphElement>('rules-empty');
const notificationsList = byId<HTMLUListElement>('notifications');
const notificationsEmpty = byId<HTMLParagraphElement>('notifications-empty');

const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });
const axisFormat = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

function directionText(direction: Direction): string {
  return direction === 'ABOVE' ? 'выше' : 'ниже';
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

let selectedQuote = QUOTES[0];
let selectedLimit = 24;

// ---------- Плитки с текущими курсами ----------

function renderTile(quote: string, rates: Rate[]): HTMLButtonElement {
  const tile = el('button', quote === selectedQuote ? 'tile active' : 'tile');
  tile.type = 'button';
  tile.addEventListener('click', () => {
    selectedQuote = quote;
    refresh();
  });

  const head = el('div', 'tile-head');
  head.append(el('span', 'symbol', info(quote).symbol), el('span', 'tile-pair', `${BASE} → ${quote}`));
  const name = el('div', 'muted small', info(quote).name);

  const [latest, previous] = rates;
  const value = el('div', 'tile-value', latest ? String(latest.rate) : '—');
  tile.append(head, name, value);
  if (!latest) tile.append(el('div', 'muted small', 'Появится после сбора'));

  if (latest && previous) {
    const change = ((Number(latest.rate) - Number(previous.rate)) / Number(previous.rate)) * 100;
    const sign = change > 0 ? '▲' : change < 0 ? '▼' : '•';
    const kind = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
    tile.append(el('div', `change ${kind}`, `${sign} ${Math.abs(change).toFixed(3)}% к прошлому`));
  }
  return tile;
}

async function loadTiles(): Promise<void> {
  const all = await Promise.all(QUOTES.map((quote) => api.rates(BASE, quote, 2)));
  tilesEl.replaceChildren(...QUOTES.map((quote, i) => renderTile(quote, all[i])));
}

// ---------- График ----------

let chart: Chart<'line'> | null = null;

function gradient(context: CanvasRenderingContext2D, height: number): CanvasGradient {
  const fill = context.createLinearGradient(0, 0, 0, height);
  fill.addColorStop(0, cssVar('--accent-soft'));
  fill.addColorStop(1, 'transparent');
  return fill;
}

async function loadChart(): Promise<void> {
  // API отдаёт сначала новые, на графике нужно слева направо по времени.
  const rates = (await api.rates(BASE, selectedQuote, selectedLimit)).reverse();

  chartTitle.textContent = `${BASE}/${selectedQuote}`;
  chartSub.textContent = `Сколько ${info(selectedQuote).name.toLowerCase()} дают за 1 ${BASE}`;
  chartEmpty.hidden = rates.length > 0;
  chartCanvas.parentElement!.hidden = rates.length === 0;

  const labels = rates.map((r) => axisFormat.format(new Date(r.time)));
  const values = rates.map((r) => Number(r.rate));

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.update();
    return;
  }
  chart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          data: values,
          borderColor: cssVar('--accent'),
          borderWidth: 2,
          backgroundColor: (ctx) => gradient(ctx.chart.ctx, ctx.chart.height),
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointBackgroundColor: cssVar('--accent'),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { displayColors: false, padding: 10 },
      },
      scales: {
        x: { ticks: { color: cssVar('--muted'), maxTicksLimit: 6, maxRotation: 0 }, grid: { display: false }, border: { display: false } },
        y: { ticks: { color: cssVar('--muted'), maxTicksLimit: 5 }, grid: { color: cssVar('--grid') }, border: { display: false } },
      },
    },
  });
}

periodsEl.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest('button');
  if (!button) return;
  selectedLimit = Number(button.dataset.limit);
  periodsEl.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === button));
  loadChart().catch(showError);
});

// ---------- Правила ----------

function renderRule(rule: Rule): HTMLLIElement {
  const item = el('li', 'row');

  const main = el('div', 'row-main');
  main.append(
    el('span', 'pair', `${rule.base}/${rule.quote}`),
    el('span', `pill ${rule.direction === 'ABOVE' ? 'up' : 'down'}`, `${rule.direction === 'ABOVE' ? '▲' : '▼'} ${directionText(rule.direction)} ${rule.threshold}`),
  );

  const badge = el('span', rule.triggered ? 'badge on' : 'badge', rule.triggered ? 'сработало' : 'ждёт');

  const remove = el('button', 'icon-button', '✕');
  remove.type = 'button';
  remove.title = 'Удалить правило';
  remove.setAttribute('aria-label', `Удалить правило ${rule.base}/${rule.quote}`);
  remove.addEventListener('click', async () => {
    if (!confirm('Удалить правило и его уведомления?')) return;
    try {
      await api.deleteRule(rule.id);
      await Promise.all([loadRules(), loadNotifications()]);
    } catch (e) {
      showError(e);
    }
  });

  item.append(main, badge, remove);
  return item;
}

async function loadRules(): Promise<void> {
  const rules = await api.rules();
  rulesList.replaceChildren(...rules.map(renderRule));
  rulesEmpty.hidden = rules.length > 0;
}

ruleForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.hidden = true;
  const data = new FormData(ruleForm);
  try {
    await api.createRule({
      base: String(data.get('base')).trim().toUpperCase(),
      quote: String(data.get('quote')).trim().toUpperCase(),
      direction: data.get('direction') as Direction,
      threshold: Number(data.get('threshold')),
    });
    (ruleForm.elements.namedItem('threshold') as HTMLInputElement).value = '';
    await loadRules();
  } catch (e) {
    formError.textContent = (e as Error).message;
    formError.hidden = false;
  }
});

// ---------- Уведомления ----------

function renderNotification(n: AppNotification): HTMLLIElement {
  const item = el('li', 'event');
  const icon = el('span', `event-icon ${n.direction === 'ABOVE' ? 'up' : 'down'}`, n.direction === 'ABOVE' ? '▲' : '▼');
  const body = el('div', 'event-body');
  const title = el('div', 'event-title', `${n.base}/${n.quote} стал ${directionText(n.direction)} ${n.threshold}`);
  const meta = el('div', 'muted small', `Курс ${n.rate} · ${dateFormat.format(new Date(n.createdAt))}`);
  body.append(title, meta);
  item.append(icon, body);
  return item;
}

async function loadNotifications(): Promise<void> {
  const notifications = await api.notifications();
  notificationsList.replaceChildren(...notifications.map(renderNotification));
  notificationsEmpty.hidden = notifications.length > 0;
}

// ---------- Конвертер ----------

const convAmount = byId<HTMLInputElement>('conv-amount');
const convFrom = byId<HTMLSelectElement>('conv-from');
const convTo = byId<HTMLSelectElement>('conv-to');
const convSwap = byId<HTMLButtonElement>('conv-swap');
const convValue = byId<HTMLDivElement>('conv-value');
const convMeta = byId<HTMLDivElement>('conv-meta');

const moneyFormat = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

for (const code of [BASE, ...QUOTES]) {
  convFrom.append(new Option(`${code} · ${info(code).name}`, code));
  convTo.append(new Option(`${code} · ${info(code).name}`, code));
}
convFrom.value = BASE;
convTo.value = QUOTES[0];

// Номер последнего запроса: ответ на устаревший запрос не должен перезаписать новый.
let convRequest = 0;

async function convert(): Promise<void> {
  const amount = Number(convAmount.value);
  const from = convFrom.value;
  const to = convTo.value;
  const request = ++convRequest;

  if (from === to) {
    convValue.textContent = `${moneyFormat.format(amount)} ${info(to).symbol}`;
    convMeta.textContent = 'Одинаковые валюты';
    return;
  }
  if (!(amount > 0)) {
    convValue.textContent = '—';
    convMeta.textContent = 'Введите сумму больше нуля';
    return;
  }
  try {
    const result = await api.convert(from, to, amount);
    if (request !== convRequest) return;
    convValue.textContent = `${moneyFormat.format(result.result)} ${info(to).symbol}`;
    convMeta.textContent = `1 ${from} = ${result.rate} ${to} · курс от ${dateFormat.format(new Date(result.rateTime))}`;
  } catch (e) {
    if (request !== convRequest) return;
    convValue.textContent = '—';
    const message = (e as Error).message;
    convMeta.textContent = message.startsWith('No rate') ? 'Курса этой валюты ещё нет, он появится после следующего сбора.' : message;
  }
}

let convTimer: number | undefined;
convAmount.addEventListener('input', () => {
  clearTimeout(convTimer);
  convTimer = window.setTimeout(convert, 250);
});
convFrom.addEventListener('change', convert);
convTo.addEventListener('change', convert);
convSwap.addEventListener('click', () => {
  [convFrom.value, convTo.value] = [convTo.value, convFrom.value];
  convert();
});
byId<HTMLFormElement>('converter-form').addEventListener('submit', (event) => event.preventDefault());

// ---------- Купюры ----------

const banknoteTabs = byId<HTMLDivElement>('banknote-tabs');
const banknoteAbout = byId<HTMLParagraphElement>('banknote-about');
const banknoteGrid = byId<HTMLDivElement>('banknote-grid');
const banknoteHint = byId<HTMLParagraphElement>('banknote-hint');

let selectedSeries = BANKNOTES[0];
const valueFormat = new Intl.NumberFormat('ru-RU');

function renderBanknote(series: BanknoteSeries, banknote: Banknote, rate: number | null, target: string): HTMLElement {
  const card = el('figure', 'banknote');
  const bill = el('div', 'bill');
  bill.style.setProperty('--note', banknote.color);
  bill.setAttribute('role', 'img');
  bill.setAttribute('aria-label', `${valueFormat.format(banknote.value)} ${series.code}`);

  bill.append(
    el('span', 'bill-corner top', valueFormat.format(banknote.value)),
    el('span', 'bill-seal', info(series.code).symbol),
    el('span', 'bill-name', series.title),
    el('span', 'bill-corner bottom', valueFormat.format(banknote.value)),
  );

  const caption = el('figcaption');
  caption.append(el('div', 'bill-value', `${valueFormat.format(banknote.value)} ${info(series.code).symbol}`));
  if (rate !== null) {
    caption.append(el('div', 'muted small', `≈ ${moneyFormat.format(banknote.value * rate)} ${info(target).symbol}`));
  }
  if (banknote.note) caption.append(el('div', 'muted small', banknote.note));

  card.append(bill, caption);
  return card;
}

async function renderBanknotes(): Promise<void> {
  const series = selectedSeries;
  banknoteTabs.querySelectorAll('button').forEach((b) =>
    b.setAttribute('aria-selected', String(b.dataset.code === series.code)),
  );
  banknoteAbout.textContent = series.about;
  banknoteHint.textContent = series.approximateColors ? 'Цвета карточек приблизительные.' : '';

  // Цену купюры показываем в долларах, а для самого доллара — в евро.
  const target = series.code === BASE ? QUOTES[0] : BASE;
  let rate: number | null = null;
  try {
    rate = Number((await api.convert(series.code, target, 1)).rate);
  } catch {
    // курса ещё нет — показываем купюры без цены
  }
  if (series !== selectedSeries) return;
  banknoteGrid.replaceChildren(...series.notes.map((note) => renderBanknote(series, note, rate, target)));
}

for (const series of BANKNOTES) {
  const tab = el('button', '', series.code);
  tab.type = 'button';
  tab.dataset.code = series.code;
  tab.setAttribute('role', 'tab');
  tab.addEventListener('click', () => {
    selectedSeries = series;
    renderBanknotes();
  });
  banknoteTabs.append(tab);
}

// ---------- Обновление ----------

function showStatus(text: string, isError = false): void {
  statusText.textContent = text;
  statusEl.classList.toggle('offline', isError);
}

function showError(e: unknown): void {
  showStatus((e as Error).message, true);
}

async function refresh(): Promise<void> {
  try {
    await Promise.all([loadTiles(), loadChart(), loadRules(), loadNotifications(), convert(), renderBanknotes()]);
    showStatus(`Обновлено в ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`);
  } catch (e) {
    showStatus(`Нет связи с сервером: ${(e as Error).message}`, true);
  }
}

refresh();
setInterval(refresh, REFRESH_MS);
