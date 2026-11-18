// Купюры в обращении. Только данные для нарисованных карточек, без изображений.
// color — основной цвет купюры, note — что на ней изображено (если известно точно).

export interface Banknote {
  value: number;
  color: string;
  note?: string;
}

export interface BanknoteSeries {
  code: string;
  title: string;
  about: string;
  approximateColors?: boolean;
  notes: Banknote[];
}

export const BANKNOTES: BanknoteSeries[] = [
  {
    code: 'USD',
    title: 'Доллар США',
    about: 'Все купюры одного размера и в основном зелёные; у новых выпусков от $5 есть цветной фон.',
    notes: [
      { value: 1, color: '#6b8f71', note: 'Джордж Вашингтон' },
      { value: 2, color: '#5f8a66', note: 'Томас Джефферсон' },
      { value: 5, color: '#8a6fa8', note: 'Авраам Линкольн' },
      { value: 10, color: '#c98a4b', note: 'Александр Гамильтон' },
      { value: 20, color: '#7f9a62', note: 'Эндрю Джексон' },
      { value: 50, color: '#b86f8f', note: 'Улисс Грант' },
      { value: 100, color: '#4f8fb8', note: 'Бенджамин Франклин' },
    ],
  },
  {
    code: 'EUR',
    title: 'Евро',
    about: 'Чем больше номинал, тем крупнее купюра. На купюрах — архитектурные стили Европы.',
    notes: [
      { value: 5, color: '#8b8f96', note: 'Античность' },
      { value: 10, color: '#c2484a', note: 'Романский стиль' },
      { value: 20, color: '#3d6fb6', note: 'Готика' },
      { value: 50, color: '#e0893a', note: 'Ренессанс' },
      { value: 100, color: '#3f9a6a', note: 'Барокко и рококо' },
      { value: 200, color: '#c9a03d', note: 'Модерн' },
      { value: 500, color: '#8a5aa8', note: 'Архитектура XX века, больше не выпускается' },
    ],
  },
  {
    code: 'GBP',
    title: 'Фунт стерлингов',
    about: 'Купюры Банка Англии, пластиковые (полимерные).',
    notes: [
      { value: 5, color: '#3a9a96', note: 'Уинстон Черчилль' },
      { value: 10, color: '#d0803a', note: 'Джейн Остин' },
      { value: 20, color: '#7a4f9a', note: 'Уильям Тёрнер' },
      { value: 50, color: '#c0443e', note: 'Алан Тьюринг' },
    ],
  },
  {
    code: 'AMD',
    title: 'Армянский драм',
    about: 'Серия 2018 года на гибридной основе: бумага в защитной плёнке. На купюрах — деятели армянской культуры.',
    approximateColors: true,
    notes: [
      { value: 1000, color: '#7a5aa0', note: 'Паруйр Севак' },
      { value: 2000, color: '#3f8a8a' },
      { value: 5000, color: '#9a5a3a', note: 'Уильям Сароян' },
      { value: 10000, color: '#b0704a' },
      { value: 20000, color: '#4f8a80', note: 'Иван Айвазовский' },
      { value: 50000, color: '#7d7a6e' },
    ],
  },
  {
    code: 'GEL',
    title: 'Грузинский лари',
    about: 'Серия 2016–2019 годов. В 2021 году цвета 5 и 20 лари изменили, чтобы их не путали.',
    approximateColors: true,
    notes: [
      { value: 5, color: '#9a6a3f', note: 'Иване Джавахишвили' },
      { value: 10, color: '#4f8a9a' },
      { value: 20, color: '#8a4f6a' },
      { value: 50, color: '#a08a3f' },
      { value: 100, color: '#5f7a4f' },
    ],
  },
];
