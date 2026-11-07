# Внешний API курсов валют

## Выбор: Open Exchange Rates

Причина: на бесплатном тарифе курсы обновляются раз в час, как и нужно по плану.

Проверено 2026-11-07. Условия тарифов могут измениться.

| API | Обновление | Лимит бесплатно | Ключ | Итог |
|---|---|---|---|---|
| Open Exchange Rates | Раз в час | 1000 запросов в месяц, база только USD | Нужен | Выбран |
| Frankfurter | Раз в рабочий день | По сторонним источникам, нет | Не нужен | Курсы только дневные |
| ExchangeRate-API | Раз в день | 1500 запросов в месяц | Нужен | Курсы только дневные |

## Лимит запросов

Один запрос в час — максимум 24 × 31 = 744 запроса в месяц. Запас до лимита
около 250 запросов, поэтому повторять запросы при сбоях нужно аккуратно.

## Запрос

```
GET https://openexchangerates.org/api/latest.json?app_id=<КЛЮЧ>&symbols=EUR,GBP
```

- `app_id` — ключ API. Брать из переменной окружения `OXR_APP_ID`, в git не добавлять.
- `symbols` — нужные валюты. Без этого параметра придут все.

## Успешный ответ

```json
{
  "disclaimer": "Usage subject to terms: https://openexchangerates.org/terms",
  "license": "https://openexchangerates.org/license",
  "timestamp": 1794045571,
  "base": "USD",
  "rates": {
    "EUR": 0.89715,
    "GBP": 0.748671
  }
}
```

- `timestamp` — время курса в секундах от 1970-01-01 UTC. В Java: `Instant.ofEpochSecond(...)`.
- `base` — базовая валюта.
- `rates` — сколько единиц валюты дают за 1 единицу базовой: 1 USD = 0,89715 EUR.

## Ответ с ошибкой

```json
{
  "error": true,
  "status": 403,
  "message": "missing_app_id",
  "description": "No App ID provided. ..."
}
```

Такой ответ получен при запросе без ключа. Клиент должен проверять статус ответа
и не считать его курсами.

## Что учесть в коде

- Читать курсы сразу в `BigDecimal`, без промежуточного `double`.
- Пары без USD считать через доллар: EUR/GBP = (USD→GBP) ÷ (USD→EUR).
  При делении `BigDecimal` указывать точность и округление, иначе бесконечная дробь вызовет исключение.
- Не сохранять курс повторно, если `timestamp` не изменился.
- Не писать в логи полный URL запроса: в нём есть ключ.

## Источники

- [Тарифы Open Exchange Rates](https://openexchangerates.org/signup)
- [ExchangeRate-API](https://exchangerate-api.com/)
- [Frankfurter в каталоге API](https://freeapihub.com/apis/frankfurter-api); дневное обновление проверено запросом к `api.frankfurter.dev`
