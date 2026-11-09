CREATE TABLE alert_rules (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    base_currency  CHAR(3)        NOT NULL,
    quote_currency CHAR(3)        NOT NULL,
    direction      VARCHAR(5)     NOT NULL CHECK (direction IN ('ABOVE', 'BELOW')),
    threshold      NUMERIC(19, 8) NOT NULL CHECK (threshold > 0)
);