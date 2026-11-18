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
import { api, ownerToken, type AppNotification, type Direction, type Rate, type Rule } from './api';
import { drawBanknote } from './banknoteArt';
import { BANKNOTES, type Banknote, type BanknoteSeries } from './banknotes';
import './style.css';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

const REFRESH_MS = 60_000;
const BASE = 'USD';
// Валюты, курсы которых собирает бэкенд (rates.currencies).
const QUOTES = ['EUR', 'GBP', 'AMD', 'GEL', 'RUB'];

const CURRENCY_INFO: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: '$', name: 'Доллар США' },
  EUR: { symbol: '€', name: 'Евро' },
  GBP: { symbol: '£', name: 'Фунт стерлингов' },
  AMD: { symbol: '֏', name: 'Армянский драм' },
  GEL: { symbol: '₾', name: 'Грузинский лари' },
  RUB: { symbol: '₽', name: 'Российский рубль' },
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
    tile.append(el('div', `change ${kind}`, `${sign} ${Math.abs(change).toFixed(3)}%`));
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
  chartSub.textContent = `${info(selectedQuote).name}: сколько ${selectedQuote} дают за 1 ${BASE}`;
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

  item.append(main, badge);
  if (canEdit) item.append(remove);
  return item;
}

// ---------- Доступ владельца ----------

let canEdit = false;
const ownerBar = byId<HTMLDivElement>('owner-bar');
const ownerText = byId<HTMLSpanElement>('owner-text');
const ownerButton = byId<HTMLButtonElement>('owner-button');
const ownerForm = byId<HTMLFormElement>('owner-form');
const ownerInput = byId<HTMLInputElement>('owner-input');

// Узнаём у сервера, можно ли менять правила, и показываем или прячем форму.
async function loadAccess(): Promise<void> {
  canEdit = (await api.access()).canEdit;
  const hasToken = ownerToken.get() !== null;
  ruleForm.hidden = !canEdit;
  ownerForm.hidden = true;
  // Защита выключена (локальная разработка) — панель владельца не нужна.
  ownerBar.hidden = canEdit && !hasToken;
  if (canEdit) {
    ownerText.textContent = 'Вы вошли как владелец.';
    ownerButton.textContent = 'Выйти';
  } else {
    ownerText.textContent = hasToken ? 'Ключ владельца не подошёл. Правила только для просмотра.' : 'Правила только для просмотра.';
    ownerButton.textContent = 'Я владелец';
  }
}

ownerButton.addEventListener('click', async () => {
  if (canEdit) {
    ownerToken.set(null);
    await loadAccess();
    await loadRules();
    return;
  }
  ownerBar.hidden = true;
  ownerForm.hidden = false;
  ownerInput.focus();
});

byId<HTMLButtonElement>('owner-cancel').addEventListener('click', () => {
  ownerForm.hidden = true;
  ownerBar.hidden = false;
});

ownerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  ownerToken.set(ownerInput.value.trim());
  ownerInput.value = '';
  await loadAccess();
  await loadRules();
});

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
const convOthers = byId<HTMLUListElement>('conv-others');
const convQuick = byId<HTMLDivElement>('conv-quick');

const moneyFormat = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const valueFormat = new Intl.NumberFormat('ru-RU');

for (const code of [BASE, ...QUOTES]) {
  convFrom.append(new Option(`${code} · ${info(code).name}`, code));
  convTo.append(new Option(`${code} · ${info(code).name}`, code));
}
convFrom.value = BASE;
convTo.value = QUOTES[0];

// Номер последнего запроса: ответ на устаревший запрос не должен перезаписать новый.
let convRequest = 0;

// Та же сумма во всех остальных валютах.
async function convertOthers(from: string, amount: number, request: number): Promise<void> {
  const targets = [BASE, ...QUOTES].filter((code) => code !== from && code !== convTo.value);
  const results = await Promise.allSettled(targets.map((code) => api.convert(from, code, amount)));
  if (request !== convRequest) return;
  convOthers.replaceChildren(
    ...targets.map((code, i) => {
      const item = el('li');
      const result = results[i];
      item.append(el('span', 'muted', `${code} · ${info(code).name}`));
      item.append(
        el('span', 'other-value', result.status === 'fulfilled' ? `${moneyFormat.format(result.value.result)} ${info(code).symbol}` : 'нет курса'),
      );
      return item;
    }),
  );
}

