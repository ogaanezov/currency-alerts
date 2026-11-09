package io.github.ogaanezov.currencyalerts.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.time.Instant;

import org.junit.jupiter.api.Test;

class NotificationTests {

    private final AlertRule rule = new AlertRule(
            new CurrencyPair(new Currency("USD"), new Currency("EUR")),
            Direction.ABOVE,
            new BigDecimal("0.95"));
    private final Instant now = Instant.parse("2026-11-09T10:00:00Z");

    @Test
    void createsNotification() {
        Notification notification = new Notification(rule, new BigDecimal("0.96"), now);

        assertEquals(rule, notification.rule());
    }

    @Test
    void rejectsNullRule() {
        assertThrows(IllegalArgumentException.class, () -> new Notification(null, new BigDecimal("0.96"), now));
    }
}