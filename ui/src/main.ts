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
import './style.css';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

const REFRESH_MS = 60_000;
const BASE = 'USD';
// Валюты, курсы которых собирает бэкенд (rates.currencies).
const QUOTES = ['EUR', 'GBP'];

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
    await Promise.all([loadTiles(), loadChart(), loadRules(), loadNotifications()]);
    showStatus(`Обновлено в ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`);
  } catch (e) {
    showStatus(`Нет связи с сервером: ${(e as Error).message}`, true);
  }
}

refresh();
setInterval(refresh, REFRESH_MS);