async function convert(): Promise<void> {
  const amount = Number(convAmount.value);
  const from = convFrom.value;
  const to = convTo.value;
  const request = ++convRequest;
  convQuick.querySelectorAll('button').forEach((b) => b.classList.toggle('active', Number(b.dataset.amount) === amount));

  if (!(amount > 0)) {
    convValue.textContent = '—';
    convMeta.textContent = 'Введите сумму больше нуля';
    convOthers.replaceChildren();
    return;
  }
  convertOthers(from, amount, request);
  if (from === to) {
    convValue.textContent = `${moneyFormat.format(amount)} ${info(to).symbol}`;
    convMeta.textContent = 'Одинаковые валюты';
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
for (const amount of [1, 10, 100, 1000, 10000]) {
  const chip = el('button', 'chip', valueFormat.format(amount));
  chip.type = 'button';
  chip.dataset.amount = String(amount);
  chip.addEventListener('click', () => {
    convAmount.value = String(amount);
    convert();
  });
  convQuick.append(chip);
}

// ---------- Купюры ----------

const banknoteTabs = byId<HTMLDivElement>('banknote-tabs');
const banknoteAbout = byId<HTMLParagraphElement>('banknote-about');
const banknoteGrid = byId<HTMLDivElement>('banknote-grid');
const banknoteHint = byId<HTMLParagraphElement>('banknote-hint');

let selectedSeries = BANKNOTES[0];

function renderBanknote(series: BanknoteSeries, banknote: Banknote, rate: number | null, target: string): HTMLElement {
  const card = el('figure', 'banknote');
  const label = `${valueFormat.format(banknote.value)} ${series.code}`;

  const caption = el('figcaption');
  caption.append(el('div', 'bill-value', `${valueFormat.format(banknote.value)} ${info(series.code).symbol}`));
  if (rate !== null) {
    caption.append(el('div', 'muted small', `≈ ${moneyFormat.format(banknote.value * rate)} ${info(target).symbol}`));
  }
  if (banknote.note) caption.append(el('div', 'muted small', banknote.note));
  if (banknote.extra) caption.append(el('div', 'muted small', banknote.extra));

  card.append(drawBanknote(series.code, banknote, label), caption);
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

// ---------- Тема ----------

type Theme = 'light' | 'dark';
const THEME_KEY = 'currency-alerts-theme';
const themeButton = byId<HTMLButtonElement>('theme-toggle');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === 'light' || chosen === 'dark') return chosen;
  return systemDark.matches ? 'dark' : 'light';
}

// Цвета графика берутся из CSS, поэтому после смены темы их нужно перечитать.
function recolorChart(): void {
  if (!chart) return;
  const dataset = chart.data.datasets[0];
  dataset.borderColor = cssVar('--accent');
  dataset.pointBackgroundColor = cssVar('--accent');
  const scales = chart.options.scales!;
  scales.x!.ticks!.color = cssVar('--muted');
  scales.y!.ticks!.color = cssVar('--muted');
  scales.y!.grid!.color = cssVar('--grid');
  chart.update('none');
}

function updateThemeButton(): void {
  const dark = currentTheme() === 'dark';
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.title = dark ? 'Включить светлую тему' : 'Включить тёмную тему';
  themeButton.setAttribute('aria-label', themeButton.title);
}

function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // хранилище недоступно (приватный режим) — тема просто не запомнится
  }
  recolorChart();
  updateThemeButton();
}

themeButton.addEventListener('click', () => {
  const root = document.documentElement;
  // На время смены темы цвета плавно перетекают, потом переходы снова выключаются.
  root.classList.add('theme-fade');
  setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  window.setTimeout(() => root.classList.remove('theme-fade'), 400);
});

systemDark.addEventListener('change', () => {
  recolorChart();
  updateThemeButton();
});
updateThemeButton();

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

loadAccess()
  .catch(() => undefined)
  .finally(() => {
    refresh();
    setInterval(refresh, REFRESH_MS);
  });
