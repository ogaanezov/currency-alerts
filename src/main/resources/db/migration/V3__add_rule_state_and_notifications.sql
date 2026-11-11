ALTER TABLE alert_rules ADD COLUMN triggered BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE notifications (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rule_id    BIGINT         NOT NULL REFERENCES alert_rules (id) ON DELETE CASCADE,
    rate       NUMERIC(19, 8) NOT NULL CHECK (rate > 0),
    created_at TIMESTAMPTZ    NOT NULL
);