// Купюры в обращении. Только данные для нарисованных карточек, без фотографий.
// color — основной цвет купюры, note — кто или что на ней изображено.

export interface Banknote {
  value: number;
  color: string;
  note?: string;
  // Подпись под купюрой, например «старая серия».
  extra?: string;
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
      { value: 1, color: '#6f8f6a', note: 'Джордж Вашингтон' },
      { value: 2, color: '#62886a', note: 'Томас Джефферсон' },
      { value: 5, color: '#8a74a8', note: 'Авраам Линкольн' },
      { value: 10, color: '#c98a4b', note: 'Александр Гамильтон' },
      { value: 20, color: '#7f9a62', note: 'Эндрю Джексон' },
      { value: 50, color: '#b8708f', note: 'Улисс Грант' },
      { value: 100, color: '#4f8fb8', note: 'Бенджамин Франклин' },
    ],
  },
  {
    code: 'EUR',
    title: 'Евро',
    about: 'Чем больше номинал, тем крупнее купюра. На лицевой стороне — окна и арки разных архитектурных стилей Европы.',
    notes: [
      { value: 5, color: '#8b8f96', note: 'Античность' },
      { value: 10, color: '#c2484a', note: 'Романский стиль' },
      { value: 20, color: '#3d6fb6', note: 'Готика' },
      { value: 50, color: '#e0893a', note: 'Ренессанс' },
      { value: 100, color: '#3f9a6a', note: 'Барокко и рококо' },
      { value: 200, color: '#c9a03d', note: 'Модерн, архитектура из стекла и железа' },
    ],
  },
  {
    code: 'GBP',
    title: 'Фунт стерлингов',
    about: 'Купюры Банка Англии, пластиковые (полимерные), с прозрачным окном.',
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
      { value: 2000, color: '#9a6a45', note: 'Тигран Петросян' },
      { value: 5000, color: '#b0643a', note: 'Уильям Сароян' },
      { value: 10000, color: '#7d6f8f', note: 'Комитас' },
      { value: 20000, color: '#4f8a80', note: 'Иван Айвазовский' },
    ],
  },
  {
    code: 'GEL',
    title: 'Грузинский лари',
    about: 'Купюры 5–100 лари — серия 2016–2019 годов, 200 лари выпускается с 2006 года.',
    approximateColors: true,
    notes: [
      { value: 5, color: '#9a6a3f', note: 'Иване Джавахишвили' },
      { value: 10, color: '#3f78b0', note: 'Акакий Церетели' },
      { value: 20, color: '#b0443f', note: 'Илья Чавчавадзе' },
      { value: 50, color: '#a08a3f', note: 'Царица Тамара' },
      { value: 100, color: '#7a4f9a', note: 'Шота Руставели' },
      { value: 200, color: '#3f8a7a', note: 'Какуца Чолокашвили' },
    ],
  },
  {
    code: 'RUB',
    title: 'Российский рубль',
    about: 'Купюры Банка России. На каждой — город и его достопримечательность, портретов нет.',
    approximateColors: true,
    notes: [
      { value: 5, color: '#4f8a7a', note: 'Великий Новгород' },
      { value: 10, color: '#8a7a4f', note: 'Красноярск' },
      { value: 50, color: '#4f6f9a', note: 'Санкт-Петербург' },
      { value: 100, color: '#9a6a4f', note: 'Москва' },
      { value: 200, color: '#4f8a5a', note: 'Севастополь' },
      { value: 500, color: '#7a5a9a', note: 'Архангельск' },
      { value: 1000, color: '#3f7a8a', note: 'Ярославль' },
      { value: 2000, color: '#3f5f9a', note: 'Владивосток' },
      { value: 5000, color: '#b0553f', note: 'Хабаровск' },
    ],
  },
];
