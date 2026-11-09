CREATE TABLE exchange_rates (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    base_currency  CHAR(3)        NOT NULL,
    quote_currency CHAR(3)        NOT NULL,
    rate           NUMERIC(19, 8) NOT NULL CHECK (rate > 0),
    rate_time      TIMESTAMPTZ    NOT NULL,
    UNIQUE (base_currency, quote_currency, rate_time)
);