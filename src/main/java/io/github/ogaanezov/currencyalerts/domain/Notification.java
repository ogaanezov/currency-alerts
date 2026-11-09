package io.github.ogaanezov.currencyalerts.domain;

import java.math.BigDecimal;
import java.time.Instant;

public record Notification(AlertRule rule, BigDecimal rate, Instant createdAt) {

    public Notification {
        if (rule == null || rate == null || createdAt == null) {
            throw new IllegalArgumentException("Rule, rate and creation time must not be null");
        }
    }
}